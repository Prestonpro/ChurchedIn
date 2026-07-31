import Link from "next/link";
import { CalendarBlank, Plus, EnvelopeSimple, HandHeart, UsersThree, Car } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listConnectionsAsMentor, listOpenRideRequestsForChurch } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { RespondToConnectionButtons, EndConnectionButton } from "@/components/ConnectionActions";
import { MeetingPlanEditor } from "@/components/MeetingPlanEditor";
import { CONNECTION_STATUS, EVENT_STATUS, ROLES, type EventCategory } from "@/lib/constants";

export default async function VolunteerDashboardPage() {
  const user = await requireRole(ROLES.VOLUNTEER);
  const churchId = user.activeMembership!.churchId;

  const now = new Date();
  // Includes events this volunteer is cohosting, not just ones they created —
  // otherwise an invited mentor has no way to see their own upcoming
  // commitment from their own dashboard. Scoped to the *active* church: this
  // page's header reports that one church's name and member count, so pulling
  // in a multi-church volunteer's events from elsewhere contradicted it.
  const eventScope = {
    churchId,
    OR: [{ createdById: user.id }, { cohosts: { some: { userId: user.id } } }],
  };
  const liveUpcoming = { ...eventScope, status: { not: EVENT_STATUS.CANCELLED }, startsAt: { gte: now } };

  const [upcoming, recentPast, upcomingCount, memberCount, openRides, connections] = await Promise.all([
    prisma.event.findMany({ where: liveUpcoming, orderBy: { startsAt: "asc" }, take: 10 }),
    prisma.event.findMany({
      where: { ...eventScope, startsAt: { lt: now } },
      orderBy: { startsAt: "desc" },
      take: 5,
    }),
    // A count, not `upcoming.length`: the list is capped at 10 for display, and
    // reusing its length made the stat silently plateau there. Ordering was
    // also descending before, so the ten *furthest-future* events were the ones
    // kept — which meant "Next:" could name the wrong gathering entirely.
    prisma.event.count({ where: liveUpcoming }),
    prisma.membership.count({ where: { churchId } }),
    listOpenRideRequestsForChurch(churchId, user.id),
    listConnectionsAsMentor(user.id),
  ]);

  const pending = connections.filter((c) => c.status === CONNECTION_STATUS.PENDING);
  const active = connections.filter((c) => c.status === CONNECTION_STATUS.ACCEPTED);
  const nextEvent = upcoming[0];
  const myEvents = [...upcoming, ...recentPast];

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {user.activeMembership?.church.name}, {memberCount} {memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        <LinkButton href="/volunteer/events/new">
          <Plus weight="bold" className="size-4" /> Plan a gathering
        </LinkButton>
      </div>

      <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CalendarBlank}
          label="Upcoming gatherings"
          value={upcomingCount}
          sublabel={nextEvent ? `Next: ${nextEvent.title}` : undefined}
          tone="bg-cat-study-soft text-cat-study"
          accent="border-l-cat-study"
        />
        <StatCard
          icon={HandHeart}
          label="Friend requests waiting"
          value={pending.length}
          tone="bg-accent-100 text-accent-700"
          accent="border-l-accent-500"
        />
        <StatCard
          icon={Car}
          label="Rides needing a volunteer"
          value={openRides.length}
          tone="bg-warning-soft text-warning"
          accent="border-l-warning"
          href="/volunteer/rides"
        />
        <StatCard
          icon={UsersThree}
          label="People in your church"
          value={memberCount}
          tone="bg-brand-50 text-brand-600"
          accent="border-l-brand-500"
          href={`/churches/${churchId}/members`}
        />
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
              <div key={c.id} className="space-y-2.5 rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-3">
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
                <MeetingPlanEditor connectionId={c.id} plan={c.meetingPlan} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-bold text-ink">Gatherings you&apos;re planning or helping with</h2>
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
                  className={`flex items-center justify-between rounded-xl border border-line p-3 transition-brand hover:border-brand-200 hover:bg-paper ${
                    event.startsAt < new Date() ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>
                      <Icon weight="fill" className="size-4.5" />
                    </span>
                    <span className="text-sm font-semibold text-ink">{event.title}</span>
                    {event.createdById !== user.id && <Badge tone="brand">Co-hosting</Badge>}
                  </div>
                  <span className="flex items-center gap-2 text-xs text-ink-muted">
                    {event.startsAt.toLocaleDateString()}
                    {event.startsAt < new Date() && event.status !== EVENT_STATUS.CANCELLED && <Badge tone="neutral">Past</Badge>}
                    {event.status === EVENT_STATUS.CANCELLED && <Badge tone="danger">Cancelled</Badge>}
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
