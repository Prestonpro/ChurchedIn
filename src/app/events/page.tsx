import Link from "next/link";
import type { Metadata } from "next";
import { CalendarBlank, Plus, Buildings, HandsClapping } from "@phosphor-icons/react/dist/ssr";
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
import { Badge, StyledBadge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { EventViewToggle } from "@/components/EventViewToggle";
import { EmptyState } from "@/components/ui/EmptyState";
import { DateBadge } from "@/components/ui/DateBadge";
import { AttendeeAvatars } from "@/components/ui/AttendeeAvatars";
import { EVENT_CATEGORY_LABELS, ROLES, RSVP_ROLE, RSVP_STATUS, type EventCategory } from "@/lib/constants";

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

/** A Facebook-Events-style "You're going" pill for the current viewer's own
 * RSVP — read straight off the already-loaded rsvps, no extra query. */
function tabHref(tab: "upcoming" | "past", category?: string, mine?: string): string {
  const params = new URLSearchParams({ tab });
  if (category) params.set("category", category);
  if (mine === "1") params.set("mine", "1");
  return `?${params.toString()}`;
}

function myRsvpBadge(
  event: { rsvps: { userId: string; role: string; status: string }[] },
  userId: string,
): { label: string; tone: "brand" | "accent" | "warning" } | null {
  const mine = event.rsvps.find((r) => r.userId === userId);
  if (!mine) return null;
  if (mine.status === RSVP_STATUS.WAITLISTED) return { label: "Waitlisted", tone: "warning" };
  if (mine.status === RSVP_STATUS.CONFIRMED) {
    return mine.role === RSVP_ROLE.HELPER
      ? { label: "You're helping", tone: "accent" }
      : { label: "You're going", tone: "brand" };
  }
  return null;
}

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; mine?: string; tab?: string }>;
}) {
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

  const { category, mine, tab: rawTab } = await searchParams;
  const activeTab = rawTab === "past" ? "past" : "upcoming";
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
  const filtered = events.filter((e) => {
    if (category && e.category !== category) return false;
    if (mine === "1" && !e.rsvps.some((r) => r.userId === user.id)) return false;
    return true;
  });
  const now = new Date();
  const upcoming = filtered.filter((e) => e.startsAt >= now);
  const past = filtered.filter((e) => e.startsAt < now);
  const canHost = user.activeMembership.role !== ROLES.STUDENT;
  const spotlight = upcoming.slice(0, 2);
  const rest = upcoming.slice(2);
  const isFiltered = Boolean(category || mine === "1");

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Events</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {activeTab === "upcoming"
              ? `${upcoming.length} upcoming at ${user.activeMembership.church.name}`
              : `${past.length} past at ${user.activeMembership.church.name}`}
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

      <div role="tablist" aria-label="Events" className="mb-6 inline-flex gap-1 rounded-full border border-line bg-paper p-1">
        <Link
          href={tabHref("upcoming", category, mine)}
          role="tab"
          aria-selected={activeTab === "upcoming"}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-brand active:scale-[0.97] ${
            activeTab === "upcoming" ? "bg-white text-brand-700 shadow-card" : "text-ink-muted hover:text-ink"
          }`}
        >
          Upcoming ({upcoming.length})
        </Link>
        <Link
          href={tabHref("past", category, mine)}
          role="tab"
          aria-selected={activeTab === "past"}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-brand active:scale-[0.97] ${
            activeTab === "past" ? "bg-white text-brand-700 shadow-card" : "text-ink-muted hover:text-ink"
          }`}
        >
          Past ({past.length})
        </Link>
      </div>

      <Card className="mb-6">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input type="hidden" name="tab" value={activeTab} />
          <label className="flex min-h-11 w-full items-center sm:w-auto">
            <span className="sr-only">Category</span>
            <select
              name="category"
              defaultValue={category ?? ""}
              className="min-h-11 w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-base text-ink transition-brand hover:border-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:w-auto sm:text-sm"
            >
              <option value="">All categories</option>
              {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft">
            <input
              type="checkbox"
              name="mine"
              value="1"
              defaultChecked={mine === "1"}
              className="size-4.5 rounded border-line-strong text-brand-600 focus:ring-2 focus:ring-brand-200"
            />
            My RSVP&apos;d events only
          </label>
          <Button type="submit" size="md">
            Apply
          </Button>
          {isFiltered && (
            <Link
              href={activeTab === "past" ? "/events?tab=past" : "/events"}
              className="text-sm font-semibold text-ink-faint hover:text-ink-soft hover:underline"
            >
              Clear filters
            </Link>
          )}
        </form>
      </Card>

      {activeTab === "past" ? (
        past.length === 0 ? (
          <EmptyState
            icon={CalendarBlank}
            title={isFiltered ? "No past events match your filters" : "No past events yet"}
            body={isFiltered ? "Try a different category or clear filters." : "Events move here once they're over."}
          />
        ) : (
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
        )
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarBlank}
          title={isFiltered ? "No events match your filters" : "No upcoming events yet"}
          body={
            isFiltered
              ? "Try a different category or clear filters."
              : canHost
                ? "Be the first to plan one."
                : "Check back soon. Your church hasn't posted anything yet."
          }
          action={
            isFiltered ? (
              <LinkButton href="/events" variant="secondary" size="sm">
                Clear filters
              </LinkButton>
            ) : canHost ? (
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
                Happening soon
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {spotlight.map((event, i) => {
                  const style = categoryStyle(event.category as EventCategory);
                  const Icon = style.icon;
                  const { helpers, attendees, attendeeNames } = attendeeInfo(event);
                  const rsvpBadge = myRsvpBadge(event, user.id);
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
                          <div className="flex flex-wrap items-center gap-2">
                            <StyledBadge icon={Icon} className={style.chipClass}>
                              {style.label}
                            </StyledBadge>
                            {rsvpBadge && <Badge tone={rsvpBadge.tone}>{rsvpBadge.label}</Badge>}
                          </div>
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
                const rsvpBadge = myRsvpBadge(event, user.id);
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
                        <div className="flex flex-wrap items-center gap-2">
                          <StyledBadge icon={Icon} className={style.chipClass}>
                            {style.label}
                          </StyledBadge>
                          {rsvpBadge && <Badge tone={rsvpBadge.tone}>{rsvpBadge.label}</Badge>}
                        </div>
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

      {activeTab === "upcoming" && partnerEvents.length > 0 && (
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
    </AuthShell>
  );
}
