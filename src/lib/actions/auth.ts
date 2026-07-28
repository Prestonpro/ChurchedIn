"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/session";
import { generateJoinCode } from "@/lib/codes";
import { requireUser } from "@/lib/auth";
import { ROLES, dashboardPathForRole, type Role } from "@/lib/constants";
import {
  createChurchSchema,
  joinChurchSchema,
  loginSchema,
  firstIssueMessage,
} from "@/lib/validation";

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
        claimedAt: new Date(),
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

  const token = await createSessionToken({ userId: user.id, activeChurchId: church.id });
  await setSessionCookie(token);

  redirect("/admin/welcome");
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
  if (!user || !user.passwordHash) {
    // Same generic message whether the account doesn't exist or is a
    // Google-only account with no password — avoids revealing which case
    // it is (the app already accepts some enumeration on the signup forms,
    // but there's no reason to add a *new* distinguishing signal here).
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
