import { NextRequest, NextResponse } from "next/server";
import { getRoast } from "@/lib/roast";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Protected by NODE_ENV !== "production"
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const roast = await getRoast(params.id);
    
    return NextResponse.json({ 
      exists: !!roast, 
      data: roast || null 
    });
  } catch (error) {
    console.error("Error fetching roast for dump:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
