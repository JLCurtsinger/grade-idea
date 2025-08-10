// src/app/api/email/welcome/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/resend';
import { render } from '@react-email/render';
import WelcomeEmail, { subject } from '@/emails/WelcomeEmail';
import { adminDb } from '@/lib/firebase-admin';
import { logInfo, logWarn, logError } from '@/lib/log';
import React from 'react';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const welcomeSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

export async function GET() {
  console.log('GET /api/email/welcome invoked');
  return NextResponse.json({ ok: true, route: 'welcome' });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forced = searchParams.get("force") === "true";
  
  try {
    const parse = welcomeSchema.safeParse(await req.json());
    if (!parse.success) {
      logError("welcome email validation failed", { 
        route: "welcome", 
        method: "POST", 
        forced, 
        details: parse.error.issues 
      });
      return NextResponse.json({ 
        ok: false, 
        reason: "validation-failed", 
        details: parse.error.issues,
        route: "welcome" 
      }, { status: 400 });
    }
    
    const { uid, email, name } = parse.data;
    
    logInfo("welcome email request started", { 
      route: "welcome", 
      method: "POST", 
      forced, 
      uid,
      hasName: !!name
    });

    // Idempotency: check user flag (skip if forced)
    if (!forced) {
      const userRef = adminDb.collection('users').doc(uid);
      const snap = await userRef.get();
      if (snap.exists && snap.data()?.welcomeEmailSent) {
        logInfo("welcome email skipped - already sent", { 
          route: "welcome", 
          uid, 
          skipped: true, 
          reason: "already-sent" 
        });
        return NextResponse.json({ 
          ok: true, 
          skipped: true, 
          reason: "already-sent",
          route: "welcome" 
        });
      }
    } else {
      logWarn("welcome email forced send", { 
        route: "welcome", 
        uid, 
        forced: true 
      });
    }

    const html = await render(<WelcomeEmail name={name} />);
    const res = await sendEmail({
      to: email,
      subject: subject,
      html,
    });

    const emailId = (res as any)?.id || null;
    
    // Set idempotency flag
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.set({ welcomeEmailSent: true }, { merge: true });

    logInfo("welcome email sent successfully", { 
      route: "welcome", 
      uid, 
      emailId,
      forced: forced || false,
      hasName: !!name
    });

    return NextResponse.json({ 
      ok: true, 
      forced: forced || false,
      emailId,
      route: "welcome" 
    });
  } catch (error: any) {
    logError("welcome email error", { 
      route: "welcome", 
      method: "POST", 
      forced, 
      error: error?.message || 'unknown',
      stack: error?.stack 
    });
    
    return NextResponse.json({ 
      ok: false, 
      reason: "send-error",
      route: "welcome" 
    }, { status: 500 });
  }
}
