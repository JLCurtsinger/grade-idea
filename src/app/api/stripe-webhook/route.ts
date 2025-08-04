import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { incrementUserTokens } from '@/lib/firebase-admin';
import Stripe from 'stripe';

// Robust plan name normalization (server-side)
const normalizePlanName = (plan: string): 'basic' | 'standard' | 'pro' | 'starter' | 'popular' | 'value' | null => {
  if (!plan) return null;
  
  const cleaned = plan.trim().toLowerCase();
  
  // Handle various input formats
  if (cleaned.includes('starter') || cleaned === 'starter pack') return 'starter';
  if (cleaned.includes('popular') || cleaned === 'popular pack') return 'popular';
  if (cleaned.includes('value') || cleaned === 'value pack') return 'value';
  if (cleaned.includes('basic')) return 'basic';
  if (cleaned.includes('standard')) return 'standard';
  if (cleaned.includes('pro')) return 'pro';
  
  return null;
};

// Map normalized plan names to Stripe price IDs
const getStripePriceId = (normalizedPlan: string): string => {
  const priceMap: Record<string, string> = {
    'basic': process.env.STRIPE_PRICE_ID_BASIC || '',
    'standard': process.env.STRIPE_PRICE_ID_STANDARD || '',
    'pro': process.env.STRIPE_PRICE_ID_PRO || '',
    'starter': process.env.STRIPE_PRICE_ID_STARTER || '',
    'popular': process.env.STRIPE_PRICE_ID_POPULAR || '',
    'value': process.env.STRIPE_PRICE_ID_VALUE || '',
  };
  
  return priceMap[normalizedPlan] || '';
};

// Map Stripe price IDs to token counts
const getTokenCountForPriceId = (priceId: string): number => {
  const tokenMap: Record<string, number> = {
    [process.env.STRIPE_PRICE_ID_STARTER!]: 10,
    [process.env.STRIPE_PRICE_ID_POPULAR!]: 25,
    [process.env.STRIPE_PRICE_ID_VALUE!]: 60,
    [process.env.STRIPE_PRICE_ID_BASIC!]: 12,
    [process.env.STRIPE_PRICE_ID_STANDARD!]: 28,
    [process.env.STRIPE_PRICE_ID_PRO!]: 45,
  };
  
  return tokenMap[priceId] || 0;
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('=== WEBHOOK: CHECKOUT SESSION COMPLETED ===');
      console.log('Session ID:', session.id);
      console.log('Session metadata:', session.metadata);
      console.log('Client reference ID:', session.client_reference_id);
      
      try {
        // Extract user ID and plan name
        const userId = session.client_reference_id;
        const planName = session.metadata?.planName;
        const normalizedPlan = session.metadata?.normalizedPlan;
        
        console.log('Extracted data:', { userId, planName, normalizedPlan });
        
        if (!userId || !planName) {
          console.error('Missing userId or planName in session:', session.id);
          return NextResponse.json(
            { error: 'Missing user or plan information' },
            { status: 400 }
          );
        }

        // Use normalized plan if available, otherwise normalize the plan name
        let finalNormalizedPlan = normalizedPlan;
        if (!finalNormalizedPlan) {
          finalNormalizedPlan = normalizePlanName(planName);
          console.log('Plan normalization:', { original: planName, normalized: finalNormalizedPlan });
        }
        
        if (!finalNormalizedPlan) {
          console.error('Invalid plan name:', planName);
          return NextResponse.json(
            { error: 'Invalid plan name' },
            { status: 400 }
          );
        }

        // Map normalized plan to price ID for token count lookup
        const priceId = getStripePriceId(finalNormalizedPlan);
        console.log('Price ID mapping:', { normalizedPlan: finalNormalizedPlan, priceId });
        
        if (!priceId) {
          console.error('No price ID found for normalized plan:', finalNormalizedPlan);
          return NextResponse.json(
            { error: 'Invalid plan configuration' },
            { status: 400 }
          );
        }

        // Get token count for this price ID
        const tokenCount = getTokenCountForPriceId(priceId);
        console.log('Token count lookup:', { priceId, tokenCount });
        
        if (tokenCount === 0) {
          console.error('No token count found for price ID:', priceId);
          return NextResponse.json(
            { error: 'Invalid price ID' },
            { status: 400 }
          );
        }

        // Increment user's token balance
        console.log(`Incrementing ${tokenCount} tokens for user ${userId}`);
        await incrementUserTokens(userId, tokenCount, 'purchase');
        
        console.log(`Successfully added ${tokenCount} tokens to user ${userId}`);
        
        return NextResponse.json({ received: true });
      } catch (error) {
        console.error('Error processing checkout session:', error);
        return NextResponse.json(
          { error: 'Failed to process checkout session' },
          { status: 500 }
        );
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true });
  }
} 