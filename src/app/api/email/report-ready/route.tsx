// src/app/api/email/report-ready/route.ts
import { NextRequest, NextResponse } from 'next/server'; //let file act as an api endpoint (send and receive JSON).
import { z } from 'zod'; // schema validation to ensure request body has the fields and types expected.
import { sendEmail } from '@/lib/email/resend'; // wraps resend client to allow sending emails with a function call
import { render } from '@react-email/render'; // Turns React email component into HTML that can be sent as an email.
import ReportReadyEmail, { subject } from '@/emails/ReportReadyEmail'; // React email template and subject line for "report ready" email. 
import { getAdminDb } from '@/lib/firebase-admin'; // get access to firestore admin SDK to read/write 
import { logInfo, logWarn, logError } from '@/lib/log'; // helper functions to standardize logging, warnings
import React from 'react'; //required to serve a react component (ReportReadyEmail)

export const runtime = "nodejs"; // forces route to run in Node.js (not edge), for Firebase admin and some Node APIs. 
export const dynamic = "force-dynamic"; // tells Next this route is dynamic and not statically cached.

//define the shape of the expected request body using Zod
const reportReadySchema = z.object({ 
  uid: z.string(),
  ideaId: z.string(),
  email: z.string().email(),
  ideaTitle: z.string(),
  reportUrl: z.string(),
  name: z.string().optional(),
});

// GET handler mainly for health checks and debugging. 
export async function GET() {
  console.log('GET /api/email/report-ready invoked'); // logs that the GET endpoint was hit. 
  return NextResponse.json({ ok: true, route: 'report-ready' }); //returns JSON response to confirm route works. 
}

// main POST handler that send the email
export async function POST(req: NextRequest) {
  // parse query string from the request URL
  const { searchParams } = new URL(req.url); // create a URL obj from the request url to access query params
  const forced = searchParams.get("force") === "true"; // check if the caller passed ?force=true to override idempotency
  
  try {
    // parse and validate JSON body agains Zod schema. 
    const parse = reportReadySchema.safeParse(await req.json()); //parse request bod and validate it. 
    if (!parse.success) {
      logError("report-ready email validation failed", { 
        route: "report-ready", 
        method: "POST", 
        forced, 
        details: parse.error.issues //include validation issues in the logs (for debugging)
      });
      return NextResponse.json({ 
        ok: false, 
        reason: "validation-failed", //respond that call failed due to invalid input. 
        details: parse.error.issues, // return validation errors. 
        route: "report-ready" 
      }, { status: 400 });
    }

    //if validation passes, extract the typed data from parse.data
    const { uid, ideaId, email, ideaTitle, reportUrl, name } = parse.data;

    // log that were starting the email process. 
    logInfo("report-ready email request started", { 
      route: "report-ready", 
      method: "POST", 
      forced, 
      uid, 
      ideaId,
      hasName: !!name // flag to show if a name was provided. 
    });

    // Idempotency: check idea flag (has an email already been sent for this idea?) but skip if explicitly forced. 
    if (!forced) { // normal path
      const ideaRef = getAdminDb().collection('users').doc(uid).collection('ideas').doc(ideaId); // references specific idea doc in firestore
      const snap = await ideaRef.get(); // fetch doc snapshot
      if (snap.exists && snap.data()?.reportReadyEmailSent) { // if idea exists and the flag says we already sent this email
        logInfo("report-ready email skipped - already sent", { 
          route: "report-ready", 
          uid, 
          ideaId, 
          skipped: true, 
          reason: "already-sent" 
        });
        return NextResponse.json({ 
          ok: true, 
          skipped: true, //tells caller we didnt send becuase it was already sent.
          reason: "already-sent",
          route: "report-ready" 
        });
      }
    } else {
      // if forced=true, bypass idempotency check and log a warning
      logWarn("report-ready email forced send", { 
        route: "report-ready", 
        uid, 
        ideaId, 
        forced: true 
      });
    }

    // render the React email template as HTML using provided data. 
    const html = await render(<ReportReadyEmail ideaTitle={ideaTitle} reportUrl={reportUrl} name={name} />);
    const res = await sendEmail({ // use our sendEmail helper to actually send the email via Resend. 
      to: email,
      subject: subject,
      html,
    });

    // try to read the email ID from the Resend response (if available)
    const emailId = (res as any)?.id || null;
    
    // Set idempotency flag on the idea document
    const ideaRef = getAdminDb().collection('users').doc(uid).collection('ideas').doc(ideaId);
    await ideaRef.set({ reportReadyEmailSent: true }, { merge: true });

    // log that the email was sent successfully.
    logInfo("report-ready email sent successfully", { 
      route: "report-ready", 
      uid, 
      ideaId, 
      emailId,
      forced: forced || false, //indicate if it was forced or normal. 
      hasName: !!name
    });

    //return a success response to the caller
    return NextResponse.json({ 
      ok: true, 
      forced: forced || false,
      emailId,
      route: "report-ready" 
    });
  } catch (error: any) { //catch any unexpected errors (network, resend, firestire issues, etc.)
    logError("report-ready email error", { 
      route: "report-ready", 
      method: "POST", 
      forced, 
      error: error?.message || 'unknown', // log error if available
      stack: error?.stack // log stack trace if available
    });

    // return a generic server error to the caller
    return NextResponse.json({ 
      ok: false, 
      reason: "send-error",
      route: "report-ready" 
    }, { status: 500 });
  }
}
