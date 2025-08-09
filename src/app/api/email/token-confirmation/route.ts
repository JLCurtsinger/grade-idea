// src/app/api/email/token-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email/resend';
import { tokenPurchaseTemplate } from '@/lib/email/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('GET /api/email/token-confirmation');
  return NextResponse.json({ ok: true, route: 'token-confirmation' });
}

export async function POST(req: NextRequest) {
  console.log('POST /api/email/token-confirmation');
  try {
    await initFirebaseAdmin();
    const db = getFirestore();

    const body = await req.json();
    const { sessionId, uid, email, tokensAdded } = body || {};
    if (!sessionId || !uid || !email || typeof tokensAdded !== 'number') {
      return NextResponse.json({ ok: false, error: 'sessionId, uid, email, tokensAdded are required' }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return NextResponse.json({ ok: false, error: 'Email not configured on server' }, { status: 500 });
    }

    // store flag under the user for easy scoping
    const payRef = db.collection('users').doc(uid).collection('payments').doc(sessionId);
    const snap = await payRef.get();
    if (snap.exists && snap.data()?.tokenEmailSent) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const res = await sendEmail({
      to: email,
      subject: 'Your tokens are ready',
      html: tokenPurchaseTemplate({ tokensAdded }),
    });

    await payRef.set({ tokenEmailSent: true, tokensAdded, email, uid }, { merge: true });

    return NextResponse.json({ ok: true, resendId: (res as any)?.id ?? null });
  } catch (err: any) {
    console.error('token-confirmation email error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'unknown' }, { status: 500 });
  }
}
