import Link from "next/link";
import { UsersThree, CalendarBlank, Flag, Plus, Buildings } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { ROLES, type EventCategory } from "@/lib/constants";

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  interactive,
}: {
  icon: typeof UsersThree;
  label: string;
  value: number;
  tone: string;
  interactive?: boolean;
}) {
  return (
    <Card interactive={interactive}>
      <div className="flex items-center gap-3">
        <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
          <Icon weight="fill" className="size-5" />
        </span>
        <div>
          <p className="text-xs font-medium text-ink-muted">{label}</p>
          <p className="text-2xl font-extrabold text-ink">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const user = await requireRole(ROLES.CHURCH_ADMIN);
  const churchId = user.activeMembership!.churchId;

  const [church, memberCount, openReportCount, events] = await Promise.all([
    prisma.church.findUnique({ where: { id: churchId } }),
    prisma.membership.count({ where: { churchId } }),
    prisma.report.count({ where: { churchId, status: "OPEN" } }),
    prisma.event.findMany({
      where: { churchId },
      orderBy: { startsAt: "desc" },
      take: 20,
      include: { createdBy: { select: { name: true } } },
    }),
  ]);

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{church?.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">Admin overview</p>
        </div>
        <LinkButton href="/volunteer/events/new">
          <Plus weight="bold" className="size-4" /> Host an event
        </LinkButton>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={UsersThree} label="Members" value={memberCount} tone="bg-brand-50 text-brand-600" />
        <StatCard icon={CalendarBlank} label="Events" value={events.length} tone="bg-cat-study-soft text-cat-study" />
        <Link href="/admin/reports">
          <StatCard
            icon={Flag}
            label="Open reports"
            value={openReportCount}
            tone="bg-warning-soft text-warning"
            interactive
          />
        </Link>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Buildings weight="fill" className="size-5" />
          </span>
          <div>
            <h2 className="font-bold text-ink">Invite people</h2>
            <p className="text-sm text-ink-muted">
              Share this code — anyone can join as a volunteer or student.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <code className="rounded-lg bg-paper px-4 py-2.5 text-lg font-bold tracking-[0.3em] text-brand-700">
            {church?.joinCode}
          </code>
          <CopyButton text={church?.joinCode ?? ""} label="Copy code" />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-bold text-ink">Events</h2>
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarBlank}
            title="No events yet"
            action={
              <LinkButton href="/volunteer/events/new" size="sm">
                <Plus weight="bold" className="size-4" /> Host the first one
              </LinkButton>
            }
          />
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const style = categoryStyle(event.category as EventCategory);
              const Icon = style.icon;
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-xl border border-line p-3 transition-brand hover:border-brand-200 hover:bg-paper"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>
                      <Icon weight="fill" className="size-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{event.title}</p>
                      <p className="text-xs text-ink-muted">Hosted by {event.createdBy.name}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-ink-muted">
                    {event.startsAt.toLocaleDateString()}
                    {event.status === "CANCELLED" && <Badge tone="danger">Cancelled</Badge>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </AuthShell>
  );
}
