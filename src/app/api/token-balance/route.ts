// Node runtime only (firebase-admin requires Node)
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/auth/server";

const USERS = "users";
const BALANCE_FIELD = "token_balance";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      // Hide UI for guests by returning signedIn: false
      return NextResponse.json({ signedIn: false, balance: 0 });
    }

    const db = getAdminDb();
    const snap = await db.collection(USERS).doc(user.uid).get();
    const raw = snap.exists ? (snap.get(BALANCE_FIELD) as number) : 0;
    const balance = Number.isFinite(raw) ? raw : 0;

    return NextResponse.json({ signedIn: true, balance });
  } catch (e) {
    // Be quiet on errors; UI will just hide itself
    return NextResponse.json({ signedIn: false, balance: 0 });
  }
}
