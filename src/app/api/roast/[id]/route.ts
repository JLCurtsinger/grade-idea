export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getRoast } from "@/lib/roast";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roast = await getRoast(params.id);
    
    if (!roast) {
      return NextResponse.json({ error: "Roast not found" }, { status: 404 });
    }

    return NextResponse.json(roast);
  } catch (error) {
    console.error("Error fetching roast:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
