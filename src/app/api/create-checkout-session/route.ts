import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

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

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json();

    // Validate inputs
    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId and userId' },
        { status: 400 }
      );
    }

    // Map plan name to actual Stripe price ID
    const stripePriceId = getStripePriceId(priceId);
    
    if (!stripePriceId) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Get origin for success/cancel URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: userId, // Store Firebase UID for webhook
      metadata: {
        userId: userId,
        priceId: priceId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 