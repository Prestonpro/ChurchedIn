import Link from "next/link";
import { CalendarBlank, UsersThree, HandHeart, Car } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listConnectionsAsStudent, listRideRequestsForStudent } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { CONNECTION_STATUS, RSVP_STATUS, RIDE_STATUS, ROLES, type EventCategory } from "@/lib/constants";

export default async function StudentDashboardPage() {
  const user = await requireRole(ROLES.STUDENT);
  const churchId = user.activeMembership!.churchId;

  const [rsvps, connections, memberCount, rides] = await Promise.all([
    prisma.eventRsvp.findMany({
      where: { userId: user.id, status: { not: RSVP_STATUS.CANCELLED } },
      include: { event: true },
      orderBy: { event: { startsAt: "asc" } },
    }),
    listConnectionsAsStudent(user.id),
    prisma.membership.count({ where: { churchId } }),
    listRideRequestsForStudent(user.id),
  ]);
  const friendCount = connections.filter((c) => c.status === CONNECTION_STATUS.ACCEPTED).length;
  const activeRides = rides.filter(
    (r) => r.status === RIDE_STATUS.OPEN || r.status === RIDE_STATUS.CLAIMED,
  ).length;
  const upcoming = rsvps.filter((r) => r.event.startsAt >= new Date());
  const nextRsvp = [...upcoming].sort((a, b) => a.event.startsAt.getTime() - b.event.startsAt.getTime())[0];

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {user.activeMembership?.church.name}, {memberCount} {memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        <LinkButton href="/student/mentors">
          <UsersThree weight="bold" className="size-4" /> Find a friend
        </LinkButton>
      </div>

      <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CalendarBlank}
          label="Upcoming gatherings"
          value={upcoming.length}
          sublabel={nextRsvp ? `Next: ${nextRsvp.event.title}` : undefined}
          tone="bg-cat-study-soft text-cat-study"
          accent="border-l-cat-study"
        />
        <StatCard
          icon={HandHeart}
          label="Friends"
          value={friendCount}
          tone="bg-accent-100 text-accent-700"
          accent="border-l-accent-500"
          href="/student/mentors"
        />
        <StatCard
          icon={Car}
          label="Active ride requests"
          value={activeRides}
          tone="bg-warning-soft text-warning"
          accent="border-l-warning"
          href="/student/rides"
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

      <Card>
        <h2 className="mb-3 font-bold text-ink">Your upcoming gatherings</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarBlank}
            title={rsvps.length === 0 ? "No RSVPs yet" : "Nothing upcoming"}
            body="Browse events at your church and RSVP to join."
            action={
              <LinkButton href="/events" size="sm">
                Browse events
              </LinkButton>
            }
          />
        ) : (
          <div className="space-y-2">
            {upcoming.map((r) => {
              const style = categoryStyle(r.event.category as EventCategory);
              const Icon = style.icon;
              return (
                <Link
                  key={r.id}
                  href={`/events/${r.eventId}`}
                  className="flex items-center justify-between rounded-xl border border-line p-3 transition-brand hover:border-brand-200 hover:bg-paper"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>
                      <Icon weight="fill" className="size-4.5" />
                    </span>
                    <span className="text-sm font-semibold text-ink">{r.event.title}</span>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-ink-muted">
                    {r.event.startsAt.toLocaleDateString()}
                    {r.status === RSVP_STATUS.WAITLISTED && <Badge tone="warning">Waitlist</Badge>}
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
