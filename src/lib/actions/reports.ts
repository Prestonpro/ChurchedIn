"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ROLES, REPORT_STATUS, type ReportStatus } from "@/lib/constants";
import { reportUserSchema, firstIssueMessage } from "@/lib/validation";

export type ActionResult = { error: string } | void;

/** Any logged-in member can file a report about another user.
 * The report is stored with OPEN status for the church admin to review. */
export async function fileReportAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = reportUserSchema.safeParse({
    reportedUserId: formData.get("reportedUserId"),
    reason: formData.get("reason"),
    details: formData.get("details"),
  });
  if (!parsed.success) return { error: firstIssueMessage(parsed.error) };
  const { reportedUserId, reason, details } = parsed.data;

  if (reportedUserId === user.id) return { error: "You can't report yourself." };

  // Find a church both users share so the report lands in the right admin queue.
  const reportedMemberships = await prisma.membership.findMany({
    where: { userId: reportedUserId },
    select: { churchId: true },
  });
  const reportedChurchIds = new Set(reportedMemberships.map((m) => m.churchId));
  const sharedChurchId = user.memberships.find((m) => reportedChurchIds.has(m.churchId))?.churchId;
  if (!sharedChurchId) return { error: "This user doesn't share a church with you." };

  await prisma.report.create({
    data: {
      reportedById: user.id,
      reportedUserId,
      churchId: sharedChurchId,
      reason,
      details: details || null,
      status: REPORT_STATUS.OPEN,
    },
  });

  revalidatePath(`/profile/${reportedUserId}`);
}

/** Marks a report reviewed or dismissed — church-admin-only, and scoped to
 * the report's own church so an admin can't act on another church's
 * moderation queue. */
export async function resolveReportAction(reportId: string, status: ReportStatus): Promise<ActionResult> {
  const user = await requireUser();
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    return { error: "That report no longer exists." };
  }
  const membership = user.memberships.find((m) => m.churchId === report.churchId);
  if (!membership || membership.role !== ROLES.CHURCH_ADMIN) {
    return { error: "Only a church leader can do this." };
  }
  if (status !== REPORT_STATUS.REVIEWED && status !== REPORT_STATUS.DISMISSED) {
    return { error: "Invalid status." };
  }

  await prisma.report.update({ where: { id: reportId }, data: { status } });
  revalidatePath("/admin/reports");
}
