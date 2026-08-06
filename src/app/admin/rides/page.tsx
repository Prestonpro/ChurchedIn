import type { Metadata } from "next";
import { Car, MapPin, HandHeart } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { listAllRideRequestsForChurch } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROLES, RIDE_STATUS, RIDE_REQUEST_TYPE } from "@/lib/constants";

const STATUS_TONE = {
  OPEN: "warning",
  CLAIMED: "brand",
  COMPLETED: "success",
  CANCELLED: "neutral",
} as const;

const STATUS_LABEL = {
  OPEN: "Open",
  CLAIMED: "Claimed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

/** Read-only overview for a church leader — no claim/complete actions here,
 * those stay volunteer-only. This exists purely so "keep an eye on rides"
 * (promised in the Help guide) has somewhere to actually go; previously
 * admins had no rides page at all. */
export const metadata: Metadata = { title: "Rides" };

export default async function AdminRidesPage() {
  const user = await requireRole(ROLES.CHURCH_ADMIN);
  const churchId = user.activeMembership!.churchId;
  const rides = await listAllRideRequestsForChurch(churchId);
  const open = rides.filter((r) => r.status === RIDE_STATUS.OPEN);
  const other = rides.filter((r) => r.status !== RIDE_STATUS.OPEN);

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Rides</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Every ride request at your church. Volunteers claim these from their own rides board.
        </p>
      </div>

      {rides.length === 0 ? (
        <EmptyState icon={Car} title="No ride requests yet" body="They'll show up here once a student asks for one." />
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Needs a volunteer</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {open.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            </div>
          )}
          {other.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Claimed &amp; past</h2>
              <div className="grid gap-4 opacity-90 sm:grid-cols-2">
                {other.map((ride) => (
                  <RideCard key={ride.id} ride={ride} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AuthShell>
  );
}

function RideCard({
  ride,
}: {
  ride: {
    id: string;
    destination: string;
    date: Date;
    time: string;
    status: keyof typeof STATUS_LABEL;
    type: string;
    student: { name: string };
    volunteer: { name: string } | null;
  };
}) {
  const isFirstVisit = ride.type === RIDE_REQUEST_TYPE.FIRST_VISIT;
  return (
    <Card className={isFirstVisit ? "border-l-4 border-l-accent-500" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex size-9 items-center justify-center rounded-lg ${
              isFirstVisit ? "bg-accent-100 text-accent-700" : "bg-warning-soft text-warning"
            }`}
          >
            {isFirstVisit ? <HandHeart weight="fill" className="size-4.5" /> : <MapPin weight="fill" className="size-4.5" />}
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
      <p className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
        <Avatar name={ride.student.name} size="xs" />
        {isFirstVisit ? `${ride.student.name} is visiting for the first time` : `Requested by ${ride.student.name}`}
      </p>
      {ride.volunteer && <p className="mt-1 text-xs text-ink-muted">Driving: {ride.volunteer.name}</p>}
    </Card>
  );
}
