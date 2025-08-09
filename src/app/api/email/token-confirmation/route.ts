// src/app/api/email/token-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/resend';
import { tokenPurchaseTemplate } from '@/lib/email/templates';
import { adminDb } from '@/lib/firebase-admin';
import { logInfo, logWarn, logError } from '@/lib/log';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tokenConfirmationSchema = z.object({
  sessionId: z.string(),
  uid: z.string(),
  email: z.string().email(),
  tokensAdded: z.number(),
});

export async function GET() {
  console.log('GET /api/email/token-confirmation invoked');
  return NextResponse.json({ ok: true, route: 'token-confirmation' });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forced = searchParams.get("force") === "true";
  
  try {
    const parse = tokenConfirmationSchema.safeParse(await req.json());
    if (!parse.success) {
      logError("token-confirmation email validation failed", { 
        route: "token-confirmation", 
        method: "POST", 
        forced, 
        details: parse.error.issues 
      });
      return NextResponse.json({ 
        ok: false, 
        reason: "validation-failed", 
        details: parse.error.issues,
        route: "token-confirmation" 
      }, { status: 400 });
    }
    
    const { sessionId, uid, email, tokensAdded } = parse.data;
    
    logInfo("token-confirmation email request started", { 
      route: "token-confirmation", 
      method: "POST", 
      forced, 
      uid, 
      sessionId 
    });

    // Idempotency: check payment flag (skip if forced)
    if (!forced) {
      const payRef = adminDb.collection('payments').doc(sessionId);
      const snap = await payRef.get();
      if (snap.exists && snap.data()?.tokenEmailSent) {
        logInfo("token-confirmation email skipped - already sent", { 
          route: "token-confirmation", 
          uid, 
          sessionId, 
          skipped: true, 
          reason: "already-sent" 
        });
        return NextResponse.json({ 
          ok: true, 
          skipped: true, 
          reason: "already-sent",
          route: "token-confirmation" 
        });
      }
    } else {
      logWarn("token-confirmation email forced send", { 
        route: "token-confirmation", 
        uid, 
        sessionId, 
        forced: true 
      });
    }

    const res = await sendEmail({
      to: email,
      subject: 'Your tokens are ready',
      html: tokenPurchaseTemplate({ tokensAdded }),
    });

    const emailId = (res as any)?.id || null;
    
    // Set idempotency flag
    const payRef = adminDb.collection('payments').doc(sessionId);
    await payRef.set({ tokenEmailSent: true }, { merge: true });

    logInfo("token-confirmation email sent successfully", { 
      route: "token-confirmation", 
      uid, 
      sessionId, 
      emailId,
      forced: forced || false 
    });

    return NextResponse.json({ 
      ok: true, 
      forced: forced || false,
      emailId,
      route: "token-confirmation" 
    });
  } catch (error: any) {
    logError("token-confirmation email error", { 
      route: "token-confirmation", 
      method: "POST", 
      forced, 
      error: error?.message || 'unknown',
      stack: error?.stack 
    });
    
    return NextResponse.json({ 
      ok: false, 
      reason: "send-error",
      route: "token-confirmation" 
    }, { status: 500 });
  }
}
