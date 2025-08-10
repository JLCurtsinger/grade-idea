// src/lib/email/client.ts
// Client-side wrapper for email API endpoints

export interface WelcomeEmailParams {
  uid: string;
  email: string;
  name?: string;
}

export interface WelcomeEmailResponse {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  emailId?: string;
  forced?: boolean;
  route?: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<WelcomeEmailResponse> {
  try {
    const response = await fetch('/api/email/welcome', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[WelcomeEmail] Client error:', error);
    return {
      ok: false,
      reason: 'client-error',
      route: 'welcome',
    };
  }
}
