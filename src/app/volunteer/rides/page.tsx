import { Car, EnvelopeSimple, MapPin, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { listOpenRideRequestsForChurch, listClaimedRideRequestsForVolunteer } from "@/lib/queries";
import { rideContactVisible } from "@/lib/rideState";
import { claimRideRequestAction, completeRideRequestAction } from "@/lib/actions/rides";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { RideActionButton } from "@/components/RideActionButton";
import { ROLES, RIDE_STATUS, RIDE_REQUEST_TYPE } from "@/lib/constants";

export default async function VolunteerRidesPage() {
  const user = await requireRole(ROLES.VOLUNTEER);
  const churchId = user.activeMembership!.churchId;

  const [openRides, myClaimedRides] = await Promise.all([
    listOpenRideRequestsForChurch(churchId),
    listClaimedRideRequestsForVolunteer(user.id),
  ]);
  const activeClaimed = myClaimedRides.filter((r) => r.status === RIDE_STATUS.CLAIMED);
  const pastClaimed = myClaimedRides.filter((r) => r.status !== RIDE_STATUS.CLAIMED);

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Rides board</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Students at your church asking for a ride — claim one to help out.
        </p>
      </div>

      {activeClaimed.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Rides you&apos;re giving</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeClaimed.map((ride) => (
              <Card key={ride.id} className="border-l-4 border-l-brand-500">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <MapPin weight="fill" className="size-4.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{ride.destination}</p>
                    <p className="text-xs text-ink-muted">
                      {ride.date.toLocaleDateString()} · {ride.time}
                    </p>
                  </div>
                </div>
                {ride.notes && <p className="mt-3 text-sm text-ink-soft">{ride.notes}</p>}
                {rideContactVisible(ride.status) && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-paper p-3">
                    <Avatar name={ride.student.name} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{ride.student.name}</p>
                      {ride.student.email && (
                        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                          <EnvelopeSimple weight="bold" className="size-3.5" /> {ride.student.email}
                        </p>
                      )}
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
        <EmptyState icon={Car} title="No open ride requests" body="Check back later — nothing needs a lift right now." />
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
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex size-9 items-center justify-center rounded-lg ${
                        isFirstVisit ? "bg-accent-100 text-accent-700" : "bg-warning-soft text-warning"
                      }`}
                    >
                      {isFirstVisit ? (
                        <Sparkle weight="fill" className="size-4.5" />
                      ) : (
                        <MapPin weight="fill" className="size-4.5" />
                      )}
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{ride.destination}</p>
                      <p className="text-xs text-ink-muted">
                        {ride.date.toLocaleDateString()} · {ride.time}
                      </p>
                    </div>
                  </div>
                  {isFirstVisit ? <Badge tone="accent">🆕 First visit</Badge> : <Badge tone="warning">Open</Badge>}
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
                    label={isFirstVisit ? "Welcome them — claim this ride" : "Claim this ride"}
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
          <div className="grid gap-4 opacity-70 sm:grid-cols-2">
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
