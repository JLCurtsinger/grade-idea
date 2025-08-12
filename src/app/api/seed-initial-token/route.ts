// src/app/api/seed-initial-token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }
    const idToken = authHeader.replace('Bearer ', '').trim();
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const userRef = getAdminDb().collection('users').doc(uid);
    let credited = false;
    let balance = 0;

    await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const now = new Date();

      if (!snap.exists) {
        tx.set(userRef, {
          token_balance: 1,
          initial_credit_applied: true,
          createdAt: now,
          updatedAt: now,
        }, { merge: true });
        credited = true;
        balance = 1;
        return;
      }

      const data = snap.data() || {};
      const initialApplied = !!data.initial_credit_applied;

      if (!initialApplied) {
        const hasDefinedBalance = typeof data.token_balance === 'number';
        const nextBalance = hasDefinedBalance ? data.token_balance : 1;

        tx.set(userRef, {
          token_balance: nextBalance,
          initial_credit_applied: true,
          updatedAt: now,
        }, { merge: true });

        credited = !hasDefinedBalance;
        balance = nextBalance;
        return;
      }

      balance = typeof data.token_balance === 'number' ? data.token_balance : 0;
    });

    return NextResponse.json({ credited, token_balance: balance }, { status: 200 });
  } catch (err) {
    console.error('seed-initial-token error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
