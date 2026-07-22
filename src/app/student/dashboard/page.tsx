import Link from "next/link";
import { CalendarBlank, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { RSVP_STATUS, ROLES, type EventCategory } from "@/lib/constants";

export default async function StudentDashboardPage() {
  const user = await requireRole(ROLES.STUDENT);

  const rsvps = await prisma.eventRsvp.findMany({
    where: { userId: user.id, status: { not: RSVP_STATUS.CANCELLED } },
    include: { event: true },
    orderBy: { event: { startsAt: "asc" } },
  });

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink-muted">{user.activeMembership?.church.name}</p>
        </div>
        <LinkButton href="/student/mentors">
          <UsersThree weight="bold" className="size-4" /> Find a mentor
        </LinkButton>
      </div>

      <Card>
        <h2 className="mb-3 font-bold text-ink">Your upcoming events</h2>
        {rsvps.length === 0 ? (
          <EmptyState
            icon={CalendarBlank}
            title="No RSVPs yet"
            body="Browse events at your church and RSVP to join."
            action={
              <LinkButton href="/events" size="sm">
                Browse events
              </LinkButton>
            }
          />
        ) : (
          <div className="space-y-2">
            {rsvps.map((r) => {
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
