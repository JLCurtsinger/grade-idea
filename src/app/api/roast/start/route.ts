import { NextRequest, NextResponse } from "next/server";
import { createRoastDoc } from "@/lib/roast";
import { hasAtLeastOneToken, deductOneToken } from "@/lib/token-validation";
import { generateRoast } from "@/lib/openai/roast";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const idToken = authHeader.replace('Bearer ', '').trim();
    
    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const uid = decodedToken.uid;
    if (!uid) {
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    const { idea, harshness } = await req.json();
    
    if (!idea || ![1, 2, 3].includes(harshness)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    // Check if user has tokens
    const hasTokens = await hasAtLeastOneToken(uid);
    
    if (!hasTokens) {
      return NextResponse.json({ error: "Insufficient tokens" }, { status: 402 });
    }

    // Deduct one token
    await deductOneToken(uid);

    // Create roast document
    const { id } = await createRoastDoc({
      idea,
      harshness: harshness as 1 | 2 | 3,
      userId: uid,
      paid: false,
      source: "token",
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
