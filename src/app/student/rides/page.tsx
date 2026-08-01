import Link from "next/link";
import { Car, EnvelopeSimple, MapPin, ChatCircleDots } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { listRideRequestsForStudent } from "@/lib/queries";
import { rideContactVisible } from "@/lib/rideState";
import { cancelRideRequestAction, completeRideRequestAction } from "@/lib/actions/rides";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { RideActionButton } from "@/components/RideActionButton";
import { RideRequestForm } from "./RideRequestForm";
import { ROLES, RIDE_STATUS } from "@/lib/constants";

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

export default async function StudentRidesPage() {
  const user = await requireRole(ROLES.STUDENT);
  const rides = await listRideRequestsForStudent(user.id);

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Rides</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Need a lift somewhere? Ask, and a volunteer at your church can help.
        </p>
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
                    <Badge tone={STATUS_TONE[ride.status]}>{STATUS_LABEL[ride.status]}</Badge>
                  </div>
                  {ride.notes && <p className="mt-3 text-sm text-ink-soft">{ride.notes}</p>}

                  {ride.volunteer && rideContactVisible(ride.status) && (
                    <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-paper p-3">
                      <Avatar name={ride.volunteer.name} size="sm" />
                      <div className="flex-1">
                        <Link
                          href={`/profile/${ride.volunteer.id}`}
                          className="text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                        >
                          {ride.volunteer.name}
                        </Link>
                        {ride.volunteer.email && (
                          <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                            <EnvelopeSimple weight="bold" className="size-3.5" /> {ride.volunteer.email}
                          </p>
                        )}
                      </div>
                      {ride.connectionId && (
                        <LinkButton href={`/messages/${ride.connectionId}`} variant="secondary" size="sm">
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
