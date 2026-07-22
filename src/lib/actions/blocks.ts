"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export type ActionResult = { error: string } | void;

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

  revalidatePath("/student/mentors");
  revalidatePath("/events");
}

export async function unblockUserAction(blockedId: string): Promise<ActionResult> {
  const user = await requireUser();
  await prisma.block.deleteMany({ where: { blockerId: user.id, blockedId } });
  revalidatePath("/student/mentors");
  revalidatePath("/events");
}
