"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type ActionResult = { error: string } | void;

/**
 * A block changes who is visible on more than the friend directory: the
 * volunteer dashboard lists incoming connection requests, and the rides boards
 * now filter blocked students out (see listOpenRideRequestsForChurch). Leaving
 * those out meant a just-blocked person's request stayed on screen and still
 * actionable until the cache happened to expire.
 */
function revalidateBlockSurfaces(blockedId: string): void {
  revalidatePath("/student/requests");
  revalidatePath("/events");
  revalidatePath("/student/dashboard");
  revalidatePath("/volunteer/dashboard");
  revalidatePath("/volunteer/rides");
  revalidatePath("/admin/rides");
  revalidatePath("/admin/requests");
  revalidatePath(`/profile/${blockedId}`);
}

export async function blockUserAction(blockedId: string): Promise<ActionResult> {
  const user = await requireUser();
  if (user.id === blockedId) {
    return { error: "You can't block yourself." };
  }

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId } },
    create: { blockerId: user.id, blockedId },
    update: {},
  });

  revalidateBlockSurfaces(blockedId);
}

export async function unblockUserAction(blockedId: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId } });
  revalidateBlockSurfaces(blockedId);
}
