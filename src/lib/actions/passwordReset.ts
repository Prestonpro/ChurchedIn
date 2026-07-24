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

/**
 * Always resolves to the same generic success state regardless of whether
 * the email matches an account — this is the one place in the app that
 * deliberately closes an enumeration gap the signup/join forms already
 * leave open elsewhere ("an account with that email already exists"),
 * because a password-reset endpoint is the highest-value place an attacker
 * would probe for valid emails, and closing it here costs nothing.
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
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.$transaction([
      // Invalidate any previously-issued, still-usable tokens for this user
      // — only one live reset link should ever exist at a time.
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      }),
    ]);

    const resetEmail = passwordResetEmail({ resetUrl: appUrl(`/reset-password/${token}`) });
    await sendEmail({ to: user.email, subject: resetEmail.subject, body: resetEmail.text, html: resetEmail.html });
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
