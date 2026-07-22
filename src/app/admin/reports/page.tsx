import { Flag } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { listReportsForChurch } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportStatusButtons } from "./ReportStatusButtons";
import { ROLES } from "@/lib/constants";

const TONE = { OPEN: "warning", REVIEWED: "success", DISMISSED: "neutral" } as const;

export default async function ReportsPage() {
  const user = await requireRole(ROLES.CHURCH_ADMIN);
  const reports = await listReportsForChurch(user.activeMembership!.churchId);

  return (
    <AuthShell user={user}>
      <h1 className="mb-1 text-2xl font-extrabold text-ink">Reports</h1>
      <p className="mb-8 text-sm text-ink-muted">Review reports filed by members of your church.</p>

      {reports.length === 0 ? (
        <EmptyState icon={Flag} title="No reports filed" body="Nothing to review right now." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{r.reason}</p>
                  {r.details && <p className="mt-1 text-sm text-ink-soft">{r.details}</p>}
                  <p className="mt-2 text-xs text-ink-muted">
                    Filed by {r.reportedBy.name}
                    {r.reportedUser ? ` about ${r.reportedUser.name}` : ""} ·{" "}
                    {r.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <Badge tone={TONE[r.status as keyof typeof TONE]}>{r.status}</Badge>
              </div>
              {r.status === "OPEN" && (
                <div className="mt-3 border-t border-line pt-3">
                  <ReportStatusButtons reportId={r.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </AuthShell>
  );
}
