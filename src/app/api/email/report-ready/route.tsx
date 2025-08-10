// src/app/api/email/report-ready/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/resend';
import { render } from '@react-email/render';
import ReportReadyEmail, { subject } from '@/emails/ReportReadyEmail';
import { adminDb } from '@/lib/firebase-admin';
import { logInfo, logWarn, logError } from '@/lib/log';
import React from 'react';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reportReadySchema = z.object({
  uid: z.string(),
  ideaId: z.string(),
  email: z.string().email(),
  ideaTitle: z.string(),
  reportUrl: z.string(),
  name: z.string().optional(),
});

export async function GET() {
  console.log('GET /api/email/report-ready invoked');
  return NextResponse.json({ ok: true, route: 'report-ready' });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forced = searchParams.get("force") === "true";
  
  try {
    const parse = reportReadySchema.safeParse(await req.json());
    if (!parse.success) {
      logError("report-ready email validation failed", { 
        route: "report-ready", 
        method: "POST", 
        forced, 
        details: parse.error.issues 
      });
      return NextResponse.json({ 
        ok: false, 
        reason: "validation-failed", 
        details: parse.error.issues,
        route: "report-ready" 
      }, { status: 400 });
    }
    
    const { uid, ideaId, email, ideaTitle, reportUrl, name } = parse.data;
    
    logInfo("report-ready email request started", { 
      route: "report-ready", 
      method: "POST", 
      forced, 
      uid, 
      ideaId,
      hasName: !!name
    });

    // Idempotency: check idea flag (skip if forced)
    if (!forced) {
      const ideaRef = adminDb.collection('users').doc(uid).collection('ideas').doc(ideaId);
      const snap = await ideaRef.get();
      if (snap.exists && snap.data()?.reportReadyEmailSent) {
        logInfo("report-ready email skipped - already sent", { 
          route: "report-ready", 
          uid, 
          ideaId, 
          skipped: true, 
          reason: "already-sent" 
        });
        return NextResponse.json({ 
          ok: true, 
          skipped: true, 
          reason: "already-sent",
          route: "report-ready" 
        });
      }
    } else {
      logWarn("report-ready email forced send", { 
        route: "report-ready", 
        uid, 
        ideaId, 
        forced: true 
      });
    }

    const html = await render(<ReportReadyEmail ideaTitle={ideaTitle} reportUrl={reportUrl} name={name} />);
    const res = await sendEmail({
      to: email,
      subject: subject,
      html,
    });

    const emailId = (res as any)?.id || null;
    
    // Set idempotency flag
    const ideaRef = adminDb.collection('users').doc(uid).collection('ideas').doc(ideaId);
    await ideaRef.set({ reportReadyEmailSent: true }, { merge: true });

    logInfo("report-ready email sent successfully", { 
      route: "report-ready", 
      uid, 
      ideaId, 
      emailId,
      forced: forced || false,
      hasName: !!name
    });

    return NextResponse.json({ 
      ok: true, 
      forced: forced || false,
      emailId,
      route: "report-ready" 
    });
  } catch (error: any) {
    logError("report-ready email error", { 
      route: "report-ready", 
      method: "POST", 
      forced, 
      error: error?.message || 'unknown',
      stack: error?.stack 
    });
    
    return NextResponse.json({ 
      ok: false, 
      reason: "send-error",
      route: "report-ready" 
    }, { status: 500 });
  }
}
