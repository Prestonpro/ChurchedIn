import Link from "next/link";
import { CalendarBlank, Plus, Clock } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { listEventsForChurch } from "@/lib/queries";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { StyledBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROLES, RSVP_ROLE, RSVP_STATUS, type EventCategory } from "@/lib/constants";

export default async function EventsPage() {
  const user = await requireUser();
  if (!user.activeMembership) {
    return (
      <AuthShell user={user}>
        <EmptyState
          icon={CalendarBlank}
          title="Join a church to see its events"
          body="Enter a join code to get started."
          action={
            <LinkButton href="/join" size="sm">
              Enter a join code
            </LinkButton>
          }
        />
      </AuthShell>
    );
  }

  const events = await listEventsForChurch(user.activeMembership.churchId);
  const now = new Date();
  const upcoming = events.filter((e) => e.startsAt >= now);
  const past = events.filter((e) => e.startsAt < now);
  const canHost = user.activeMembership.role !== ROLES.STUDENT;

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Events</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {upcoming.length} upcoming at {user.activeMembership.church.name}
          </p>
        </div>
        {canHost && (
          <LinkButton href="/volunteer/events/new">
            <Plus weight="bold" className="size-4" /> Host an event
          </LinkButton>
        )}
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarBlank}
          title="No upcoming events yet"
          body={canHost ? "Be the first to host one." : "Check back soon — your church hasn't posted anything yet."}
          action={
            canHost ? (
              <LinkButton href="/volunteer/events/new" size="sm">
                <Plus weight="bold" className="size-4" /> Host an event
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {upcoming.map((event) => {
            const style = categoryStyle(event.category as EventCategory);
            const Icon = style.icon;
            const helpers = event.rsvps.filter(
              (r) => r.role === RSVP_ROLE.HELPER && r.status === RSVP_STATUS.CONFIRMED,
            ).length;
            const attendees = event.rsvps.filter(
              (r) => r.role === RSVP_ROLE.ATTENDEE && r.status === RSVP_STATUS.CONFIRMED,
            ).length;
            return (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card interactive className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <StyledBadge icon={Icon} className={style.chipClass}>
                      {style.label}
                    </StyledBadge>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-ink">{event.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                    <Clock weight="bold" className="size-3.5" />
                    {event.startsAt.toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-soft line-clamp-2">
                    {event.description}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3">
                    <CapacityBar label="Attending" count={attendees} cap={event.studentCap} />
                    <CapacityBar label="Helping" count={helpers} cap={event.volunteerCap} />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Past events
          </h2>
          <div className="grid gap-4 opacity-70 sm:grid-cols-2">
            {past.map((event) => {
              const style = categoryStyle(event.category as EventCategory);
              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card interactive>
                    <StyledBadge icon={style.icon} className={style.chipClass}>
                      {style.label}
                    </StyledBadge>
                    <h3 className="mt-3 font-bold text-ink">{event.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {event.startsAt.toLocaleDateString()}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </AuthShell>
  );
}
