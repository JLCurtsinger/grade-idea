import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stripe = getStripe();
    const sessionId = params.id;
    
    console.log(`[roast][stripe-session] ${sessionId} -> checking payment status`);
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    const paymentStatus = session.payment_status;
    const status = session.status;
    
    console.log(`[roast][stripe-session] ${sessionId} -> ${paymentStatus}`);
    
    return NextResponse.json({
      paid: paymentStatus === 'paid',
      status: status,
      payment_status: paymentStatus,
      livemode: session.livemode
    });
    
  } catch (error) {
    console.error(`[roast][stripe-session][error] ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to retrieve session status" },
      { status: 500 }
    );
  }
}
