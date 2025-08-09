// src/app/api/email/report-ready/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdmin } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email/resend';
import { reportReadyTemplate } from '@/lib/email/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('GET /api/email/report-ready');
  return NextResponse.json({ ok: true, route: 'report-ready' });
}

export async function POST(req: NextRequest) {
  console.log('POST /api/email/report-ready');
  try {
    await initFirebaseAdmin();
    const db = getFirestore();

    const body = await req.json();
    const { ideaId, ideaTitle, uid, email, dashboardPath } = body || {};
    if (!ideaId || !uid || !email) {
      return NextResponse.json({ ok: false, error: 'ideaId, uid, email are required' }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return NextResponse.json({ ok: false, error: 'Email not configured on server' }, { status: 500 });
    }

    // ideas are stored under users/{uid}/ideas/{ideaId}
    const ideaRef = db.collection('users').doc(uid).collection('ideas').doc(ideaId);
    const snap = await ideaRef.get();
    if (snap.exists && snap.data()?.reportReadyEmailSent) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const res = await sendEmail({
      to: email,
      subject: 'Your GradeIdea report is ready',
      html: reportReadyTemplate({ ideaTitle, dashboardPath }),
    });

    await ideaRef.set({ reportReadyEmailSent: true }, { merge: true });

    return NextResponse.json({ ok: true, resendId: (res as any)?.id ?? null });
  } catch (err: any) {
    console.error('report-ready email error', err);
    return NextResponse.json({ ok: false, error: err?.message || 'unknown' }, { status: 500 });
  }
}
