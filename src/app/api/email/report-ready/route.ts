// src/app/api/email/report-ready/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';
import { reportReadyTemplate } from '@/lib/email/templates';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { ideaId, ideaTitle, uid, email, dashboardPath } = await req.json();
  if (!ideaId || !uid || !email) {
    return NextResponse.json({ error: 'ideaId, uid, email are required' }, { status: 400 });
  }

  // Ideas are stored in users/{uid}/ideas/{ideaId} subcollection
  const ideaRef = adminDb.collection('users').doc(uid).collection('ideas').doc(ideaId);
  const snap = await ideaRef.get();
  if (snap.exists && snap.data()?.reportReadyEmailSent) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await sendEmail({
    to: email,
    subject: 'Your GradeIdea report is ready',
    html: reportReadyTemplate({ ideaTitle, dashboardPath }),
  });

  await ideaRef.set({ reportReadyEmailSent: true }, { merge: true });

  return NextResponse.json({ ok: true });
}
