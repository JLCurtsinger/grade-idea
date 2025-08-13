export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getRoast } from "@/lib/roast";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roast = await getRoast(params.id);
    const sessionId = req.nextUrl.searchParams.get('session_id');
    
    if (!roast) {
      console.log(`[roast][read] ${params.id} -> not-found`);
      
      // Self-heal hint if session_id is present
      if (sessionId) {
        console.log(`[roast][read][self-heal] → { id: "${params.id}", session_id: "${sessionId}" }`);
      }
      
      return NextResponse.json({ error: "Roast not found" }, { status: 404 });
    }

    // If doc exists but no result yet, return processing status
    if (roast.status !== "ready" || !roast.result) {
      console.log(`[roast][read] ${params.id} -> processing`);
      return NextResponse.json({ status: "processing" });
    }

    console.log(`[roast][read] ${params.id} -> ready`);
    return NextResponse.json(roast);
  } catch (error) {
    console.error("[roast][read][error]", { message: error instanceof Error ? error.message : "Unknown error", id: params.id });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
