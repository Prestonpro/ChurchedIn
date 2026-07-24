"use server";

import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendEmail, appUrl } from "@/lib/email";
import { passwordResetEmail } from "@/lib/emailTemplates";
import { forgotPasswordSchema, resetPasswordSchema, firstIssueMessage } from "@/lib/validation";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export type ActionResult = { error: string } | { ok: true } | void;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Invalidates any previous live token, issues a new one, and emails the
 * reset link. Deliberately not awaited by the caller — see the note on
 * requestPasswordResetAction for why. */
async function issueResetTokenAndEmail(userId: string, email: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.$transaction([
    // Invalidate any previously-issued, still-usable tokens for this user
    // — only one live reset link should ever exist at a time.
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  const resetEmail = passwordResetEmail({ resetUrl: appUrl(`/reset-password/${token}`) });
  await sendEmail({ to: email, subject: resetEmail.subject, body: resetEmail.text, html: resetEmail.html });
}

/**
 * Always resolves to the same generic success state regardless of whether
 * the email matches an account — this is the one place in the app that
 * deliberately closes an enumeration gap the signup/join forms already
 * leave open elsewhere ("an account with that email already exists"),
 * because a password-reset endpoint is the highest-value place an attacker
 * would probe for valid emails, and closing it here costs nothing.
 *
 * Token issuance + email sending is deliberately fired without awaiting:
 * if the "account exists" branch awaited a transaction and an email send
 * while the "doesn't exist" branch returned immediately, the response time
 * itself would be a timing side-channel an attacker could use to probe for
 * valid emails — defeating the point of the generic response. Not awaiting
 * makes both branches return equally fast; the errors it can still throw
 * are logged, never surfaced to the caller (which is correct here — this
 * background work has no result the caller could act on anyway).
 */
export async function requestPasswordResetAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Google-only accounts (no passwordHash) have no password to reset —
  // silently no-op rather than reveal that distinction to the caller.
  if (user && user.passwordHash) {
    void issueResetTokenAndEmail(user.id, user.email).catch((err: unknown) => {
      console.error("[password reset] Failed to issue token / send email:", err);
    });
  }

  return { ok: true };
}

export type TokenCheckResult = { valid: true } | { valid: false; reason: string };

/** Used by the reset-password page itself to show "invalid/expired" before the user even fills out the form. */
export async function checkResetToken(token: string): Promise<TokenCheckResult> {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record) return { valid: false, reason: "This reset link is invalid." };
  if (record.usedAt) return { valid: false, reason: "This reset link has already been used." };
  if (record.expiresAt < new Date()) return { valid: false, reason: "This reset link has expired." };
  return { valid: true };
}

export async function resetPasswordAction(
  token: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    // Mark this token used, and invalidate any other still-usable tokens
    // for the same user (e.g. from an earlier request that got resent).
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?reset=success");
}
