import { NextRequest, NextResponse } from "next/server";
import { createRoastDoc } from "@/lib/roast";
import { hasAtLeastOneToken, deductOneToken } from "@/lib/token-validation";
import { generateRoast } from "@/lib/openai/roast";
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idea = String(body?.idea || "").trim();
    const hNum = Number(body?.harshness);
    const harshness = ([1,2,3].includes(hNum) ? hNum : 2) as 1|2|3;

    if (idea.length < 6) {
      console.log("[roast/start] invalid", { ideaLength: idea.length, harshness });
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    // Verify Firebase ID token if present
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let uid: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.replace('Bearer ', '').trim();
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        uid = decodedToken.uid;
      } catch (error) {
        console.error('Token verification failed:', error);
        // Continue as guest user
      }
    }

    // Guests & 0-token users should use checkout endpoint
    if (!uid || !(await hasAtLeastOneToken(uid))) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    try {
      await deductOneToken(uid);
      const { id } = await createRoastDoc({ idea, harshness, userId: uid, paid: true, source: "token", status: "processing" });
      const result = await generateRoast(idea, harshness);
      await updateRoast(id, { status: "ready", result });
      return NextResponse.json({ roastId: id });
    } catch (e: any) {
      console.error("Error in roast start:", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in roast start:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
