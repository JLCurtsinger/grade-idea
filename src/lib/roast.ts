import { getAdminDb } from "@/lib/firebase-admin";
import { RoastDoc } from "@/lib/types/roast";

const COL = "roasts";

export async function createRoastDoc(data: Partial<RoastDoc>) {
  const db = getAdminDb();
  const ref = db.collection(COL).doc();
  const now = Date.now();
  const doc: RoastDoc = {
    idea: data.idea || "",
    harshness: (data.harshness as any) || 1,
    userId: data.userId ?? null,
    paid: !!data.paid,
    source: (data.source as any) || "token",
    status: (data.status as any) || "pending",
    createdAt: now,
    updatedAt: now,
    sessionId: data.sessionId,
    result: data.result,
  };
  await ref.set(doc);
  return { id: ref.id };
}

export async function updateRoast(id: string, patch: Partial<RoastDoc>) {
  const db = getAdminDb();
  await db.collection(COL).doc(id).set({ ...patch, updatedAt: Date.now() }, { merge: true });
  return { id };
}

export async function getRoast(id: string) {
  const db = getAdminDb();
  const snap = await db.collection(COL).doc(id).get();
  return snap.exists ? { id: snap.id, ...(snap.data() as RoastDoc) } : null;
}
