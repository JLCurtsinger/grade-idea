import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

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

// Validate environment variables
const validateEnvironmentVariables = () => {
  const requiredVars = [
    'STRIPE_PRICE_ID_STARTER',
    'STRIPE_PRICE_ID_POPULAR', 
    'STRIPE_PRICE_ID_VALUE',
    'STRIPE_PRICE_ID_BASIC',
    'STRIPE_PRICE_ID_STANDARD',
    'STRIPE_PRICE_ID_PRO'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    return false;
  }
  return true;
};

export async function POST(request: NextRequest) {
  try {
    const { planName, userId } = await request.json();

    // Comprehensive logging
    console.log('=== CHECKOUT SESSION CREATION ===');
    console.log('Received request:', { planName, userId });

    // Validate inputs
    if (!planName || !userId) {
      console.error('Missing required fields:', { planName, userId });
      return NextResponse.json(
        { error: 'Missing required fields: planName and userId' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!validateEnvironmentVariables()) {
      console.error('Environment variables not properly configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Normalize plan name
    const normalizedPlan = normalizePlanName(planName);
    console.log('Plan normalization:', { original: planName, normalized: normalizedPlan });
    
    if (!normalizedPlan) {
      console.error('Invalid plan name:', planName);
      return NextResponse.json(
        { error: `Invalid plan name: "${planName}". Valid plans are: Starter Pack, Popular Pack, Value Pack, Basic, Standard, Pro` },
        { status: 400 }
      );
    }

    // Get Stripe price ID
    const stripePriceId = getStripePriceId(normalizedPlan);
    console.log('Stripe price mapping:', { normalizedPlan, stripePriceId });
    
    if (!stripePriceId) {
      console.error('No Stripe price ID found for plan:', normalizedPlan);
      return NextResponse.json(
        { error: `No price configuration found for plan: ${normalizedPlan}` },
        { status: 500 }
      );
    }

    // Determine mode based on plan type
    const isSubscription = ['basic', 'standard', 'pro'].includes(normalizedPlan);
    const mode = isSubscription ? 'subscription' : 'payment';

    // Get origin for success/cancel URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';

    console.log('Creating checkout session:', { 
      normalizedPlan, 
      stripePriceId, 
      mode, 
      userId,
      origin 
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      client_reference_id: userId, // Store Firebase UID for webhook
      metadata: {
        userId: userId,
        planName: planName,
        normalizedPlan: normalizedPlan,
      },
    });

    console.log('Stripe session created successfully:', { sessionId: session.id, url: session.url });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 