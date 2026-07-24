import Link from "next/link";
import { CalendarBlank, Plus, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listConnectionsAsMentor } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { RespondToConnectionButtons, EndConnectionButton } from "@/components/ConnectionActions";
import { CONNECTION_STATUS, ROLES, type EventCategory } from "@/lib/constants";

export default async function VolunteerDashboardPage() {
  const user = await requireRole(ROLES.VOLUNTEER);

  const myEvents = await prisma.event.findMany({
    where: { createdById: user.id },
    orderBy: { startsAt: "desc" },
    take: 10,
  });

  const connections = await listConnectionsAsMentor(user.id);
  const pending = connections.filter((c) => c.status === CONNECTION_STATUS.PENDING);
  const active = connections.filter((c) => c.status === CONNECTION_STATUS.ACCEPTED);

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink-muted">{user.activeMembership?.church.name}</p>
        </div>
        <LinkButton href="/volunteer/events/new">
          <Plus weight="bold" className="size-4" /> Plan a gathering
        </LinkButton>
      </div>

      {pending.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 font-bold text-ink">Friend requests waiting on you</h2>
          <div className="space-y-3">
            {pending.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.student.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{c.student.name}</p>
                    {c.message && <p className="text-sm text-ink-muted">&quot;{c.message}&quot;</p>}
                  </div>
                </div>
                <RespondToConnectionButtons connectionId={c.id} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {active.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 font-bold text-ink">Your friends</h2>
          <div className="space-y-3">
            {active.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.student.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink">{c.student.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <EnvelopeSimple weight="bold" className="size-3.5" /> {c.student.email}
                    </p>
                  </div>
                </div>
                <EndConnectionButton connectionId={c.id} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-bold text-ink">Gatherings you&apos;re planning</h2>
        {myEvents.length === 0 ? (
          <EmptyState
            icon={CalendarBlank}
            title="Nothing on the calendar yet"
            body="Plan your first dinner, coffee chat, or friend meetup."
            action={
              <LinkButton href="/volunteer/events/new" size="sm">
                <Plus weight="bold" className="size-4" /> Plan a gathering
              </LinkButton>
            }
          />
        ) : (
          <div className="space-y-2">
            {myEvents.map((event) => {
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
                    <span className="text-sm font-semibold text-ink">{event.title}</span>
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
