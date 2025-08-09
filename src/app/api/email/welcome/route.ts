// src/app/api/email/welcome/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from '@/lib/firebase-admin'; // uses the existing file
import { sendEmail } from '@/lib/email/resend';
import { welcomeTemplate } from '@/lib/email/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('GET /api/email/welcome');
  return NextResponse.json({ ok: true, route: 'welcome' });
}

export async function POST(req: NextRequest) {
  console.log('POST /api/email/welcome');
  try {
    await initFirebaseAdmin();
    const db = getFirestore();

    const body = await req.json();
    const { uid, email, name } = body || {};
    if (!uid || !email) {
      return NextResponse.json({ ok: false, error: 'uid and email are required' }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return NextResponse.json({ ok: false, error: 'Email not configured on server' }, { status: 500 });
    }

    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (snap.exists && snap.data()?.welcomeEmailSent) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const res = await sendEmail({
      to: email,
      subject: 'Welcome to GradeIdea',
      html: welcomeTemplate({ name }),
    });

    await userRef.set({ welcomeEmailSent: true }, { merge: true });

    return NextResponse.json({ ok: true, resendId: (res as any)?.id ?? null });
  } catch (err: any) {
    console.error('welcome email error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'unknown' }, { status: 500 });
  }
}
