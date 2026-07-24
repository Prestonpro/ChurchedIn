import "server-only";

export type EmailMessage = {
  to: string;
  subject: string;
  /** Plain-text body — always sent, and the only thing logged in dev mode. */
  body: string;
  /** Branded HTML body. Optional so ad-hoc/one-off emails can skip it, but
   * every template in src/lib/email/templates.ts provides one. Resend gets
   * both `text` and `html`; email clients that can't render HTML fall back
   * to `text` automatically. */
  html?: string;
};

/**
 * Sends a transactional email. In local development (no RESEND_API_KEY set)
 * this just logs to the console so every flow — RSVP confirmations, waitlist
 * promotions, mentor connection requests — is testable without a real email
 * account. Every call site in this app goes through here, so this is the
 * only file that needs to change to swap providers.
 *
 * Delivery failures (provider outage, an unverified sending domain rejecting
 * a recipient, rate limiting) are logged, never thrown: email is a side
 * effect of actions like RSVPing or requesting a mentor connection, and a
 * provider hiccup must not take down the action itself.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `\n[dev email] to=${message.to} subject="${message.subject}"\n${message.body}\n`,
    );
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Church LinkedIn <onboarding@resend.dev>",
        to: message.to,
        subject: message.subject,
        text: message.body,
        ...(message.html ? { html: message.html } : {}),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[email] Resend rejected message to=${message.to} subject="${message.subject}": ${response.status} ${text}`);
    }
  } catch (error) {
    console.error(`[email] Failed to send to=${message.to} subject="${message.subject}":`, error);
  }
}

export function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}
