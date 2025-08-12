// Force Node runtime (firebase-admin needs Node) + dynamic (no caching)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { getServerUser } from "@/lib/auth/server";

const USERS = "users";
const BALANCE_FIELD = "token_balance";
const DEBUG = process.env.DEBUG_TOKEN_BALANCE === "true";

async function resolveUid() {
  // 1) Try your existing server auth (cookies/session)
  const u = await getServerUser().catch(() => null);
  if (u?.uid) return u.uid;

  // 2) Optional fallback: Authorization: Bearer <ID_TOKEN>
  try {
    const h = headers();
    const authz = h.get("authorization");
    if (authz?.toLowerCase().startsWith("bearer ")) {
      const idToken = authz.slice(7).trim();
      const auth = getAdminAuth();
      const decoded = await auth.verifyIdToken(idToken);
      return decoded.uid || null;
    }
  } catch (_) {}

  return null;
}

export async function GET() {
  try {
    const uid = await resolveUid();
    if (!uid) {
      if (DEBUG) console.log("[token-balance] guest");
      return NextResponse.json({ signedIn: false, balance: 0 });
    }

    const db = getAdminDb();
    const snap = await db.collection(USERS).doc(uid).get();
    const raw = snap.exists ? (snap.get(BALANCE_FIELD) as number) : 0;
    const balance = Number.isFinite(raw) ? raw : 0;

    if (DEBUG) console.log("[token-balance] uid", uid, "balance", balance);
    return NextResponse.json({ signedIn: true, balance });
  } catch (e) {
    if (DEBUG) console.log("[token-balance] error", (e as Error)?.message);
    // Fail closed (hide line rather than breaking page)
    return NextResponse.json({ signedIn: false, balance: 0 });
  }
}
