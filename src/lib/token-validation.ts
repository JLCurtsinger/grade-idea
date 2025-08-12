import { getAdminDb } from "@/lib/firebase-admin";

const USERS = "users";
const BALANCE_FIELD = "token_balance";

export async function getTokenBalance(uid: string): Promise<number> {
  const db = getAdminDb();
  const ref = db.collection(USERS).doc(uid);
  const snap = await ref.get();
  const bal = snap.exists ? (snap.get(BALANCE_FIELD) as number) : 0;
  return Number.isFinite(bal) ? bal : 0;
}

export async function hasAtLeastOneToken(uid: string) {
  return (await getTokenBalance(uid)) > 0;
}

export async function deductOneToken(uid: string) {
  const db = getAdminDb();
  const ref = db.collection(USERS).doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const bal = snap.exists ? (snap.get(BALANCE_FIELD) as number) : 0;
    if (!bal || bal < 1) throw new Error("INSUFFICIENT_TOKENS");
    tx.update(ref, { [BALANCE_FIELD]: bal - 1 });
  });
}
