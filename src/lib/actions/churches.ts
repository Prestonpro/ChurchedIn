"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { generateJoinCode } from "@/lib/codes";
import { ROLES, dashboardPathForRole, type Role } from "@/lib/constants";
import { churchProfileSchema, firstIssueMessage } from "@/lib/validation";
import { z } from "zod";

export type ActionResult = { error: string } | { ok: true } | void;

/**
 * Lets an already-logged-in user add a NEW church profile — distinct from
 * createChurchAction (signup/auth.ts), which also creates the account
 * itself. This is for someone who already has an account (possibly
 * already a member elsewhere — multi-membership is already supported via
 * ChurchSwitcher) starting a second church's space. The new church starts
 * UNVERIFIED; the creator becomes its CHURCH_ADMIN, same as at signup.
 */
export async function createChurchProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = churchProfileSchema.safeParse({
    name: formData.get("name"),
    denomination: formData.get("denomination"),
    address: formData.get("address"),
    serviceTimes: formData.get("serviceTimes"),
    languages: formData.get("languages"),
    bio: formData.get("bio"),
    website: formData.get("website"),
    locationLat: formData.get("locationLat") ? Number(formData.get("locationLat")) : null,
    locationLng: formData.get("locationLng") ? Number(formData.get("locationLng")) : null,
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  const church = await prisma.$transaction(async (tx) => {
    const church = await tx.church.create({
      data: {
        name: data.name,
        joinCode: generateJoinCode(),
        claimedAt: new Date(),
        denomination: data.denomination || null,
        address: data.address || null,
        serviceTimes: data.serviceTimes || null,
        languages: data.languages || null,
        bio: data.bio || null,
        website: data.website || null,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
      },
    });
    await tx.membership.create({
      data: { userId: user.id, churchId: church.id, role: ROLES.CHURCH_ADMIN },
    });
    return church;
  });

  // Switch the session to the new church, same as switchChurchAction —
  // the creator should land on ITS admin dashboard/welcome flow, not
  // wherever they were active before.
  const token = await createSessionToken({ userId: user.id, activeChurchId: church.id });
  await setSessionCookie(token);

  redirect("/admin/welcome");
}

const joinRoleSchema = z.enum(["VOLUNTEER", "STUDENT"]);

/**
 * Joins a church the user found on /discover — for an ALREADY-LOGGED-IN
 * user, distinct from the (public)/join/[code] flow (which creates a
 * brand-new account). Multi-membership is already supported everywhere
 * else in this app (ChurchSwitcher); this just adds one more.
 */
export async function joinDiscoveredChurchAction(
  churchId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsedRole = joinRoleSchema.safeParse(formData.get("role"));
  if (!parsedRole.success) {
    return { error: "Choose whether you're joining as a volunteer or a student." };
  }
  const role = parsedRole.data;

  const church = await prisma.church.findUnique({ where: { id: churchId } });
  if (!church) {
    return { error: "That church no longer exists." };
  }
  if (user.memberships.some((m) => m.churchId === churchId)) {
    return { error: "You're already a member of this church." };
  }

  await prisma.membership.create({ data: { userId: user.id, churchId, role } });

  const token = await createSessionToken({ userId: user.id, activeChurchId: churchId });
  await setSessionCookie(token);

  redirect(dashboardPathForRole(role as Role));
}

/**
 * Claims an unclaimed "premade" church listing (e.g. the Bryan/College
 * Station map seed) — the claimer must already be a member (join first,
 * same as anyone else) and the church must not already have a real
 * leader. Promotes their existing membership to CHURCH_ADMIN and marks
 * the church claimed. There's no real identity check yet — "first
 * already-joined member to ask" — same trust-it-for-now spirit as the
 * rest of this MVP; a church-email verification step is the planned
 * next step once this is validated with real users.
 */
export async function claimChurchAdminAction(churchId: string): Promise<ActionResult> {
  const user = await requireUser();
  const membership = user.memberships.find((m) => m.churchId === churchId);
  if (!membership) {
    return { error: "Join this church first, then you can claim it as its leader." };
  }
  if (membership.role === ROLES.CHURCH_ADMIN) {
    return { error: "You're already a leader here." };
  }

  const church = await prisma.church.findUnique({ where: { id: churchId } });
  if (!church) {
    return { error: "That church no longer exists." };
  }
  if (church.claimedAt) {
    return { error: "This church already has a leader." };
  }

  await prisma.$transaction([
    prisma.membership.update({
      where: { userId_churchId: { userId: user.id, churchId } },
      data: { role: ROLES.CHURCH_ADMIN },
    }),
    prisma.church.update({ where: { id: churchId }, data: { claimedAt: new Date() } }),
  ]);

  const token = await createSessionToken({ userId: user.id, activeChurchId: churchId });
  await setSessionCookie(token);

  revalidatePath(`/churches/${churchId}`);
  redirect(dashboardPathForRole(ROLES.CHURCH_ADMIN));
}

async function requireChurchAdmin(churchId: string) {
  const user = await requireUser();
  const membership = user.memberships.find((m) => m.churchId === churchId);
  if (!membership || membership.role !== ROLES.CHURCH_ADMIN) {
    throw new Error("Only a church leader can do this.");
  }
  return { user, membership };
}

/** Church profile editing — /churches/[id]/settings, admin-only. Same
 * fields as creation, just an update instead of an insert. */
export async function updateChurchProfileAction(
  churchId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireChurchAdmin(churchId);

  const parsed = churchProfileSchema.safeParse({
    name: formData.get("name"),
    denomination: formData.get("denomination"),
    address: formData.get("address"),
    serviceTimes: formData.get("serviceTimes"),
    languages: formData.get("languages"),
    bio: formData.get("bio"),
    website: formData.get("website"),
    locationLat: formData.get("locationLat") ? Number(formData.get("locationLat")) : null,
    locationLng: formData.get("locationLng") ? Number(formData.get("locationLng")) : null,
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  await prisma.church.update({
    where: { id: churchId },
    data: {
      name: data.name,
      denomination: data.denomination || null,
      address: data.address || null,
      serviceTimes: data.serviceTimes || null,
      languages: data.languages || null,
      bio: data.bio || null,
      website: data.website || null,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
    },
  });

  revalidatePath(`/churches/${churchId}`);
  revalidatePath(`/churches/${churchId}/settings`);
  revalidatePath("/discover");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

/** Regenerates a church's join code — admin-only, e.g. if the old one
 * leaked or the church just wants a fresh one. */
export async function regenerateJoinCodeAction(churchId: string): Promise<ActionResult> {
  await requireChurchAdmin(churchId);

  await prisma.church.update({
    where: { id: churchId },
    data: { joinCode: generateJoinCode() },
  });

  revalidatePath(`/churches/${churchId}/settings`);
  revalidatePath("/admin/dashboard");
}

/** Promotes a member to CHURCH_ADMIN — admin-only. */
export async function promoteToAdminAction(churchId: string, memberUserId: string): Promise<ActionResult> {
  await requireChurchAdmin(churchId);

  const membership = await prisma.membership.findUnique({
    where: { userId_churchId: { userId: memberUserId, churchId } },
  });
  if (!membership) {
    return { error: "That person isn't a member of this church." };
  }

  await prisma.membership.update({
    where: { userId_churchId: { userId: memberUserId, churchId } },
    data: { role: ROLES.CHURCH_ADMIN },
  });

  revalidatePath(`/churches/${churchId}/settings`);
}

/** Demotes a CHURCH_ADMIN back to VOLUNTEER — admin-only. Refuses to
 * demote the church's last remaining admin, so a church can never end up
 * with no one able to manage it. */
export async function demoteFromAdminAction(churchId: string, memberUserId: string): Promise<ActionResult> {
  await requireChurchAdmin(churchId);

  const adminCount = await prisma.membership.count({ where: { churchId, role: ROLES.CHURCH_ADMIN } });
  const membership = await prisma.membership.findUnique({
    where: { userId_churchId: { userId: memberUserId, churchId } },
  });
  if (!membership) {
    return { error: "That person isn't a member of this church." };
  }
  if (membership.role === ROLES.CHURCH_ADMIN && adminCount <= 1) {
    return { error: "A church needs at least one leader — promote someone else first." };
  }

  await prisma.membership.update({
    where: { userId_churchId: { userId: memberUserId, churchId } },
    data: { role: ROLES.VOLUNTEER },
  });

  revalidatePath(`/churches/${churchId}/settings`);
}

