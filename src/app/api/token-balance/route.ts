import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/auth/server";

export const runtime = "edge";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user?.uid) {
      return NextResponse.json({ signedIn: false }, { status: 200 });
    }
    const db = getAdminDb();
    const snap = await db.collection("users").doc(user.uid).get();
    const bal = snap.exists ? (snap.get("token_balance") as number) : 0;
    return NextResponse.json({ signedIn: true, balance: Number.isFinite(bal) ? bal : 0 }, { status: 200 });
  } catch (e) {
    console.error("[balance] error", e);
    return NextResponse.json({ signedIn: false }, { status: 200 });
  }
}
