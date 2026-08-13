import Link from "next/link";
import type { Metadata } from "next";
import { Car, MapPin, UsersThree, Clock, HandHeart } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import {
  listOpenRideRequestsForChurch,
  listClaimedRideRequestsForVolunteer,
  listRideOffersForVolunteer,
} from "@/lib/queries";
import { rideContactVisible } from "@/lib/rideState";
import { RSVP_STATUS } from "@/lib/constants";
import { claimRideRequestAction, completeRideRequestAction } from "@/lib/actions/rides";
import { cancelRideOfferAction } from "@/lib/actions/rideOffers";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { RideActionButton } from "@/components/RideActionButton";
import { ContactEmail } from "@/components/ui/ContactEmail";
import { RideOfferForm } from "./RideOfferForm";
import { ROLES, RIDE_STATUS, RIDE_REQUEST_TYPE } from "@/lib/constants";

export const metadata: Metadata = { title: "Rides" };

export default async function VolunteerRidesPage() {
  const user = await requireRole(ROLES.VOLUNTEER);
  const churchId = user.activeMembership!.churchId;

  const [openRides, myClaimedRides, myOffers] = await Promise.all([
    listOpenRideRequestsForChurch(churchId, user.id),
    listClaimedRideRequestsForVolunteer(user.id),
    listRideOffersForVolunteer(user.id),
  ]);
  const activeClaimed = myClaimedRides.filter((r) => r.status === RIDE_STATUS.CLAIMED);
  const pastClaimed = myClaimedRides.filter((r) => r.status !== RIDE_STATUS.CLAIMED);
  const activeOffers = myOffers.filter((o) => !o.cancelledAt);
  const pastOffers = myOffers.filter((o) => o.cancelledAt);

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Rides board</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Students at your church asking for a ride. Claim one to help out, or offer your own trip to church.
        </p>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 font-bold text-ink">Offer a ride to church</h2>
          <RideOfferForm />
        </Card>

        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Your offered rides</h2>
          {activeOffers.length === 0 ? (
            <EmptyState icon={Car} title="No rides offered yet" body="Fill out the form to offer a ride to church." />
          ) : (
            <div className="space-y-3">
              {activeOffers.map((offer) => {
                const confirmed = offer.claims.filter((c) => c.status === RSVP_STATUS.CONFIRMED);
                const waitlisted = offer.claims.filter((c) => c.status === RSVP_STATUS.WAITLISTED);
                return (
                  <Card key={offer.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <Car weight="fill" className="size-4.5" />
                        </span>
                        <div>
                          <p className="font-semibold text-ink">Ride to church</p>
                          <p className="flex items-center gap-1 text-xs text-ink-muted">
                            <Clock weight="bold" className="size-3.5" /> {offer.date.toLocaleDateString()} · {offer.time}
                          </p>
                        </div>
                      </div>
                      <Badge tone={confirmed.length >= offer.capacity ? "neutral" : "success"} icon={UsersThree}>
                        {confirmed.length}/{offer.capacity} seats
                      </Badge>
                    </div>
                    {offer.notes && <p className="mt-3 text-sm text-ink-soft">{offer.notes}</p>}

                    {offer.claims.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {confirmed.map((c) => (
                          <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-paper p-2.5">
                            <Avatar name={c.student.name} size="sm" />
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/profile/${c.student.id}`}
                                className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                              >
                                {c.student.name}
                              </Link>
                              {c.student.email && <ContactEmail email={c.student.email} />}
                            </div>
                          </div>
                        ))}
                        {waitlisted.map((c) => (
                          <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-dashed border-line p-2.5">
                            <Avatar name={c.student.name} size="sm" />
                            <p className="flex-1 text-sm font-medium text-ink-muted">{c.student.name}</p>
                            <Badge tone="warning">Waitlisted</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3">
                      <RideActionButton
                        rideId={offer.id}
                        action={cancelRideOfferAction}
                        label="Cancel this ride"
                        pendingLabel="Cancelling…"
                        variant="ghost"
                        confirmMessage="Cancel this ride offer? Everyone who joined will be notified."
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {pastOffers.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">Cancelled offers</h2>
              <div className="space-y-2">
                {pastOffers.map((offer) => (
                  <Card key={offer.id}>
                    <p className="font-bold text-ink">Ride to church</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {offer.date.toLocaleDateString()} · {offer.time}
                    </p>
                    <Badge tone="neutral" className="mt-2">Cancelled</Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 border-t border-line pt-6">
        <h2 className="text-lg font-bold text-ink">Ride requests</h2>
        <p className="mt-1 text-sm text-ink-muted">Students asking for a ride. Claim one to help out.</p>
      </div>

      {activeClaimed.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Rides you&apos;re giving</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeClaimed.map((ride) => (
              <Card key={ride.id} className="border-l-4 border-l-brand-500">
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
                {ride.notes && <p className="mt-3 text-sm text-ink-soft">{ride.notes}</p>}
                {rideContactVisible(ride.status) && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-paper p-3">
                    <Avatar name={ride.student.name} size="sm" />
                    <div>
                      <Link
                        href={`/profile/${ride.student.id}`}
                        className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                      >
                        {ride.student.name}
                      </Link>
                      {ride.student.email && <ContactEmail email={ride.student.email} />}
                    </div>
                  </div>
                )}
                <div className="mt-3">
                  <RideActionButton
                    rideId={ride.id}
                    action={completeRideRequestAction}
                    label="Mark completed"
                    pendingLabel="Saving…"
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Open requests</h2>
      {openRides.length === 0 ? (
        <EmptyState icon={Car} title="No open ride requests" body="Check back later. Nothing needs a lift right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {openRides.map((ride, i) => {
            const isFirstVisit = ride.type === RIDE_REQUEST_TYPE.FIRST_VISIT;
            return (
              <Card
                key={ride.id}
                className={`animate-fade-up ${isFirstVisit ? "border-l-4 border-l-accent-500" : ""}`}
                style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/rides/${ride.id}`} className="flex items-center gap-2.5 hover:opacity-80">
                    <span
                      className={`flex size-9 items-center justify-center rounded-lg ${
                        isFirstVisit ? "bg-accent-100 text-accent-700" : "bg-warning-soft text-warning"
                      }`}
                    >
                      {isFirstVisit ? (
                        <HandHeart weight="fill" className="size-4.5" />
                      ) : (
                        <MapPin weight="fill" className="size-4.5" />
                      )}
                    </span>
                    <div>
                      <p className="font-semibold text-ink hover:text-brand-700 hover:underline">{ride.destination}</p>
                      <p className="text-xs text-ink-muted">
                        {ride.date.toLocaleDateString()} · {ride.time}
                      </p>
                    </div>
                  </Link>
                  {isFirstVisit ? (
                    <Badge tone="accent" icon={HandHeart}>
                      First visit
                    </Badge>
                  ) : (
                    <Badge tone="warning">Open</Badge>
                  )}
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                  <Avatar name={ride.student.name} size="xs" />
                  {isFirstVisit ? `${ride.student.name} is visiting for the first time` : `Requested by ${ride.student.name}`}
                </p>
                {ride.notes && <p className="mt-2 text-sm text-ink-soft">{ride.notes}</p>}
                <div className="mt-3">
                  <RideActionButton
                    rideId={ride.id}
                    action={claimRideRequestAction}
                    label={isFirstVisit ? "Welcome them" : "Claim this ride"}
                    pendingLabel="Claiming…"
                    variant="primary"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {pastClaimed.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-faint">Past rides</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pastClaimed.map((ride) => (
              <Card key={ride.id}>
                <p className="font-bold text-ink">{ride.destination}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {ride.date.toLocaleDateString()} · {ride.time}
                </p>
                <Badge tone={ride.status === RIDE_STATUS.COMPLETED ? "success" : "neutral"} className="mt-2">
                  {ride.status === RIDE_STATUS.COMPLETED ? "Completed" : "Cancelled"}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
