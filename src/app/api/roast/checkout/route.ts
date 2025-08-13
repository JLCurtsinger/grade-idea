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
  
  // Force canonical https://www.gradeidea.cc for success/cancel urls
  const rawOrigin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const origin = rawOrigin
    .replace(/^http:\/\//, 'https://')
    .replace('://gradeidea.cc', '://www.gradeidea.cc')
    .replace(/\/$/, '');

  const success_url = `${origin}/r/${roastId}?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/?canceled=1`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allow_promotion_codes: true,
    line_items: [{ price, quantity: 1 }],
    success_url: success_url,
    cancel_url: cancel_url,
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
  console.log(`[roast][checkout] success_url -> ${success_url}`);
  console.log(`[roast][checkout] created session ${session.id} for roastId ${roastId} (mode:${isLive ? 'live' : 'test'})`);

  return NextResponse.json({ checkoutUrl: session.url, roastId });
}
