import type { Metadata } from "next";
import { Flag } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { listReportsForChurch } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROLES, REPORT_STATUS } from "@/lib/constants";
import { ReportActions } from "./ReportActions";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function AdminReportsPage() {
  const user = await requireRole(ROLES.CHURCH_ADMIN);
  const reports = await listReportsForChurch(user.activeMembership!.churchId);

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Reports</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Conversations your church&apos;s members have flagged for review.
        </p>
      </div>

      {reports.length === 0 ? (
        <EmptyState icon={Flag} title="No reports" body="Nothing has been flagged for review." />
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink">{r.reason}</p>
                    <Badge
                      tone={
                        r.status === REPORT_STATUS.OPEN
                          ? "warning"
                          : r.status === REPORT_STATUS.REVIEWED
                            ? "success"
                            : "neutral"
                      }
                    >
                      {r.status === REPORT_STATUS.OPEN ? "Open" : r.status === REPORT_STATUS.REVIEWED ? "Reviewed" : "Dismissed"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    Filed by {r.reportedBy.name}
                    {r.reportedUser && <> about {r.reportedUser.name}</>} · {r.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>

              {r.details && <p className="mt-3 text-sm text-ink-soft">{r.details}</p>}

              {r.conversation && (
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-line bg-paper p-3">
                  {r.conversation.messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <span className="font-semibold text-ink">
                        {m.senderId === r.reportedById ? r.reportedBy.name : r.reportedUser?.name ?? "Other participant"}:
                      </span>{" "}
                      <span className="text-ink-soft">{m.body}</span>
                    </div>
                  ))}
                </div>
              )}

              {r.status === REPORT_STATUS.OPEN && (
                <div className="mt-3">
                  <ReportActions reportId={r.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AuthShell>
  );
}
