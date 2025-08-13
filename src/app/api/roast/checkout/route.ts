import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getAdminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const idea = String(body?.idea ?? "").trim();
  const hParsed = Number(body?.harshness);
  const harshness: 1|2|3 = ([1,2,3] as const).includes(hParsed as any) ? (hParsed as 1|2|3) : 2;

  // Validate input: idea (trim, 1–280 chars), harshness (1–3, default 2)
  if (idea.length < 1 || idea.length > 280) {
    return NextResponse.json({ error: "Idea must be between 1 and 280 characters" }, { status: 400 });
  }

  // Try to get userId from Authorization header
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const auth = getAdminAuth();
      const decodedToken = await auth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      console.log("[roast][checkout] Invalid auth token, proceeding without userId");
    }
  }

  // Generate roastId (UUID v4)
  const roastId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const stripe = getStripe();
  const price = process.env.STRIPE_PRICE_ID_ROAST_SINGLE!;
  
  // Force HTTPS and make origin robust
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin)
    .replace('http://', 'https://')
    .replace(/\/$/, '');

  const successUrl = `${origin}/r/${roastId}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/?canceled=1`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allow_promotion_codes: true,
    line_items: [{ price, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      roastId,
      idea: idea.slice(0, 500), // metadata limits
      harshness: String(harshness),
      feature: "roast",
      ...(userId && { userId }), // Only include userId if available
    },
  });

  // Log mode sanity check and URLs
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  const isLive = stripeKey.startsWith("sk_live_");
  console.log(`[roast][checkout] session created → { sessionId: "${session.id}", roastId: "${roastId}", mode: "${isLive ? 'live' : 'test'}" }`);
  console.log(`[roast][checkout] success_url → ${successUrl}`);
  console.log(`[roast][checkout] cancel_url → ${cancelUrl}`);

  return NextResponse.json({ checkoutUrl: session.url, roastId });
}
