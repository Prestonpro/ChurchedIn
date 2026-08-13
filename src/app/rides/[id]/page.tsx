import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Car, MapPin, Clock, ChatCircleDots, HandHeart, Buildings } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { getRideById } from "@/lib/queries";
import { rideContactVisible } from "@/lib/rideState";
import { claimRideRequestAction, completeRideRequestAction, cancelRideRequestAction } from "@/lib/actions/rides";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { RideActionButton } from "@/components/RideActionButton";
import { ContactEmail } from "@/components/ui/ContactEmail";
import { BackLink } from "@/components/ui/BackLink";
import { ROLES, RIDE_STATUS, RIDE_REQUEST_TYPE } from "@/lib/constants";

const STATUS_TONE = {
  OPEN: "warning",
  CLAIMED: "brand",
  COMPLETED: "success",
  CANCELLED: "neutral",
} as const;

const STATUS_LABEL = {
  OPEN: "Looking for a volunteer",
  CLAIMED: "Volunteer found",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const ride = await getRideById(id);
  return { title: ride ? `Ride to ${ride.destination}` : "Ride" };
}

export default async function RideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const ride = await getRideById(id);
  if (!ride) {
    notFound();
  }

  const membership = user.memberships.find((m) => m.churchId === ride.churchId);
  const isStudent = user.id === ride.studentId;
  const isVolunteer = user.id === ride.volunteerId;
  // A first-time visitor's full name is withheld from anyone browsing who
  // isn't them or their assigned volunteer, same as
  // listAllRideRequestsForChurch's treatment — a fresh face at a church
  // they've never been to shouldn't be fully identifiable to every member
  // just for asking about a ride.
  const isFirstVisit = ride.type === RIDE_REQUEST_TYPE.FIRST_VISIT;
  const studentDisplayName =
    isFirstVisit && !isStudent && !isVolunteer ? ride.student.name.split(" ")[0] : ride.student.name;

  // Not the requester, not the assigned volunteer, and not a member of the
  // destination church at all — nothing here is reachable to them.
  if (!isStudent && !isVolunteer && !membership) {
    notFound();
  }

  const canClaim =
    ride.status === RIDE_STATUS.OPEN &&
    !isStudent &&
    membership &&
    (membership.role === ROLES.VOLUNTEER || membership.role === ROLES.CHURCH_ADMIN);
  const canComplete = ride.status === RIDE_STATUS.CLAIMED && (isStudent || isVolunteer);
  const canCancel = (ride.status === RIDE_STATUS.OPEN || ride.status === RIDE_STATUS.CLAIMED) && isStudent;
  // Only the two people actually in this ride ever see each other's
  // contact info — a fellow volunteer or admin browsing the board doesn't,
  // even after someone else has claimed it (CLAUDE.md's non-negotiable
  // safety rule §1, same gating listAllRideRequestsForChurch applies).
  const contactVisible = rideContactVisible(ride.status) && (isStudent || isVolunteer);

  return (
    <AuthShell user={user}>
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Car weight="fill" className="size-5.5" />
              </span>
              <div>
                <h1 className="text-xl font-extrabold text-ink">{ride.destination}</h1>
                <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <Buildings weight="bold" className="size-3.5" /> {ride.church.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isFirstVisit && (
                <Badge tone="accent" icon={HandHeart}>
                  First visit
                </Badge>
              )}
              <Badge tone={STATUS_TONE[ride.status]}>{STATUS_LABEL[ride.status]}</Badge>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm text-ink-soft">
            <p className="flex items-center gap-2">
              <Clock weight="bold" className="size-4 shrink-0 text-ink-faint" />
              {ride.date.toLocaleDateString(undefined, { dateStyle: "full" })} · {ride.time}
            </p>
            <p className="flex items-center gap-2">
              <MapPin weight="bold" className="size-4 shrink-0 text-ink-faint" />
              {ride.destination}
            </p>
          </div>

          {ride.notes && (
            <p className="mt-4 whitespace-pre-wrap border-t border-line pt-4 text-sm leading-relaxed text-ink-soft">
              {ride.notes}
            </p>
          )}

          <div className="mt-5 space-y-4 border-t border-line pt-5">
            <div>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Requested by</h2>
              <div className="flex items-center gap-2.5">
                <Avatar name={studentDisplayName} src={isStudent || isVolunteer ? ride.student.photoUrl : null} size="sm" />
                {isStudent || isVolunteer ? (
                  <Link
                    href={`/profile/${ride.student.id}`}
                    className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                  >
                    {studentDisplayName}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-ink">{studentDisplayName}</span>
                )}
              </div>
              {contactVisible && ride.student.email && !isStudent && (
                <div className="mt-1.5 pl-9">
                  <ContactEmail email={ride.student.email} />
                </div>
              )}
            </div>

            {ride.volunteer && (
              <div>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">Volunteer</h2>
                <div className="flex items-center gap-2.5">
                  <Avatar name={ride.volunteer.name} src={ride.volunteer.photoUrl} size="sm" />
                  <Link
                    href={`/profile/${ride.volunteer.id}`}
                    className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                  >
                    {ride.volunteer.name}
                  </Link>
                </div>
                {contactVisible && ride.volunteer.email && !isVolunteer && (
                  <div className="mt-1.5 pl-9">
                    <ContactEmail email={ride.volunteer.email} />
                  </div>
                )}
              </div>
            )}
          </div>

          {contactVisible && ride.requestId && (
            <div className="mt-4">
              <LinkButton href={`/messages/${ride.requestId}`} variant="secondary" size="sm">
                <ChatCircleDots weight="bold" className="size-4" /> Message
              </LinkButton>
            </div>
          )}

          {(canClaim || canComplete || canCancel) && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
              {canClaim && (
                <RideActionButton
                  rideId={ride.id}
                  action={claimRideRequestAction}
                  label={isFirstVisit ? "Welcome them" : "Claim this ride"}
                  pendingLabel="Claiming…"
                  variant="primary"
                />
              )}
              {canComplete && (
                <RideActionButton
                  rideId={ride.id}
                  action={completeRideRequestAction}
                  label="Mark completed"
                  pendingLabel="Saving…"
                />
              )}
              {canCancel && (
                <RideActionButton
                  rideId={ride.id}
                  action={cancelRideRequestAction}
                  label="Cancel"
                  pendingLabel="Cancelling…"
                  variant="ghost"
                  confirmMessage="Cancel this ride request?"
                />
              )}
            </div>
          )}
        </Card>

        <div className="text-center">
          <BackLink />
        </div>
      </div>
    </AuthShell>
  );
}
