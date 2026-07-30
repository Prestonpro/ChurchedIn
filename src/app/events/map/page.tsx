import { MapTrifold } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { listMappedEventsForChurch } from "@/lib/queries";
import { eventPinStatus } from "@/lib/eventMapStatus";
import { AuthShell } from "@/components/nav/AuthShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { ROLES, RSVP_ROLE, RSVP_STATUS, type EventCategory } from "@/lib/constants";
import { EventMapClient, type MapEvent } from "./EventMapClient";

export default async function EventsMapPage() {
  const user = await requireUser();
  if (!user.activeMembership) {
    return (
      <AuthShell user={user}>
        <EmptyState
          icon={MapTrifold}
          title="Join a church to see its event map"
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

  const rawEvents = await listMappedEventsForChurch(user.activeMembership.churchId);

  const events: MapEvent[] = rawEvents.map((e) => {
    const confirmed = e.rsvps.filter((r) => r.status === RSVP_STATUS.CONFIRMED);
    const confirmedAttendees = confirmed.filter((r) => r.role === RSVP_ROLE.ATTENDEE).length;
    const confirmedHelpers = confirmed.filter((r) => r.role === RSVP_ROLE.HELPER).length;
    const myRsvp = e.rsvps.find((r) => r.userId === user.id);
    const hasMyRsvp = !!myRsvp;

    return {
      id: e.id,
      title: e.title,
      category: e.category as EventCategory,
      startsAt: e.startsAt.toISOString(),
      location: e.location,
      lat: e.locationLat as number,
      lng: e.locationLng as number,
      studentCap: e.studentCap,
      volunteerCap: e.volunteerCap,
      confirmedAttendees,
      confirmedHelpers,
      hasMyRsvp,
      pinStatus: eventPinStatus({
        confirmedAttendees,
        studentCap: e.studentCap,
        confirmedHelpers,
        volunteerCap: e.volunteerCap,
        hasMyRsvp,
      }),
    };
  });

  return (
    <AuthShell user={user} fullBleed>
      {events.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <EmptyState
            icon={MapTrifold}
            title="No events on the map yet"
            body={
              user.activeMembership.role === ROLES.STUDENT
                ? "Nothing has been pinned to the map yet — check back soon."
                : "Events show up here once they're given a location with the map picker."
            }
          />
        </div>
      ) : (
        <EventMapClient events={events} />
      )}
    </AuthShell>
  );
}
