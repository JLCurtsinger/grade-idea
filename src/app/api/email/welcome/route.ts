// src/app/api/email/welcome/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';
import { welcomeTemplate } from '@/lib/email/templates';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const { uid, email, name } = await req.json();
  if (!uid || !email) {
    return NextResponse.json({ error: 'uid and email are required' }, { status: 400 });
  }

  // Idempotency: check user flag
  const userRef = adminDb.collection('users').doc(uid);
  const snap = await userRef.get();
  if (snap.exists && snap.data()?.welcomeEmailSent) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await sendEmail({
    to: email,
    subject: 'Welcome to GradeIdea',
    html: welcomeTemplate({ name }),
  });

  await userRef.set({ welcomeEmailSent: true }, { merge: true });

  return NextResponse.json({ ok: true });
}
