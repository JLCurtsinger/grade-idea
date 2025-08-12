import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { incrementUserTokens, getAdminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';
import { getRoast, updateRoast, createRoastDocWithId } from "@/lib/roast";
import { generateRoast } from "@/lib/openai/roast";

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

async function handleRoastCheckoutCompleted(session: any) {
  const roastId = session?.metadata?.roastId;
  if (!roastId) return;

  const idea = (session?.metadata?.idea || "").toString();
  const hNum = Number(session?.metadata?.harshness);
  const harshness: 1|2|3 = ([1,2,3] as const).includes(hNum as any) ? (hNum as 1|2|3) : 2;

  const doc = await getRoast(roastId);
  if (!doc) {
    if (typeof createRoastDocWithId === "function") {
      await createRoastDocWithId(roastId, {
        idea,
        harshness,
        userId: null,
        paid: true,
        source: "stripe",
        status: "processing",
        sessionId: session.id,
      });
    } else {
      // Fallback: update if helper not available (should exist already)
      await updateRoast(roastId, {
        idea, harshness, userId: null, paid: true, source: "stripe", status: "processing", sessionId: session.id,
      });
    }
  } else if (doc.status !== "ready" || !doc.result) {
    await updateRoast(roastId, { paid: true, status: "processing", sessionId: session.id });
  }

  try {
    const result = await generateRoast(idea || doc?.idea || "Your idea", harshness || (doc?.harshness as 1|2|3) || 2);
    await updateRoast(roastId, { status: "ready", result });
  } catch {
    await updateRoast(roastId, { status: "error" });
  }
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  let event: Stripe.Event;

  if (process.env.STRIPE_WEBHOOK_SECRET && signature) {
    const raw = await req.text(); // important
    try {
      event = stripe.webhooks.constructEvent(raw, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Stripe signature verification failed:", err?.message);
      return new NextResponse("Bad signature", { status: 400 });
    }
  } else {
    // dev fallback
    event = await req.json();
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = (event.data.object as any);
    if (session?.metadata?.roastId) {
      console.log("[roast][webhook] type=", event.type, "roastId=", session.metadata.roastId);
      await handleRoastCheckoutCompleted(session);
      console.log("[roast][ready] roastId=", session.metadata.roastId);
      return NextResponse.json({ ok: true });
    }
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('=== WEBHOOK: CHECKOUT SESSION COMPLETED ===');
      console.log('Session ID:', session.id);
      console.log('Session metadata:', session.metadata);
      console.log('Client reference ID:', session.client_reference_id);
      
      // Handle token purchase (existing logic)
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
        
        return NextResponse.json({ received: true });
      } catch (error) {
        console.error('Error processing checkout session:', error);
        return NextResponse.json(
          { error: 'Failed to process checkout session' },
          { status: 500 }
        );
      }

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return NextResponse.json({ received: true });
  }
} 