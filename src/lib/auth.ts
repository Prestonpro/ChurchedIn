import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { ROLES, type Role } from "@/lib/constants";

/**
 * Loads the signed-in user plus all their church memberships, and resolves
 * which membership is "active" (the church whose dashboard they're using).
 * A user can belong to more than one church; almost everyone has exactly
 * one, so most call sites can just use `activeMembership` without ever
 * thinking about the multi-church case.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSessionPayload();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { memberships: { include: { church: true } } },
  });
  if (!user) return null;

  const activeMembership =
    user.memberships.find((m) => m.churchId === session.activeChurchId) ??
    user.memberships[0] ??
    null;

  return { ...user, activeMembership };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Redirects to /login if no one is signed in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

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

/** Redirects unless the signed-in user's *active* membership has this role. */
export async function requireRole(role: Role) {
  const user = await requireUser();
  if (!user.activeMembership) {
    redirect("/join");
  }
  if (user.activeMembership.role !== role) {
    redirect(dashboardPathForRole(user.activeMembership.role));
  }
  return user;
}

/** True if `user` currently has an active, un-declined membership at `churchId`. */
export function isMemberOfChurch(user: CurrentUser, churchId: string): boolean {
  return user.memberships.some((m) => m.churchId === churchId);
}
