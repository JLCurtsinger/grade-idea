import { NextRequest, NextResponse } from "next/server";
import { generateRoast } from "@/lib/openai/roast";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Check admin token in production
  if (process.env.NODE_ENV === "production") {
    const adminToken = req.headers.get("x-admin-token");
    const expectedToken = process.env.ADMIN_TOKEN;
    
    if (!adminToken || adminToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    console.log(`[roast][smoke][start] → { timestamp: ${Date.now()} }`);
    
    const testIdea = `smoke test ${Date.now()}`;
    const result = await generateRoast(testIdea, 2);
    
    console.log(`[roast][smoke][done] → { ok: true }`);
    
    return NextResponse.json({ 
      ok: true, 
      result,
      testIdea,
      timestamp: Date.now()
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[roast][smoke][error] → { message: "${errorMessage}" }`);
    
    return NextResponse.json({ 
      ok: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
