import "server-only";

export type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

/**
 * Sends a transactional email. In local development (no RESEND_API_KEY set)
 * this just logs to the console so every flow — verification, RSVP
 * confirmations, connection requests — is testable without a real email
 * account. Swap the body of this function for a Resend (or other provider)
 * call in production; every call site in this app goes through here, so
 * that's the only file that needs to change.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `\n[dev email] to=${message.to} subject="${message.subject}"\n${message.body}\n`,
    );
    return;
  }

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
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send email via Resend: ${response.status} ${text}`);
  }
}

export function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}
