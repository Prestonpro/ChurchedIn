"use server";

import { randomBytes, createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { sendEmail, appUrl } from "@/lib/email";
import { coAdminInviteEmail } from "@/lib/emailTemplates";
import { emailSchema } from "@/lib/validation";
import { ROLES } from "@/lib/constants";
import { z } from "zod";

const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type ActionResult = { error: string } | { ok: true } | void;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Invites someone (by email) to co-lead the caller's church as a second
 * CHURCH_ADMIN — the "you don't have to do this alone" prompt shown right
 * after creating a church. Admin-only (must already lead this church).
 * Same hash-at-rest / single-use / expiring pattern as password reset
 * tokens. Deliberately doesn't reveal whether the email already has an
 * account — that's resolved when the link is opened, not here.
 */
export async function inviteCoAdminAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership || user.activeMembership.role !== ROLES.CHURCH_ADMIN) {
    return { error: "Only a church leader can send this invite." };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }
  const email = parsed.data;
  const churchId = user.activeMembership.churchId;

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  await prisma.$transaction([
    // Only one live invite per email/church at a time — same pattern as
    // password reset tokens invalidating prior ones on a new request.
    prisma.churchAdminInvite.updateMany({
      where: { churchId, email, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.churchAdminInvite.create({
      data: { churchId, email, tokenHash, expiresAt },
    }),
  ]);

  const church = await prisma.church.findUniqueOrThrow({ where: { id: churchId } });
  const invite = coAdminInviteEmail({
    inviterName: user.name,
    churchName: church.name,
    acceptUrl: appUrl(`/join-as-admin/${token}`),
  });
  await sendEmail({ to: email, subject: invite.subject, body: invite.text, html: invite.html });

  return { ok: true };
}

export type InviteCheckResult =
  | { valid: true; email: string; churchName: string }
  | { valid: false; reason: string };

export async function checkCoAdminInvite(token: string): Promise<InviteCheckResult> {
  const tokenHash = hashToken(token);
  const invite = await prisma.churchAdminInvite.findUnique({
    where: { tokenHash },
    include: { church: { select: { name: true } } },
  });
  if (!invite) return { valid: false, reason: "This invite link is invalid." };
  if (invite.usedAt) return { valid: false, reason: "This invite has already been used." };
  if (invite.expiresAt < new Date()) return { valid: false, reason: "This invite has expired." };
  return { valid: true, email: invite.email, churchName: invite.church.name };
}

const acceptNewAccountSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  password: z.string().min(8, "At least 8 characters"),
});

/**
 * Accepts a co-admin invite for someone who doesn't have an account yet —
 * creates the account and the CHURCH_ADMIN membership together, then logs
 * them in. For an email that already has an account, the invite page
 * sends them to log in instead (see the join-as-admin page) — this action
 * only ever creates a brand-new user.
 */
export async function acceptNewCoAdminAction(
  token: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const check = await checkCoAdminInvite(token);
  if (!check.valid) {
    return { error: check.reason };
  }

  const parsed = acceptNewAccountSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const existing = await prisma.user.findUnique({ where: { email: check.email } });
  if (existing) {
    return { error: "An account with that email already exists — log in instead." };
  }

  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(parsed.data.password);

  const { user, invite } = await prisma.$transaction(async (tx) => {
    const invite = await tx.churchAdminInvite.findUniqueOrThrow({ where: { tokenHash } });
    const user = await tx.user.create({
      data: { name: parsed.data.name, email: check.email, passwordHash },
    });
    await tx.membership.create({
      data: { userId: user.id, churchId: invite.churchId, role: ROLES.CHURCH_ADMIN },
    });
    await tx.churchAdminInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
    return { user, invite };
  });

  const sessionToken = await createSessionToken({ userId: user.id, activeChurchId: invite.churchId });
  await setSessionCookie(sessionToken);
  redirect("/admin/dashboard");
}

/** Accepts a co-admin invite for someone who's already logged in with a
 * matching email — just adds the Membership. */
/** Bound into `useActionState` by AcceptExistingButton, so it carries the
 * `(boundArg, prevState, formData)` tail CLAUDE.md requires — same shape as
 * acceptNewCoAdminAction above, which is the logged-out counterpart. */
export async function acceptExistingCoAdminAction(
  token: string,
  _prev: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  const check = await checkCoAdminInvite(token);
  if (!check.valid) {
    return { error: check.reason };
  }
  if (check.email !== user.email) {
    return { error: "This invite was sent to a different email address." };
  }

  const tokenHash = hashToken(token);
  await prisma.$transaction(async (tx) => {
    const invite = await tx.churchAdminInvite.findUniqueOrThrow({ where: { tokenHash } });
    await tx.membership.upsert({
      where: { userId_churchId: { userId: user.id, churchId: invite.churchId } },
      create: { userId: user.id, churchId: invite.churchId, role: ROLES.CHURCH_ADMIN },
      update: { role: ROLES.CHURCH_ADMIN },
    });
    await tx.churchAdminInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
  });

  redirect("/admin/dashboard");
}
