"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { generateJoinCode } from "@/lib/codes";
import { findSimilarChurches } from "@/lib/queries";
import { ROLES, dashboardPathForRole, roleLabel, type Role } from "@/lib/constants";
import { churchProfileSchema, firstIssueMessage } from "@/lib/validation";
import { z } from "zod";

export type ActionResult = { error: string } | { ok: true } | void;

export type CreateChurchProfileActionResult =
  | { error: string }
  | { duplicates: { id: string; name: string; city: string | null; claimed: boolean }[] }
  | void;

/**
 * Lets an already-logged-in user add a NEW church profile — distinct from
 * createChurchAction (signup/auth.ts), which also creates the account
 * itself. This is for someone who already has an account (possibly
 * already a member elsewhere — multi-membership is already supported via
 * ChurchSwitcher) starting a second church's space. The new church starts
 * UNVERIFIED; the creator becomes its CHURCH_ADMIN, same as at signup.
 *
 * Checks for a likely-duplicate church by name first — see
 * createChurchAction's doc comment for the full reasoning. This form has
 * no dedicated city field (just a free-text map address), so the check is
 * name-only here; confirmDuplicate skips it, same escape hatch as signup.
 */
export async function createChurchProfileAction(
  _prev: CreateChurchProfileActionResult,
  formData: FormData,
): Promise<CreateChurchProfileActionResult> {
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

  if (formData.get("confirmDuplicate") !== "1") {
    const similar = await findSimilarChurches(data.name);
    if (similar.length > 0) {
      return {
        duplicates: similar.map((c) => ({
          id: c.id,
          name: c.name,
          city: c.city,
          claimed: c.claimedAt !== null,
        })),
      };
    }
  }

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
 *
 * A church with a real leader (`claimedAt` set) requires its join code,
 * same boundary the brand-new-account /join/[code] flow already enforces —
 * without this, anyone could join any live church with no invitation and
 * reach its members' rides/events/friend requests. An unclaimed map
 * listing (no leader yet to hand out a code) skips this check, since it
 * has to stay joinable for the "claim this church" flow to have anyone to
 * claim it.
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

  if (church.claimedAt) {
    const submittedCode = formData.get("joinCode");
    if (typeof submittedCode !== "string" || submittedCode.trim().toUpperCase() !== church.joinCode) {
      return { error: "That invite code doesn't match. Ask this church's leader for the code they use to invite people." };
    }
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
  // /discover renders a "Not yet claimed" badge off this same flag, so it has
  // to be refreshed too or the church stays visibly unclaimed to everyone.
  revalidatePath("/discover");
  revalidatePath("/admin/dashboard");
  redirect(dashboardPathForRole(ROLES.CHURCH_ADMIN));
}

const NOT_A_CHURCH_ADMIN = { error: "Only a church leader can do this." } as const;

/**
 * Returns null instead of throwing when the caller isn't an admin of this
 * church. Throwing turned an ordinary, recoverable authorization miss into an
 * uncaught exception that bubbled up to app/error.tsx's full-page fallback —
 * every other guard in this codebase (churchPartnerships, connections, rides)
 * returns `{ error }` so the form can show it inline, and these four actions now
 * match. Callers pair this with NOT_A_CHURCH_ADMIN above.
 */
async function requireChurchAdmin(churchId: string) {
  const user = await requireUser();
  const membership = user.memberships.find((m) => m.churchId === churchId);
  if (!membership || membership.role !== ROLES.CHURCH_ADMIN) {
    return null;
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
  if (!(await requireChurchAdmin(churchId))) {
    return NOT_A_CHURCH_ADMIN;
  }

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
  if (!(await requireChurchAdmin(churchId))) {
    return NOT_A_CHURCH_ADMIN;
  }

  await prisma.church.update({
    where: { id: churchId },
    data: { joinCode: generateJoinCode() },
  });

  revalidatePath(`/churches/${churchId}/settings`);
  revalidatePath("/admin/dashboard");
}

/** Promotes a member to CHURCH_ADMIN — admin-only. */
export async function promoteToAdminAction(churchId: string, memberUserId: string): Promise<ActionResult> {
  if (!(await requireChurchAdmin(churchId))) {
    return NOT_A_CHURCH_ADMIN;
  }

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
  if (!(await requireChurchAdmin(churchId))) {
    return NOT_A_CHURCH_ADMIN;
  }

  const adminCount = await prisma.membership.count({ where: { churchId, role: ROLES.CHURCH_ADMIN } });
  const membership = await prisma.membership.findUnique({
    where: { userId_churchId: { userId: memberUserId, churchId } },
  });
  if (!membership) {
    return { error: "That person isn't a member of this church." };
  }
  if (membership.role === ROLES.CHURCH_ADMIN && adminCount <= 1) {
    return { error: "A church needs at least one leader. Promote someone else first." };
  }

  await prisma.membership.update({
    where: { userId_churchId: { userId: memberUserId, churchId } },
    data: { role: ROLES.VOLUNTEER },
  });

  revalidatePath(`/churches/${churchId}/settings`);
}

const switchableRoleSchema = z.enum(["STUDENT", "VOLUNTEER"]);

/**
 * Lets a member switch their own role at a church, between STUDENT and
 * VOLUNTEER — self-service, no admin needed. CHURCH_ADMIN is never a
 * target here (that stays admin-granted only, via promoteToAdminAction);
 * stepping down FROM admin to either regular role IS allowed, subject to
 * the same "a church always needs at least one leader" rule
 * demoteFromAdminAction enforces.
 *
 * Profile data tied to the role you're leaving (the StudentProfile row,
 * or the volunteer fields carried directly on User — jobTitle, languages,
 * openToMentorship, etc.) is left untouched rather than deleted, so
 * switching back later picks up right where it left off instead of
 * starting over.
 */
export async function switchRoleAction(churchId: string, newRole: "STUDENT" | "VOLUNTEER"): Promise<ActionResult> {
  const user = await requireUser();
  const parsedRole = switchableRoleSchema.safeParse(newRole);
  if (!parsedRole.success) {
    return { error: "Choose a valid role." };
  }

  const membership = user.memberships.find((m) => m.churchId === churchId);
  if (!membership) {
    return { error: "You're not a member of this church." };
  }
  if (membership.role === newRole) {
    return { error: `You're already a ${roleLabel(newRole).toLowerCase()}.` };
  }
  if (membership.role === ROLES.CHURCH_ADMIN) {
    const adminCount = await prisma.membership.count({ where: { churchId, role: ROLES.CHURCH_ADMIN } });
    if (adminCount <= 1) {
      return { error: "A church needs at least one leader. Promote someone else before stepping down." };
    }
  }

  await prisma.membership.update({
    where: { userId_churchId: { userId: user.id, churchId } },
    data: { role: newRole },
  });

  const token = await createSessionToken({ userId: user.id, activeChurchId: churchId });
  await setSessionCookie(token);

  revalidatePath(`/churches/${churchId}`);
  revalidatePath(`/churches/${churchId}/settings`);
  redirect(dashboardPathForRole(newRole));
}

/**
 * Lets a member leave a church on their own — removes their Membership row
 * entirely. Refuses if they're the church's last CHURCH_ADMIN, same rule
 * as above (leaving is effectively self-demotion to nothing).
 *
 * Reissues the session pointed at another remaining membership, since the
 * old activeChurchId no longer resolves to anything once the row is gone.
 * If this was their only church, falls back to the church-less ""
 * activeChurchId — the exact same convention createBrowsingAccountAction
 * and joinChurchAsExistingUserAction already use for "no church yet."
 * Doesn't touch this user's other data at this church (past RSVPs,
 * HelpRequests, etc.) — same "leave the history, remove the membership"
 * choice every other part of this app makes when someone steps away.
 */
export async function leaveChurchAction(churchId: string): Promise<ActionResult> {
  const user = await requireUser();
  const membership = user.memberships.find((m) => m.churchId === churchId);
  if (!membership) {
    return { error: "You're not a member of this church." };
  }

  if (membership.role === ROLES.CHURCH_ADMIN) {
    const adminCount = await prisma.membership.count({ where: { churchId, role: ROLES.CHURCH_ADMIN } });
    if (adminCount <= 1) {
      return { error: "A church needs at least one leader. Promote someone else before you leave." };
    }
  }

  await prisma.membership.delete({ where: { userId_churchId: { userId: user.id, churchId } } });

  const remaining = user.memberships.filter((m) => m.churchId !== churchId);
  const next = remaining[0];
  const token = await createSessionToken({ userId: user.id, activeChurchId: next?.churchId ?? "" });
  await setSessionCookie(token);

  revalidatePath(`/churches/${churchId}`);
  revalidatePath("/discover");
  redirect(next ? dashboardPathForRole(next.role as Role) : "/discover");
}

