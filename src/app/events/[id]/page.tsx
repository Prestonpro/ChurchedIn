import { notFound } from "next/navigation";
import { Clock, MapPin, VideoCamera, UsersThree, HandHeart } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { getEventById } from "@/lib/queries";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge, StyledBadge } from "@/components/ui/Badge";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { RsvpControls } from "./RsvpControls";
import { CancelEventButton } from "./CancelEventButton";
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

  if (!event || !user.memberships.some((m) => m.churchId === event.churchId)) {
    notFound();
  }

  const membership = user.memberships.find((m) => m.churchId === event.churchId)!;
  const isStudent = membership.role === ROLES.STUDENT;
  const roleBucket = isStudent ? RSVP_ROLE.ATTENDEE : RSVP_ROLE.HELPER;

  const myRsvp = event.rsvps.find((r) => r.userId === user.id);
  const helpers = event.rsvps.filter((r) => r.role === RSVP_ROLE.HELPER);
  const attendees = event.rsvps.filter((r) => r.role === RSVP_ROLE.ATTENDEE);
  const confirmedHelpers = helpers.filter((r) => r.status === RSVP_STATUS.CONFIRMED).length;
  const confirmedAttendees = attendees.filter((r) => r.status === RSVP_STATUS.CONFIRMED).length;

  const isCreator = event.createdById === user.id;
  const isAdmin = membership.role === ROLES.CHURCH_ADMIN;
  const style = categoryStyle(event.category as EventCategory);
  const CategoryIcon = style.icon;
  const isCancelled = event.status === EVENT_STATUS.CANCELLED;

  return (
    <AuthShell user={user}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <StyledBadge icon={CategoryIcon} className={style.chipClass}>
                {style.label}
              </StyledBadge>
              {isCancelled && <Badge tone="danger">Cancelled</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">{event.title}</h1>

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
              </p>
            </div>

            <p className="mt-5 whitespace-pre-wrap border-t border-line pt-5 text-sm leading-relaxed text-ink-soft">
              {event.description}
            </p>

            {!isCancelled && (
              <div className="mt-6 border-t border-line pt-6">
                <RsvpControls
                  eventId={event.id}
                  currentStatus={(myRsvp?.status as typeof RSVP_STATUS[keyof typeof RSVP_STATUS]) ?? null}
                  roleLabel={roleBucket === RSVP_ROLE.HELPER ? "helper" : "attendee"}
                />
              </div>
            )}

            {(isCreator || isAdmin) && !isCancelled && (
              <div className="mt-4">
                <CancelEventButton eventId={event.id} />
              </div>
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
        </div>
      </div>
    </AuthShell>
  );
}
