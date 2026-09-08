/**
 * Transactional email — Resend HTTP API (no SDK dependency).
 *
 * Setup:
 *   1. Create a Resend account, verify your sending domain (or start with
 *      the sandbox address onboarding@resend.dev while testing).
 *   2. Set env vars on the deployment:
 *        RESEND_API_KEY = re_...
 *        EMAIL_FROM     = "LinkForge <noreply@linkforge.digital>"
 *
 * Every caller must degrade gracefully when email is not configured —
 * this app previously had NO email capability, so callers log clearly
 * and keep working.
 */

const RESEND_API = "https://api.resend.com/emails";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  sent: boolean;
  reason?: string;
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[Email] RESEND_API_KEY not configured — email not sent");
    return { sent: false, reason: "email not configured" };
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
        ...(opts.text ? { text: opts.text } : {}),
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

/**
 * Branded password reset email. Returns subject/html/text plus the reset link.
 */
export function passwordResetEmail(appUrl: string, token: string): {
  subject: string;
  html: string;
  text: string;
  link: string;
} {
  const link = `${appUrl}/reset-password?token=${token}`;
  const subject = "Reset your LinkForge password";
  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f97316,#f59e0b);display:inline-flex;align-items:center;justify-content:center;">
      <span style="color:#fff;font-weight:800;font-size:16px;">L</span>
    </div>
    <span style="font-size:20px;font-weight:800;">Link<span style="color:#f97316;">Forge</span></span>
  </div>
  <h1 style="font-size:22px;margin:0 0 12px;">Reset your password</h1>
  <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 20px;">
    We received a request to reset the password for your LinkForge account.
    Click the button below to choose a new one. This link expires in <b>1 hour</b>.
  </p>
  <p style="margin:0 0 24px;">
    <a href="${link}" style="display:inline-block;background:linear-gradient(90deg,#f97316,#f59e0b);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 28px;border-radius:10px;">
      Choose a new password
    </a>
  </p>
  <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 8px;">
    Or paste this link into your browser:<br>
    <a href="${link}" style="color:#f97316;word-break:break-all;">${link}</a>
  </p>
  <p style="font-size:13px;color:#64748b;line-height:1.6;margin:24px 0 0;">
    Didn't request this? You can safely ignore this email — your password stays unchanged.
  </p>
  <p style="font-size:12px;color:#94a3b8;margin:24px 0 0;">— The LinkForge team</p>
</div>`;
  const text = `Reset your LinkForge password (valid 1 hour): ${link}\n\nDidn't request this? Ignore this email.`;
  return { subject, html, text, link };
}
