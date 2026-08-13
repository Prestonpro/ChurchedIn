import Link from "next/link";
import type { Metadata } from "next";
import { Car, MapPin, ChatCircleDots, UsersThree, Clock } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { listRideRequestsForStudent, listActiveRideOffersForChurch } from "@/lib/queries";
import { rideContactVisible } from "@/lib/rideState";
import { cancelRideRequestAction, completeRideRequestAction } from "@/lib/actions/rides";
import { joinRideOfferAction, cancelRideOfferClaimAction } from "@/lib/actions/rideOffers";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { RideActionButton } from "@/components/RideActionButton";
import { ContactEmail } from "@/components/ui/ContactEmail";
import { RideRequestForm } from "./RideRequestForm";
import { ROLES, RIDE_STATUS, RSVP_STATUS } from "@/lib/constants";

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

export const metadata: Metadata = { title: "Rides" };

export default async function StudentRidesPage() {
  const user = await requireRole(ROLES.STUDENT);
  const churchId = user.activeMembership!.churchId;
  const [rides, offers] = await Promise.all([
    listRideRequestsForStudent(user.id),
    listActiveRideOffersForChurch(churchId, user.id),
  ]);

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Rides</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Need a lift somewhere? Ask, and a volunteer at your church can help. You can also join a ride someone&apos;s already offering.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Available rides to church</h2>
        {offers.length === 0 ? (
          <EmptyState icon={Car} title="No rides offered yet" body="Check back later. No volunteer has posted a ride yet." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {offers.map((offer, i) => {
              const full = offer.seatsLeft === 0;
              return (
                <Card
                  key={offer.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={offer.volunteer.name} size="sm" />
                      <div>
                        <Link
                          href={`/profile/${offer.volunteer.id}`}
                          className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                        >
                          {offer.volunteer.name}
                        </Link>
                        <p className="flex items-center gap-1 text-xs text-ink-muted">
                          <Clock weight="bold" className="size-3.5" /> {offer.date.toLocaleDateString()} · {offer.time}
                        </p>
                      </div>
                    </div>
                    <Badge tone={full ? "neutral" : "success"} icon={UsersThree}>
                      {offer.seatsLeft} of {offer.capacity} left
                    </Badge>
                  </div>
                  {offer.notes && <p className="mt-3 text-sm text-ink-soft">{offer.notes}</p>}

                  {offer.riders.length > 0 && (
                    <div className="mt-3 rounded-lg bg-paper p-2.5">
                      <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-ink-faint">
                        <UsersThree weight="bold" className="size-3.5" /> Who else is going
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {offer.riders.map((rider) => (
                          <span
                            key={rider.id}
                            className="flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2.5 text-xs font-medium text-ink-soft"
                          >
                            <Avatar name={rider.name} src={rider.photoUrl} size="xs" />
                            {rider.id === user.id ? "You" : rider.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    {offer.myClaimStatus === RSVP_STATUS.CONFIRMED && (
                      <div className="space-y-2">
                        <Badge tone="success">You&apos;re in</Badge>
                        <RideActionButton
                          rideId={offer.id}
                          action={cancelRideOfferClaimAction}
                          label="Leave this ride"
                          pendingLabel="Leaving…"
                          variant="ghost"
                          confirmMessage="Leave this ride?"
                        />
                      </div>
                    )}
                    {offer.myClaimStatus === RSVP_STATUS.WAITLISTED && (
                      <div className="space-y-2">
                        <Badge tone="warning">You&apos;re on the waitlist</Badge>
                        <RideActionButton
                          rideId={offer.id}
                          action={cancelRideOfferClaimAction}
                          label="Leave waitlist"
                          pendingLabel="Leaving…"
                          variant="ghost"
                        />
                      </div>
                    )}
                    {!offer.myClaimStatus && (
                      <RideActionButton
                        rideId={offer.id}
                        action={joinRideOfferAction}
                        label={full ? "Join waitlist" : "Join this ride"}
                        pendingLabel="Joining…"
                        variant="primary"
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-4 border-t border-line pt-6">
        <h2 className="text-lg font-bold text-ink">Request your own ride</h2>
        <p className="mt-1 text-sm text-ink-muted">Need something more specific? Ask directly.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 font-bold text-ink">Request a ride</h2>
          <RideRequestForm />
        </Card>

        <div className="lg:col-span-2">
          {rides.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No ride requests yet"
              body="Fill out the form to ask for a ride."
            />
          ) : (
            <div className="space-y-3">
              {rides.map((ride, i) => (
                <Card key={ride.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}>
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/rides/${ride.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <MapPin weight="fill" className="size-4.5" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink hover:text-brand-700 hover:underline">{ride.destination}</p>
                        <p className="text-xs text-ink-muted">
                          {ride.date.toLocaleDateString()} · {ride.time}
                        </p>
                      </div>
                    </Link>
                    <Badge tone={STATUS_TONE[ride.status]}>{STATUS_LABEL[ride.status]}</Badge>
                  </div>
                  {ride.notes && <p className="mt-3 text-sm text-ink-soft">{ride.notes}</p>}

                  {ride.volunteer && rideContactVisible(ride.status) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-paper p-3">
                      <Avatar name={ride.volunteer.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/profile/${ride.volunteer.id}`}
                          className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                        >
                          {ride.volunteer.name}
                        </Link>
                        {ride.volunteer.email && <ContactEmail email={ride.volunteer.email} />}
                      </div>
                      {ride.requestId && (
                        <LinkButton href={`/messages/${ride.requestId}`} variant="secondary" size="sm">
                          <ChatCircleDots weight="bold" className="size-4" /> Message
                        </LinkButton>
                      )}
                    </div>
                  )}

                  {(ride.status === RIDE_STATUS.OPEN || ride.status === RIDE_STATUS.CLAIMED) && (
                    <div className="mt-3 flex gap-2">
                      {ride.status === RIDE_STATUS.CLAIMED && (
                        <RideActionButton
                          rideId={ride.id}
                          action={completeRideRequestAction}
                          label="Mark completed"
                          pendingLabel="Saving…"
                        />
                      )}
                      <RideActionButton
                        rideId={ride.id}
                        action={cancelRideRequestAction}
                        label="Cancel"
                        pendingLabel="Cancelling…"
                        variant="ghost"
                        confirmMessage="Cancel this ride request?"
                      />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthShell>
  );
}
