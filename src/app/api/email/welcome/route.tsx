// src/app/api/email/welcome/route.ts
/*
QA CHECKLIST:
- Test on production domain to avoid Vercel deployment protection
- Protected deployment returns 401 or Vercel SSO HTML
- Check Vercel logs for [API] prefixed console.log statements
- Check browser console for [WelcomeEmail] prefixed logs
- Force=true param bypasses idempotency for testing
- Validation errors log parsed Zod issues
- Success logs include uid, emailId, forced status
- Skipped emails log reason (already-sent)
*/

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
  console.log('[API] /api/email/welcome', { method: 'GET' });
  console.log('GET /api/email/welcome invoked');
  return NextResponse.json({ ok: true, route: 'welcome' });
}

export async function POST(req: NextRequest) {
  console.log('[API] /api/email/welcome', { method: 'POST' });
  const { searchParams } = new URL(req.url);
  const forced = searchParams.get("force") === "true";
  
  try {
    const parse = welcomeSchema.safeParse(await req.json());
    if (!parse.success) {
      console.log('[API] /api/email/welcome validation failed:', parse.error.issues);
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
        console.log('[API] /api/email/welcome outcome: skipped (already sent)', { uid, skipped: true });
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

    console.log('[API] /api/email/welcome outcome: sent successfully', { uid, emailId, forced: forced || false });
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
    console.log('[API] /api/email/welcome outcome: error', { error: error?.message || 'unknown' });
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
