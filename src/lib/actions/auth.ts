"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/session";
import { generateJoinCode, generateToken } from "@/lib/codes";
import { sendEmail, appUrl } from "@/lib/email";
import { requireUser } from "@/lib/auth";
import { ROLES, type Role } from "@/lib/constants";
import {
  createChurchSchema,
  joinChurchSchema,
  loginSchema,
  firstIssueMessage,
} from "@/lib/validation";

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function dashboardPathForRole(role: Role): string {
  switch (role) {
    case ROLES.CHURCH_ADMIN:
      return "/admin/dashboard";
    case ROLES.VOLUNTEER:
      return "/volunteer/dashboard";
    case ROLES.STUDENT:
      return "/student/dashboard";
  }
}

async function issueVerificationEmail(userId: string, email: string) {
  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });
  await sendEmail({
    to: email,
    subject: "Verify your email",
    body: `Confirm your email address to start RSVPing to events and messaging mentors:\n\n${appUrl(
      `/verify/${token}`,
    )}\n\nThis link expires in 24 hours.`,
  });
}

export type ActionResult = { error: string } | void;

/** Creates a new church org. The signer-upper becomes its first CHURCH_ADMIN. */
export async function createChurchAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createChurchSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    churchName: formData.get("churchName"),
    churchCity: formData.get("churchCity"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { name, email, password, churchName, churchCity } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);

  const { user, church } = await prisma.$transaction(async (tx) => {
    const church = await tx.church.create({
      data: {
        name: churchName,
        city: churchCity || null,
        joinCode: generateJoinCode(),
      },
    });
    const user = await tx.user.create({
      data: { name, email, passwordHash },
    });
    await tx.membership.create({
      data: { userId: user.id, churchId: church.id, role: ROLES.CHURCH_ADMIN },
    });
    return { user, church };
  });

  await issueVerificationEmail(user.id, user.email);

  const token = await createSessionToken({ userId: user.id, activeChurchId: church.id });
  await setSessionCookie(token);

  redirect("/admin/dashboard");
}

/** Joins an existing church via its join code, as a volunteer or student. */
export async function joinChurchAction(
  joinCode: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = joinChurchSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { name, email, password, role } = parsed.data;

  const church = await prisma.church.findUnique({ where: { joinCode: joinCode.toUpperCase() } });
  if (!church) {
    return { error: "That join code doesn't match a church. Double-check it and try again." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists. Try logging in instead." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name, email, passwordHash } });
    await tx.membership.create({
      data: { userId: user.id, churchId: church.id, role },
    });
    return user;
  });

  await issueVerificationEmail(user.id, user.email);

  const token = await createSessionToken({ userId: user.id, activeChurchId: church.id });
  await setSessionCookie(token);

  redirect(dashboardPathForRole(role as Role));
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true },
  });
  if (!user) {
    return { error: "Incorrect email or password." };
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Incorrect email or password." };
  }

  const firstMembership = user.memberships[0];
  if (!firstMembership) {
    // Shouldn't happen in practice (every signup path creates one membership),
    // but fail toward "join a church" rather than a broken session.
    redirect("/join");
  }

  const token = await createSessionToken({
    userId: user.id,
    activeChurchId: firstMembership.churchId,
  });
  await setSessionCookie(token);

  redirect(dashboardPathForRole(firstMembership.role as Role));
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

/** Switches which church's dashboard a multi-membership user is viewing. */
export async function switchChurchAction(churchId: string) {
  const user = await requireUser();
  const membership = user.memberships.find((m) => m.churchId === churchId);
  if (!membership) {
    throw new Error("You are not a member of that church.");
  }
  const token = await createSessionToken({ userId: user.id, activeChurchId: churchId });
  await setSessionCookie(token);
  redirect(dashboardPathForRole(membership.role as Role));
}

export async function verifyEmailAction(token: string): Promise<{ error?: string }> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) {
    return { error: "That verification link is invalid or has expired." };
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return {};
}
