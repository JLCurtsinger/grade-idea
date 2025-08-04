import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { incrementUserTokens } from '@/lib/firebase-admin';
import Stripe from 'stripe';

// Map plan names to Stripe price IDs
const getStripePriceId = (planName: string): string => {
  const priceMap: Record<string, string> = {
    'basic': process.env.STRIPE_PRICE_ID_BASIC || '',
    'standard': process.env.STRIPE_PRICE_ID_STANDARD || '',
    'pro': process.env.STRIPE_PRICE_ID_PRO || '',
    'starter': process.env.STRIPE_PRICE_ID_STARTER || '',
    'popular': process.env.STRIPE_PRICE_ID_POPULAR || '',
    'value': process.env.STRIPE_PRICE_ID_VALUE || '',
  };
  
  return priceMap[planName] || '';
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
      
      try {
        // Extract user ID and plan name
        const userId = session.client_reference_id;
        const planName = session.metadata?.planName;
        
        if (!userId || !planName) {
          console.error('Missing userId or planName in session:', session.id);
          return NextResponse.json(
            { error: 'Missing user or plan information' },
            { status: 400 }
          );
        }

        // Map plan name to price ID for token count lookup
        const plan = planName.toLowerCase();
        const priceId = getStripePriceId(plan);
        
        if (!priceId) {
          console.error('Invalid plan name:', planName);
          return NextResponse.json(
            { error: 'Invalid plan name' },
            { status: 400 }
          );
        }

        // Get token count for this price ID
        const tokenCount = getTokenCountForPriceId(priceId);
        
        if (tokenCount === 0) {
          console.error('Invalid price ID:', priceId);
          return NextResponse.json(
            { error: 'Invalid price ID' },
            { status: 400 }
          );
        }

        // Increment user's token balance
        await incrementUserTokens(userId, tokenCount);
        
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