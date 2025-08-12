import { NextRequest, NextResponse } from "next/server";
import { createRoastDoc } from "@/lib/roast";
import { hasAtLeastOneToken, deductOneToken } from "@/lib/token-validation";
import { generateRoast } from "@/lib/openai/roast";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawIdea = (body?.idea ?? "").toString().trim();
    const hParsed = Number(body?.harshness);
    const h = [1,2,3].includes(hParsed) ? (hParsed as 1|2|3) : 2;

    if (rawIdea.length < 6) {
      console.log('Roast start validation failed:', { ideaLength: rawIdea.length, harshnessUsed: h });
      return NextResponse.json(
        { error: "Missing or invalid fields", details: { idea: false, harshness: true } },
        { status: 400 }
      );
    }

    // Check if user has tokens (if authenticated)
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let uid: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.replace('Bearer ', '').trim();
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        uid = decodedToken.uid;
      } catch (error) {
        console.error('Token verification failed:', error);
        // Continue as guest user
      }
    }

    if (uid) {
      // Authenticated user - check tokens
      const hasTokens = await hasAtLeastOneToken(uid);
      
      if (!hasTokens) {
        return NextResponse.json({ error: "Insufficient tokens" }, { status: 402 });
      }

      // Deduct one token
      await deductOneToken(uid);
    }

    // Create roast document
    const { id } = await createRoastDoc({
      idea: rawIdea,
      harshness: h,
      userId: uid,
      paid: false,
      source: uid ? "token" : "guest",
      status: "processing"
    });

    // Generate roast content
    try {
      const result = await generateRoast(idea, harshness as 1 | 2 | 3);
      await updateRoast(id, { status: "ready", result });
    } catch (error) {
      console.error("Error generating roast:", error);
      await updateRoast(id, { status: "error" });
      return NextResponse.json({ error: "Failed to generate roast" }, { status: 500 });
    }

    return NextResponse.json({ roastId: id });
  } catch (error) {
    console.error("Error in roast start:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
