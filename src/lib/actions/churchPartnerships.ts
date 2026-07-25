"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ROLES, PARTNERSHIP_STATUS } from "@/lib/constants";

export type ActionResult = { error: string } | { ok: true } | void;

/**
 * Requests a cross-church partnership by the other church's join code —
 * "Collaborate with another church" from the redesign brief. Admin-only.
 * Once the other side's admin accepts (respondToPartnershipAction), each
 * church's members can browse (read-only) the other's published events —
 * RSVPs, the friend directory, and mentor connections stay single-church.
 */
export async function requestPartnershipAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership || user.activeMembership.role !== ROLES.CHURCH_ADMIN) {
    return { error: "Only a church leader can send a partnership request." };
  }
  const churchId = user.activeMembership.churchId;

  const raw = String(formData.get("joinCode") ?? "").trim().toUpperCase();
  if (!raw) {
    return { error: "Enter the other church's join code." };
  }

  const target = await prisma.church.findUnique({ where: { joinCode: raw } });
  if (!target) {
    return { error: "No church found with that join code." };
  }
  if (target.id === churchId) {
    return { error: "You can't partner with your own church." };
  }

  const existing = await prisma.churchPartnership.findFirst({
    where: {
      OR: [
        { requestingChurchId: churchId, partnerChurchId: target.id },
        { requestingChurchId: target.id, partnerChurchId: churchId },
      ],
    },
  });
  if (existing) {
    return {
      error:
        existing.status === PARTNERSHIP_STATUS.ACCEPTED
          ? "You're already partnered with that church."
          : "There's already a pending request with that church.",
    };
  }

  await prisma.churchPartnership.create({
    data: { requestingChurchId: churchId, partnerChurchId: target.id },
  });

  revalidatePath("/admin/dashboard");
  return { ok: true };
}

/** Accepts or declines an incoming partnership request — only the
 * recipient church's admin can respond. Declining just deletes the row. */
export async function respondToPartnershipAction(
  partnershipId: string,
  accept: boolean,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership || user.activeMembership.role !== ROLES.CHURCH_ADMIN) {
    return { error: "Only a church leader can respond to this request." };
  }

  const partnership = await prisma.churchPartnership.findUnique({ where: { id: partnershipId } });
  if (!partnership) {
    return { error: "That request no longer exists." };
  }
  if (partnership.partnerChurchId !== user.activeMembership.churchId) {
    return { error: "Only the invited church's leader can respond to this request." };
  }
  if (partnership.status !== PARTNERSHIP_STATUS.PENDING) {
    return { error: "That request has already been handled." };
  }

  if (accept) {
    await prisma.churchPartnership.update({
      where: { id: partnershipId },
      data: { status: PARTNERSHIP_STATUS.ACCEPTED, respondedAt: new Date() },
    });
  } else {
    await prisma.churchPartnership.delete({ where: { id: partnershipId } });
  }

  revalidatePath("/admin/dashboard");
}

/** Ends a partnership (cancels a pending request you sent, or ends an
 * accepted one) — either side's admin can do this. Always just deletes the
 * row; there's no history to preserve for an MVP feature like this. */
export async function endPartnershipAction(partnershipId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership || user.activeMembership.role !== ROLES.CHURCH_ADMIN) {
    return { error: "Only a church leader can do this." };
  }

  const partnership = await prisma.churchPartnership.findUnique({ where: { id: partnershipId } });
  if (!partnership) {
    return { error: "That partnership no longer exists." };
  }
  const churchId = user.activeMembership.churchId;
  if (partnership.requestingChurchId !== churchId && partnership.partnerChurchId !== churchId) {
    return { error: "Only one of the two churches' leaders can do this." };
  }

  await prisma.churchPartnership.delete({ where: { id: partnershipId } });
  revalidatePath("/admin/dashboard");
}
