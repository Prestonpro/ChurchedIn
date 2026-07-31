"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ROLES, REPORT_STATUS, type ReportStatus } from "@/lib/constants";

export type ActionResult = { error: string } | void;

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
