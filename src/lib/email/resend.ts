// src/lib/email/resend.ts
import { Resend } from 'resend';

//verify env vars exist. if not, throw error. 
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set'); //throw error if env var is missing. 
}
if (!process.env.EMAIL_FROM) {
  throw new Error('EMAIL_FROM is not set'); // throw error if "from" email address is missing
}

//create an instance of the Resend client to use anywhere in the app that needs to send an email. 
export const resend = new Resend(process.env.RESEND_API_KEY);

//define the shape of the arguments expected when calling sendEmail
type SendArgs = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendArgs) {
  const from = process.env.EMAIL_FROM!;
  const res = await resend.emails.send({ from, to, subject, html });
  return res;
}
