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
  console.log('=== ROAST WEBHOOK: CHECKOUT SESSION COMPLETED ===');
  console.log('Full session object:', JSON.stringify(session, null, 2));
  console.log('Session metadata:', JSON.stringify(session.metadata, null, 2));
  
  const roastId = session?.metadata?.roastId;
  if (!roastId) {
    console.error('[roast][webhook] Missing roastId in session metadata');
    return;
  }

  console.log(`[roast][webhook] Processing roast checkout for roastId: "${roastId}"`);

  // Extract metadata
  const idea = (session?.metadata?.idea || '').toString();
  const harshness = Number(session?.metadata?.harshness || 2) || 2;
  const userId = session?.metadata?.userId || null;
  const sessionId = session.id;
  const livemode = !!session.livemode;
  
  console.log(`[roast][webhook] Extracted data:`, {
    roastId,
    idea: idea.substring(0, 100) + (idea.length > 100 ? '...' : ''),
    harshness,
    userId,
    sessionId,
    livemode
  });
  
  // Get price IDs from line items
  let priceIds: string[] = [];
  if (session.line_items?.data) {
    priceIds = session.line_items.data.map(li => li.price?.id).filter(Boolean) as string[];
  } else {
    // If line_items isn't expanded, retrieve the session with expanded data
    console.log('[roast][webhook] Line items not expanded, retrieving expanded session...');
    const expandedSession = await getStripe().checkout.sessions.retrieve(session.id, { 
      expand: ["line_items.data.price.product"] 
    });
    priceIds = expandedSession.line_items?.data?.map(li => li.price?.id).filter(Boolean) as string[] || [];
    console.log(`[roast][webhook] Retrieved expanded session, priceIds: [${priceIds.join(', ')}]`);
  }

  // Check if roast doc exists and get current status
  console.log(`[roast][webhook] Checking if roast document exists in Firestore...`);
  const existingDoc = await getRoast(roastId);
  const existsBefore = !!existingDoc;
  
  console.log(`[roast][webhook] Firestore check result:`, {
    existsBefore,
    currentStatus: existingDoc?.status || 'none',
    currentSessionId: existingDoc?.sessionId || 'none'
  });
  
  // Idempotency: if already processed this session, return early
  if (existingDoc?.sessionId === sessionId && existingDoc?.status === "ready") {
    console.log(`[roast][webhook] Already processed this session, returning early { roastId: "${roastId}", sessionId: "${sessionId}" }`);
    return;
  }

  // Create or update roast document in Firestore
  console.log(`[roast][webhook] Starting Firestore write for roastId: "${roastId}"`);
  
  try {
    if (!existingDoc) {
      // Create new doc
      console.log(`[roast][webhook] Creating new roast document in Firestore...`);
      await createRoastDocWithId(roastId, {
        idea,
        harshness: harshness as 1|2|3,
        source: "stripe",
        paid: true,
        status: "pending",
        sessionId,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`[roast][webhook] Successfully created roast document in Firestore at path: roasts/${roastId}`);
    } else if (existingDoc.status !== "ready") {
      // Update existing doc (without overwriting result if it already exists)
      console.log(`[roast][webhook] Updating existing roast document in Firestore...`);
      await updateRoast(roastId, {
        paid: true,
        status: "pending",
        sessionId,
        userId,
        updatedAt: Date.now(),
      });
      console.log(`[roast][webhook] Successfully updated roast document in Firestore at path: roasts/${roastId}`);
    }
    
    console.log(`[roast][webhook] Firestore write completed successfully for roastId: "${roastId}"`);
  } catch (error) {
    console.error(`[roast][webhook] Firestore write failed for roastId: "${roastId}":`, error);
    throw new Error(`Failed to create/update roast document: ${error}`);
  }

  // Log upsert completion
  console.log(`[roast][webhook] Document upsert completed { roastId: "${roastId}", existsBefore: ${existsBefore}, livemode: ${livemode}, sessionId: "${sessionId}", priceIds: [${priceIds.join(', ')}] }`);

  // Generate roast
  console.log(`[roast][webhook] Starting roast generation for idea: "${idea.substring(0, 50)}..."`);
  try {
    const result = await generateRoast(idea, harshness as 1|2|3);
    
    // Update doc with result
    console.log(`[roast][webhook] Roast generation completed, updating document with result...`);
    await updateRoast(roastId, { 
      status: "ready", 
      result, 
      updatedAt: Date.now() 
    });
    
    // Log completion
    console.log(`[roast][webhook] Roast completed successfully { roastId: "${roastId}", zingers: ${result?.zingers?.length ?? 0} }`);
  } catch (error) {
    console.error(`[roast][webhook] Roast generation failed for roastId: "${roastId}":`, error);
    await updateRoast(roastId, { status: "error", updatedAt: Date.now() });
    throw error;
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