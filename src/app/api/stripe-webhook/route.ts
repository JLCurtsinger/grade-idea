import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { incrementUserTokens } from '@/lib/firebase-admin';
import Stripe from 'stripe';

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
        // Extract user ID and price ID
        const userId = session.client_reference_id;
        const priceId = session.metadata?.priceId;
        
        if (!userId || !priceId) {
          console.error('Missing userId or priceId in session:', session.id);
          return NextResponse.json(
            { error: 'Missing user or price information' },
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