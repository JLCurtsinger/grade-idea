import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { inferSiteUrlFromRequest } from "@/lib/url";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const idea = String(body?.idea ?? "").trim();
  const hParsed = Number(body?.harshness);
  const harshness: 1|2|3 = ([1,2,3] as const).includes(hParsed as any) ? (hParsed as 1|2|3) : 2;

  if (idea.length < 6) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const roastId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  const stripe = getStripe();
  const price = process.env.STRIPE_PRICE_ID_ROAST_SINGLE!;
  const base = inferSiteUrlFromRequest(req);
  
  console.log("[roast][checkout] base:", base);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allow_promotion_codes: true,
    line_items: [{ price, quantity: 1 }],
    success_url: `${base}/r/${roastId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/?canceled=1`,
    metadata: {
      roastId,
      idea: idea.slice(0, 500), // metadata limits
      harshness: String(harshness),
      feature: "roast"
    },
  });

  console.log("[roast][checkout] created session for roastId", roastId);

  return NextResponse.json({ checkoutUrl: session.url, roastId });
}
