import Link from "next/link";
import { CalendarBlank, Plus, Sparkle, Buildings, HandsClapping, CalendarDots, MapTrifold } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  listEventsForChurch,
  listAcceptedPartnerChurchIds,
  listEventsForChurches,
} from "@/lib/queries";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { StyledBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { EventViewToggle } from "@/components/EventViewToggle";
import { EmptyState } from "@/components/ui/EmptyState";
import { DateBadge } from "@/components/ui/DateBadge";
import { AttendeeAvatars } from "@/components/ui/AttendeeAvatars";
import { ROLES, RSVP_ROLE, RSVP_STATUS, type EventCategory } from "@/lib/constants";

function attendeeInfo(event: {
  rsvps: { role: string; status: string; user: { id: string; name: string } }[];
  cohosts: { user: { id: string; name: string } }[];
}) {
  const confirmed = event.rsvps.filter((r) => r.status === RSVP_STATUS.CONFIRMED);
  const confirmedHelperIds = new Set(confirmed.filter((r) => r.role === RSVP_ROLE.HELPER).map((r) => r.user.id));
  const attendees = confirmed.filter((r) => r.role === RSVP_ROLE.ATTENDEE).length;
  // A co-host is helping run the event whether or not they separately
  // RSVP'd as a helper — without this, an org-hosted event with several
  // invited mentors could misleadingly read as "no one helping".
  const cohostOnlyIds = event.cohosts.map((c) => c.user.id).filter((id) => !confirmedHelperIds.has(id));
  const helpers = confirmedHelperIds.size + cohostOnlyIds.length;
  // Names cover both roles so the list's length always matches totalCount —
  // otherwise a helper-only RSVP would show "0 + N more going".
  const cohostOnlyNames = event.cohosts.filter((c) => cohostOnlyIds.includes(c.user.id)).map((c) => c.user.name);
  return { helpers, attendees, attendeeNames: [...confirmed.map((r) => r.user.name), ...cohostOnlyNames] };
}

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

  const churchId = user.activeMembership.churchId;
  // Stamping "seen" alongside the real reads (not blocking on it
  // separately) — AuthShell's nav badge check on THIS render already read
  // the pre-stamp value, so the dot only clears on the next navigation,
  // same as most "mark as read" UIs.
  const [events, partnerChurchIds] = await Promise.all([
    listEventsForChurch(churchId),
    listAcceptedPartnerChurchIds(churchId),
    prisma.membership.update({
      where: { id: user.activeMembership.id },
      data: { lastSeenEventsAt: new Date() },
    }),
  ]);
  const partnerEvents = await listEventsForChurches(partnerChurchIds);
  const now = new Date();
  const upcoming = events.filter((e) => e.startsAt >= now);
  const past = events.filter((e) => e.startsAt < now);
  const canHost = user.activeMembership.role !== ROLES.STUDENT;
  const spotlight = upcoming.slice(0, 2);
  const rest = upcoming.slice(2);

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Events</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {upcoming.length} upcoming at {user.activeMembership.church.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EventViewToggle currentView="list" />
          {canHost && (
            <LinkButton href="/volunteer/events/new">
              <Plus weight="bold" className="size-4" /> Plan a gathering
            </LinkButton>
          )}
        </div>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarBlank}
          title="No upcoming events yet"
          body={canHost ? "Be the first to plan one." : "Check back soon — your church hasn't posted anything yet."}
          action={
            canHost ? (
              <LinkButton href="/volunteer/events/new" size="sm">
                <Plus weight="bold" className="size-4" /> Plan a gathering
              </LinkButton>
            ) : undefined
          }
        />
      ) : (
        <>
          {spotlight.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-accent-700">
                <Sparkle weight="fill" className="size-4" /> Happening soon
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {spotlight.map((event, i) => {
                  const style = categoryStyle(event.category as EventCategory);
                  const Icon = style.icon;
                  const { helpers, attendees, attendeeNames } = attendeeInfo(event);
                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="animate-fade-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <Card interactive className="flex h-full gap-4 border-l-4 border-l-accent-500">
                        <DateBadge date={event.startsAt} />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <StyledBadge icon={Icon} className={style.chipClass}>
                            {style.label}
                          </StyledBadge>
                          <h3 className="mt-2 text-lg font-bold text-ink">
                            {event.title}
                            {event.atChurch && (
                              <span className="ml-1.5 inline-flex items-center gap-1 align-middle text-xs font-semibold text-brand-600">
                                <Buildings weight="bold" className="size-3.5" /> at church
                              </span>
                            )}
                          </h3>
                          <p className="mt-1 text-sm text-ink-muted">
                            {event.startsAt.toLocaleString(undefined, {
                              weekday: "long",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft line-clamp-2">
                            {event.description}
                          </p>
                          <div className="mt-3 border-t border-line pt-3">
                            <AttendeeAvatars names={attendeeNames} totalCount={attendees + helpers} />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="mb-10 grid gap-4 sm:grid-cols-2">
              {rest.map((event, i) => {
                const style = categoryStyle(event.category as EventCategory);
                const Icon = style.icon;
                const { helpers, attendees, attendeeNames } = attendeeInfo(event);
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="animate-fade-up"
                    style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
                  >
                    <Card interactive className={`flex h-full gap-3 border-l-4 ${style.border}`}>
                      <DateBadge date={event.startsAt} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <StyledBadge icon={Icon} className={style.chipClass}>
                          {style.label}
                        </StyledBadge>
                        <h3 className="mt-2 text-lg font-bold text-ink">
                          {event.title}
                          {event.atChurch && (
                            <span className="ml-1.5 inline-flex items-center gap-1 align-middle text-xs font-semibold text-brand-600">
                              <Buildings weight="bold" className="size-3.5" /> at church
                            </span>
                          )}
                        </h3>
                        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-soft line-clamp-2">
                          {event.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                          <AttendeeAvatars names={attendeeNames} totalCount={attendees + helpers} max={3} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                          <CapacityBar label="Attending" count={attendees} cap={event.studentCap} />
                          <CapacityBar label="Helping" count={helpers} cap={event.volunteerCap} />
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {partnerEvents.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-ink-muted">
            <HandsClapping weight="fill" className="size-4" /> From partner churches
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {partnerEvents.map((event) => {
              const style = categoryStyle(event.category as EventCategory);
              return (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card interactive className="flex gap-3 border-l-4 border-l-line-strong">
                    <DateBadge date={event.startsAt} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <StyledBadge icon={style.icon} className={style.chipClass}>
                          {style.label}
                        </StyledBadge>
                        <span className="text-xs font-semibold text-ink-faint">via {event.church.name}</span>
                      </div>
                      <h3 className="mt-2 font-bold text-ink">{event.title}</h3>
                      <p className="mt-1 text-sm text-ink-muted">
                        {event.startsAt.toLocaleString(undefined, {
                          weekday: "long",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Past events
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
