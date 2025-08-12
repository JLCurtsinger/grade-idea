import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/url";
import { createRoastDoc } from "@/lib/roast";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const idea = String(body?.idea || "").trim();
  const hNum = Number(body?.harshness);
  const harshness = ([1,2,3].includes(hNum) ? hNum : 2) as 1|2|3;

  if (idea.length < 6) {
    console.log("[roast/checkout] invalid", { ideaLength: idea.length, harshness });
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const { id } = await createRoastDoc({
    idea, harshness, userId: null, paid: false, source: "stripe", status: "pending"
  });

  const price = process.env.STRIPE_PRICE_ID_ROAST_SINGLE!;
  const base = siteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allow_promotion_codes: true,
    line_items: [{ price, quantity: 1 }],
    success_url: `${base}/r/${id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/?canceled=1`,
    metadata: { roastId: id, feature: "roast" },
  });

  return NextResponse.json({ checkoutUrl: session.url, roastId: id });
}
