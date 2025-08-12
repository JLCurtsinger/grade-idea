import { getAdminDb } from "@/lib/firebase-admin";
import type { RoastDoc } from "@/lib/types/roast";

const COL = "roasts";
const omitUndefined = (obj: Record<string, any>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export async function createRoastDoc(data: Partial<RoastDoc>) {
  const db = getAdminDb();
  const ref = db.collection(COL).doc();
  const now = Date.now();
  const doc: RoastDoc = {
    idea: data.idea || "",
    harshness: (data.harshness as any) || 2,
    userId: data.userId ?? null,
    paid: !!data.paid,
    source: (data.source as any) || "token",
    status: (data.status as any) || "pending",
    createdAt: now,
    updatedAt: now,
    // only set if defined later in update
  } as any;
  await ref.set(omitUndefined({ ...doc, result: data.result, sessionId: (data as any).sessionId }));
  return { id: ref.id };
}

export async function updateRoast(id: string, patch: Partial<RoastDoc>) {
  const db = getAdminDb();
  await db.collection(COL).doc(id).set(
    omitUndefined({ ...patch, updatedAt: Date.now() }),
    { merge: true }
  );
  return { id };
}

export async function getRoast(id: string) {
  const db = getAdminDb();
  const snap = await db.collection(COL).doc(id).get();
  return snap.exists ? { id: snap.id, ...(snap.data() as RoastDoc) } : null;
}

export async function createRoastDocWithId(id: string, data: Partial<RoastDoc>) {
  const ref = getAdminDb().collection(COL).doc(id);
  const now = Date.now();
  const doc: RoastDoc = {
    idea: data.idea || "",
    harshness: (data.harshness as any) || 2,
    userId: data.userId ?? null,
    paid: !!data.paid,
    source: (data.source as any) || "stripe",
    status: (data.status as any) || "pending",
    createdAt: now,
    updatedAt: now,
    sessionId: (data as any).sessionId,
    result: data.result,
  };
  await ref.set(omitUndefined(doc));
  return { id };
}
