// src/app/api/email/token-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';
import { tokenPurchaseTemplate } from '@/lib/email/templates';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { sessionId, uid, email, tokensAdded } = await req.json();
  if (!sessionId || !uid || !email || typeof tokensAdded !== 'number') {
    return NextResponse.json({ error: 'sessionId, uid, email, tokensAdded are required' }, { status: 400 });
  }

  const payRef = adminDb.collection('payments').doc(sessionId);
  const snap = await payRef.get();
  if (snap.exists && snap.data()?.tokenEmailSent) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await sendEmail({
    to: email,
    subject: 'Your tokens are ready',
    html: tokenPurchaseTemplate({ tokensAdded }),
  });

  await payRef.set({ tokenEmailSent: true }, { merge: true });

  return NextResponse.json({ ok: true });
}
