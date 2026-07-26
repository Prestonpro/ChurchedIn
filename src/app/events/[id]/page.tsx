import { notFound } from "next/navigation";
import { Clock, MapPin, VideoCamera, UsersThree, HandHeart, UsersFour, Buildings, ArrowClockwise, HandsClapping, NavigationArrow } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { getEventById, listCohostCandidates, isAcceptedPartnerChurch } from "@/lib/queries";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge, StyledBadge } from "@/components/ui/Badge";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { LinkButton } from "@/components/ui/Button";
import { RsvpControls } from "./RsvpControls";
import { CancelEventButton } from "./CancelEventButton";
import { CohostManager } from "./CohostManager";
import { MiniMapLoader } from "@/components/MiniMapLoader";
import {
  EVENT_STATUS,
  ROLES,
  RSVP_ROLE,
  RSVP_STATUS,
  type EventCategory,
} from "@/lib/constants";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const membership = user.memberships.find((m) => m.churchId === event.churchId);
  // Not a member of this event's church — allow a read-only view if the
  // viewer's own church has an accepted partnership with it (cross-church
  // collaboration), otherwise this event isn't reachable at all. Either
  // way, RSVP/cancel/co-host/run-again stay member-only below.
  let isPartnerView = false;
  if (!membership) {
    const checks = await Promise.all(
      user.memberships.map((m) => isAcceptedPartnerChurch(m.churchId, event.churchId)),
    );
    isPartnerView = checks.some(Boolean);
    if (!isPartnerView) {
      notFound();
    }
  }

  const isStudent = membership?.role === ROLES.STUDENT;
  const roleBucket = isStudent ? RSVP_ROLE.ATTENDEE : RSVP_ROLE.HELPER;

  const myRsvp = event.rsvps.find((r) => r.userId === user.id);
  const helpers = event.rsvps.filter((r) => r.role === RSVP_ROLE.HELPER);
  const attendees = event.rsvps.filter((r) => r.role === RSVP_ROLE.ATTENDEE);
  const confirmedHelpers = helpers.filter((r) => r.status === RSVP_STATUS.CONFIRMED).length;
  const confirmedAttendees = attendees.filter((r) => r.status === RSVP_STATUS.CONFIRMED).length;

  const isCreator = event.createdById === user.id;
  const isCohost = event.cohosts.some((c) => c.userId === user.id);
  const isAdmin = membership?.role === ROLES.CHURCH_ADMIN;
  const style = categoryStyle(event.category as EventCategory);
  const CategoryIcon = style.icon;
  const isCancelled = event.status === EVENT_STATUS.CANCELLED;
  const isPast = event.startsAt < new Date();
  const cohostCandidates = isCreator ? await listCohostCandidates(event.churchId, event.id) : [];

  return (
    <AuthShell user={user}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <StyledBadge icon={CategoryIcon} className={style.chipClass}>
                  {style.label}
                </StyledBadge>
                {isPartnerView && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink-faint">
                    <HandsClapping weight="fill" className="size-3.5" /> via {event.church.name}
                  </span>
                )}
              </div>
              {isCancelled && <Badge tone="danger">Cancelled</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">{event.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Hosted by {event.createdBy.name}
              {event.cohosts.length > 0 && <> with {event.cohosts.map((c) => c.user.name).join(", ")}</>}
            </p>

            <div className="mt-4 space-y-2 text-sm text-ink-soft">
              <p className="flex items-center gap-2">
                <Clock weight="bold" className="size-4 shrink-0 text-ink-faint" />
                {event.startsAt.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
                {" – "}
                {event.endsAt.toLocaleTimeString(undefined, { timeStyle: "short" })}
              </p>
              <p className="flex items-center gap-2">
                {event.isVirtual ? (
                  <VideoCamera weight="bold" className="size-4 shrink-0 text-ink-faint" />
                ) : (
                  <MapPin weight="bold" className="size-4 shrink-0 text-ink-faint" />
                )}
                {event.location}
                {event.atChurch && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    <Buildings weight="bold" className="size-3" /> at church
                  </span>
                )}
              </p>
            </div>

            <p className="mt-5 whitespace-pre-wrap border-t border-line pt-5 text-sm leading-relaxed text-ink-soft">
              {event.description}
            </p>

            {isPartnerView ? (
              <p className="mt-6 rounded-xl bg-paper px-4 py-3 text-sm text-ink-muted">
                This gathering is hosted by a partner church — visit their church to RSVP.
              </p>
            ) : (
              <>
                {!isCancelled && (
                  <div className="mt-6 border-t border-line pt-6">
                    <RsvpControls
                      eventId={event.id}
                      currentStatus={(myRsvp?.status as typeof RSVP_STATUS[keyof typeof RSVP_STATUS]) ?? null}
                      roleLabel={roleBucket === RSVP_ROLE.HELPER ? "helper" : "attendee"}
                      cap={roleBucket === RSVP_ROLE.HELPER ? event.volunteerCap : event.studentCap}
                    />
                  </div>
                )}

                {(isCreator || isAdmin) && !isCancelled && (
                  <div className="mt-4">
                    <CancelEventButton eventId={event.id} />
                  </div>
                )}

                {(isCreator || isCohost) && (isCancelled || isPast) && (
                  <div className="mt-4">
                    <LinkButton href={`/volunteer/events/new?from=${event.id}`} variant="secondary" size="sm">
                      <ArrowClockwise weight="bold" className="size-4" /> Run this again
                    </LinkButton>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <CapacityBar label="Attending" count={confirmedAttendees} cap={event.studentCap} />
              <CapacityBar label="Helping" count={confirmedHelpers} cap={event.volunteerCap} />
            </div>

            <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <UsersThree weight="bold" className="size-4 text-cat-study" /> Attending
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
              {attendees.length === 0 && <li className="text-ink-faint">No one yet.</li>}
              {attendees.map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span>{r.user.name}</span>
                  {r.status === RSVP_STATUS.WAITLISTED && <Badge tone="warning">Waitlist</Badge>}
                </li>
              ))}
            </ul>

            <h2 className="mt-5 flex items-center gap-1.5 border-t border-line pt-4 text-sm font-bold text-ink">
              <HandHeart weight="bold" className="size-4 text-accent-600" /> Helping
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
              {helpers.length === 0 && <li className="text-ink-faint">No one yet.</li>}
              {helpers.map((r) => (
                <li key={r.id} className="flex items-center justify-between">
                  <span>{r.user.name}</span>
                  {r.status === RSVP_STATUS.WAITLISTED && <Badge tone="warning">Waitlist</Badge>}
                </li>
              ))}
            </ul>
          </Card>

          {isCreator && !isCancelled && (
            <Card>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
                <UsersFour weight="bold" className="size-4 text-brand-600" /> Co-hosts
              </h2>
              <CohostManager
                eventId={event.id}
                cohosts={event.cohosts.map((c) => c.user)}
                candidates={cohostCandidates}
              />
            </Card>
          )}

          {(event.address || (event.locationLat !== null && event.locationLng !== null)) && (
            <Card>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
                <MapPin weight="bold" className="size-4 text-brand-600" /> Location
              </h2>
              {event.locationLat !== null && event.locationLng !== null && (
                <div className="mb-3 overflow-hidden rounded-xl">
                  <MiniMapLoader lat={event.locationLat} lng={event.locationLng} />
                </div>
              )}
              <p className="text-sm text-ink-soft">{event.address || event.location}</p>
              {event.locationLat !== null && event.locationLng !== null && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${event.locationLat},${event.locationLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-brand hover:underline"
                >
                  <NavigationArrow weight="bold" className="size-4" /> Get directions
                </a>
              )}
            </Card>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
