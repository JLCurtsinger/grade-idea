import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { incrementUserTokens, getAdminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';
import { getRoast, updateRoast, createRoastDocWithId } from "@/lib/roast";
import { generateRoast } from "@/lib/openai/roast";
import { FieldValue } from 'firebase-admin/firestore';

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

async function handleRoastCheckoutCompleted(session: Stripe.Checkout.Session) {
  const roastId = session?.metadata?.roastId;
  if (!roastId) {
    console.error('[roast][webhook][error] Missing roastId in session metadata');
    return;
  }

  console.log(`[roast][webhook][hit] → { eventId: "${session.id}", live: ${session.livemode === true} }`);

  // Extract metadata
  const idea = (session?.metadata?.idea || '').toString();
  const harshness = Number(session?.metadata?.harshness || 2) || 2;
  const userId = session?.metadata?.userId || null;
  const sessionId = session.id;
  
  console.log(`[roast][webhook][meta] → { roastId: "${roastId}", userId: "${userId || 'null'}", harshness: ${harshness}, feature: "roast" }`);
  
  // Check if roast doc exists and get current status
  const existingDoc = await getRoast(roastId);
  const existsBefore = !!existingDoc;
  
  // Idempotency: if already processed this session, return early
  if (existingDoc?.sessionId === sessionId && existingDoc?.status === "ready") {
    console.log(`[roast][webhook] Already processed this session, returning early { roastId: "${roastId}", sessionId: "${sessionId}" }`);
    return;
  }

  // Create or update roast document in Firestore - set status to 'processing'
  console.log(`[roast][webhook][upsert] → { path: "roasts/${roastId}" }`);
  
  try {
    if (!existingDoc) {
      // Create new doc with status 'processing'
      await createRoastDocWithId(roastId, {
        idea,
        harshness: harshness as 1|2|3,
        source: "stripe",
        paid: true,
        status: "processing",
        sessionId,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else if (existingDoc.status !== "ready") {
      // Update existing doc to 'processing' status
      await updateRoast(roastId, {
        paid: true,
        status: "processing",
        sessionId,
        userId,
        updatedAt: Date.now(),
      });
    }
  } catch (error) {
    console.error(`[roast][webhook][error] Firestore write failed for roastId: "${roastId}":`, error);
    throw new Error(`Failed to create/update roast document: ${error}`);
  }

  // Generate roast
  console.log(`[roast][webhook][generate] → { roastId: "${roastId}" }`);
  try {
    const result = await generateRoast(idea, harshness as 1|2|3);
    
    // Update doc with result and status 'ready'
    await updateRoast(roastId, { 
      status: "ready", 
      result, 
      updatedAt: Date.now() 
    });
    
    // Log completion
    console.log(`[roast][webhook][ready] → { roastId: "${roastId}" }`);
  } catch (error) {
    console.error(`[roast][webhook][error] Roast generation failed for roastId: "${roastId}":`, error);
    
    // Set status to 'error' but don't throw - return 200 OK to prevent webhook retries
    await updateRoast(roastId, { 
      status: "error", 
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      updatedAt: Date.now() 
    });
    
    // Log error but don't throw - this prevents Stripe from retrying
    console.error(`[roast][webhook][error] Roast generation failed, marked as error: ${error}`);
  }
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  let event: Stripe.Event;

  console.log('=== STRIPE WEBHOOK RECEIVED ===');
  console.log('Signature header present:', !!signature);
  console.log('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET);

  if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
    const raw = await req.text(); // important
    try {
      event = stripe.webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
      console.log('Webhook signature verified successfully');
    } catch (err: any) {
      console.error("Stripe signature verification failed:", err?.message);
      return new NextResponse("Bad signature", { status: 400 });
    }
  } else {
    // dev fallback
    console.log('Using dev fallback - no signature verification');
    event = await req.json();
  }

  console.log('Webhook event type:', event.type);
  console.log('Webhook event ID:', event.id);

  // Handle checkout.session.completed events
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    console.log('=== CHECKOUT SESSION COMPLETED ===');
    console.log('Session ID:', session.id);
    console.log('Session metadata:', JSON.stringify(session.metadata, null, 2));
    console.log('Client reference ID:', session.client_reference_id);
    
    // Check if this is a roast checkout
    if (session?.metadata?.roastId) {
      console.log(`[roast][webhook][hit] ${event.type} livemode:${event.livemode}`);
      console.log('Detected roast checkout, processing...');
      try {
        await handleRoastCheckoutCompleted(session);
        console.log('Roast checkout processing completed successfully');
        return NextResponse.json({ received: true });
      } catch (error) {
        console.error(`Roast checkout processing failed:`, error);
        // Return 500 for webhook failures so Stripe knows to retry
        return NextResponse.json(
          { error: 'Failed to process roast checkout' },
          { status: 500 }
        );
      }
    } else {
      console.log('Not a roast checkout, processing as token purchase...');
      
      // Handle token purchase (existing logic)
      try {
        // Extract user ID and plan name
        const userId = session.client_reference_id;
        const planName = session.metadata?.planName;
        const normalizedPlan = session.metadata?.normalizedPlan;
        
        console.log('Token purchase data:', { userId, planName, normalizedPlan });
        
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
            { status: 500 }
          );
        }

        // Get token count for this price ID
        const tokenCount = getTokenCountForPriceId(priceId);
        console.log('Token count lookup:', { priceId, tokenCount });
        
        if (tokenCount === 0) {
          console.error('No token count found for price ID:', priceId);
          return NextResponse.json(
            { error: 'Invalid price ID' },
            { status: 500 }
          );
        }

        // Increment user's token balance
        console.log(`Incrementing ${tokenCount} tokens for user ${userId}`);
        await incrementUserTokens(userId, tokenCount, 'purchase');
        
        console.log(`Successfully added ${tokenCount} tokens to user ${userId}`);
        
        // Send token confirmation email (idempotent handled at API route)
        try {
          // Get user email from session metadata or fetch from user document
          let userEmail = session.customer_details?.email;
          if (!userEmail) {
            // Fallback: get email from user document
            const userRef = getAdminDb().collection('users').doc(userId);
            const userDoc = await userRef.get();
            if (userDoc.exists) {
              userEmail = userDoc.data()?.email;
            }
          }
          
          if (userEmail) {
            await fetch(`${process.env.APP_BASE_URL}/api/email/token-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: session.id,
                uid: userId,
                email: userEmail,
                tokensAdded: tokenCount,
              }),
            });
            console.log(`Token confirmation email sent to ${userEmail}`);
          } else {
            console.warn('Could not send token confirmation email: no user email found');
          }
        } catch (emailError) {
          console.error('Error sending token confirmation email:', emailError);
          // Don't fail the webhook for email errors
        }
        
        console.log('Token purchase processing completed successfully');
        return NextResponse.json({ received: true });
      } catch (error) {
        console.error('Error processing token purchase:', error);
        return NextResponse.json(
          { error: 'Failed to process token purchase' },
          { status: 500 }
        );
      }
    }
  }

  // Handle other event types
  console.log(`Unhandled event type: ${event.type}`);
  return NextResponse.json({ received: true });
} 