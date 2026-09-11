/**
 * Transactional email via Resend's REST API.
 * Zero dependencies: uses fetch, so it works in any Next.js runtime.
 * No tokens or API keys are stored in this file — everything comes from env vars.
 */

const RESEND_API = "https://api.resend.com/emails";

export interface SendEmailResult {
  sent: boolean;
  reason?: string;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[Email] RESEND_API_KEY not set — email not sent");
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }

  const from = process.env.EMAIL_FROM || "LinkForge <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Email] Send failed (${res.status}): ${body.slice(0, 300)}`);
      return { sent: false, reason: `provider error ${res.status}` };
    }

    return { sent: true };
  } catch (err) {
    console.error("[Email] Send error:", err);
    return { sent: false, reason: "network error" };
  }
}

export function passwordResetEmail(appUrl: string, token: string) {
  const link = `${appUrl}/reset-password?token=${token}`;

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f4f5f7; padding:32px;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
      <div style="font-size:22px; font-weight:800; color:#ea580c; margin-bottom:20px;">🔥 LinkForge</div>
      <h1 style="font-size:20px; margin:0 0 12px; color:#111827;">Reset your password</h1>
      <p style="font-size:14px; color:#374151; margin:0 0 20px;">
        You (or someone else) requested a password reset for your LinkForge account.
        Click the button below to choose a new password. This link expires in 1 hour.
      </p>
      <a href="${link}" style="display:inline-block; background:#ea580c; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px; padding:12px 24px; border-radius:8px;">
        Choose a new password
      </a>
      <p style="font-size:12px; color:#6b7280; margin:24px 0 0;">
        If the button doesn't work, paste this link into your browser:<br>
        <span style="color:#9ca3af;">${link}</span>
      </p>
      <p style="font-size:12px; color:#6b7280; margin:16px 0 0;">
        Didn't request this? You can safely ignore this email — your password won't change.
      </p>
      <p style="font-size:12px; color:#9ca3af; margin:24px 0 0;">— The LinkForge team</p>
    </div>
  </div>`;

  const text = `Reset your LinkForge password: ${link} (valid 1 hour). If you didn't request this, ignore this email.`;

  return { subject: "Reset your LinkForge password", html, text, link };
}

export function verificationEmail(appUrl: string, token: string) {
  const link = `${appUrl}/verify-email?token=${token}`;

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f4f5f7; padding:32px;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px;">
      <div style="font-size:22px; font-weight:800; color:#ea580c; margin-bottom:20px;">🔥 LinkForge</div>
      <h1 style="font-size:20px; margin:0 0 12px; color:#111827;">Verify your email address</h1>
      <p style="font-size:14px; color:#374151; margin:0 0 20px;">
        Welcome to LinkForge! One quick step left: confirm this email address so we know
        it's really you. Verification unlocks crawling and AI link suggestions on your account.
      </p>
      <a href="${link}" style="display:inline-block; background:#ea580c; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px; padding:12px 24px; border-radius:8px;">
        Verify my email
      </a>
      <p style="font-size:12px; color:#6b7280; margin:24px 0 0;">
        If the button doesn't work, paste this link into your browser:<br>
        <span style="color:#9ca3af;">${link}</span>
      </p>
      <p style="font-size:12px; color:#6b7280; margin:16px 0 0;">
        Didn't create a LinkForge account? You can safely ignore this email.
      </p>
      <p style="font-size:12px; color:#9ca3af; margin:24px 0 0;">— The LinkForge team</p>
    </div>
  </div>`;

  const text = `Welcome to LinkForge! Verify your email address: ${link} (valid 24 hours). If you didn't sign up, ignore this email.`;

  return { subject: "Verify your email — LinkForge", html, text, link };
}
