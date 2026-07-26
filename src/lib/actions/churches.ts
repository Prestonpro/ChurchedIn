"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { generateJoinCode } from "@/lib/codes";
import { isVerifiedElsewhere, hasUserVouchedForChurch } from "@/lib/queries";
import { ROLES, VERIFICATION_STATUS, VOUCHES_NEEDED_FOR_COMMUNITY_VERIFIED } from "@/lib/constants";
import { churchProfileSchema, firstIssueMessage } from "@/lib/validation";

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

/**
 * Community vouching: any user who's a member of at least one already-
 * verified church can vouch for a different one. At
 * VOUCHES_NEEDED_FOR_COMMUNITY_VERIFIED vouches, the church upgrades to
 * COMMUNITY_VERIFIED (never downgrades an already PASTOR_VERIFIED church).
 */
export async function requestVouchAction(churchId: string): Promise<ActionResult> {
  const user = await requireUser();

  const church = await prisma.church.findUnique({ where: { id: churchId } });
  if (!church) {
    return { error: "That church no longer exists." };
  }
  if (user.memberships.some((m) => m.churchId === churchId)) {
    return { error: "You can't vouch for a church you already belong to." };
  }
  if (!(await isVerifiedElsewhere(user.id, churchId))) {
    return { error: "You need to belong to a verified church before you can vouch for another." };
  }
  if (await hasUserVouchedForChurch(user.id, churchId)) {
    return { error: "You've already vouched for this church." };
  }

  await prisma.churchVouch.create({ data: { churchId, userId: user.id } });

  const vouchCount = await prisma.churchVouch.count({ where: { churchId } });
  if (vouchCount >= VOUCHES_NEEDED_FOR_COMMUNITY_VERIFIED && church.verificationStatus === VERIFICATION_STATUS.UNVERIFIED) {
    await prisma.church.update({
      where: { id: churchId },
      data: { verificationStatus: VERIFICATION_STATUS.COMMUNITY_VERIFIED },
    });
  }

  revalidatePath(`/churches/${churchId}`);
  revalidatePath("/discover");
  return { ok: true };
}

/**
 * Pastor self-verification — trust-based for now (no email-domain check
 * yet, per the brief). Upgrades the church straight to PASTOR_VERIFIED
 * regardless of its current status (pastor verification outranks
 * community vouching).
 *
 * Who can trigger it: a membership flagged `isPastor` (settable via the
 * church's admin settings — see /churches/[id]/settings), OR a
 * CHURCH_ADMIN. The CHURCH_ADMIN allowance exists because `isPastor` has
 * no way to get set on a fresh church until that settings page exists —
 * without it, the very first admin (presumptively the person actually in
 * charge) would have no path to this feature at all. CHURCH_ADMIN already
 * carries real leadership authority everywhere else in this app, so this
 * isn't loosening the trust bar, just avoiding a dead-end dependency.
 */
export async function verifyAsPastorAction(churchId: string): Promise<ActionResult> {
  const user = await requireUser();

  const membership = await prisma.membership.findUnique({
    where: { userId_churchId: { userId: user.id, churchId } },
  });
  if (!membership || !(membership.isPastor || membership.role === ROLES.CHURCH_ADMIN)) {
    return { error: "Only a church leader or recognized pastor can do this." };
  }

  await prisma.church.update({
    where: { id: churchId },
    data: { verificationStatus: VERIFICATION_STATUS.PASTOR_VERIFIED },
  });

  revalidatePath(`/churches/${churchId}`);
  revalidatePath("/discover");
  revalidatePath("/admin/dashboard");
}
