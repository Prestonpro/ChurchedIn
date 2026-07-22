"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ROLES, REPORT_STATUS } from "@/lib/constants";
import { reportSchema, firstIssueMessage } from "@/lib/validation";

export type ActionResult = { error: string } | void;

export async function fileReportAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.activeMembership) {
    return { error: "Join a church before filing a report." };
  }

  const parsed = reportSchema.safeParse({
    reason: formData.get("reason"),
    details: formData.get("details"),
    reportedUserId: formData.get("reportedUserId") || undefined,
    eventId: formData.get("eventId") || undefined,
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  await prisma.report.create({
    data: {
      reason: data.reason,
      details: data.details || null,
      churchId: user.activeMembership.churchId,
      reportedById: user.id,
      reportedUserId: data.reportedUserId || null,
      eventId: data.eventId || null,
    },
  });

  revalidatePath("/admin/reports");
}

export async function updateReportStatusAction(
  reportId: string,
  status: "REVIEWED" | "DISMISSED",
): Promise<ActionResult> {
  const user = await requireUser();
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    return { error: "Report not found." };
  }
  if (
    user.activeMembership?.role !== ROLES.CHURCH_ADMIN ||
    user.activeMembership.churchId !== report.churchId
  ) {
    return { error: "Only that church's admin can update this report." };
  }

  await prisma.report.update({
    where: { id: reportId },
    data: { status: status === "REVIEWED" ? REPORT_STATUS.REVIEWED : REPORT_STATUS.DISMISSED },
  });

  revalidatePath("/admin/reports");
}
