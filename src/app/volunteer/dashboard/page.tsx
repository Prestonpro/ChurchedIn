import Link from "next/link";
import type { Metadata } from "next";
import { CalendarBlank, Plus, HandHeart, UsersThree, Car, ChatCircleDots } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listRequestsForClaimer, listOpenRequestsForChurch, listOpenRideRequestsForChurch } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { ContactEmail } from "@/components/ui/ContactEmail";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { RespondToRequestButtons } from "@/components/RequestActions";
import { RequestActionButton } from "@/components/RequestActionButton";
import { MeetingPlanEditor } from "@/components/MeetingPlanEditor";
import { cancelRequestAction, claimRequestAction } from "@/lib/actions/requests";
import {
  REQUEST_STATUS,
  REQUEST_CATEGORY_LABELS,
  EVENT_STATUS,
  ROLES,
  type EventCategory,
} from "@/lib/constants";

export const metadata: Metadata = { title: "Dashboard" };

export default async function VolunteerDashboardPage() {
  const user = await requireRole(ROLES.VOLUNTEER);
  const churchId = user.activeMembership!.churchId;

  const now = new Date();
  // Includes events this volunteer is cohosting, not just ones they created —
  // otherwise an invited mentor has no way to see their own upcoming
  // commitment from their own dashboard. Scoped to the *active* church: this
  // page's header reports that one church's name and member count, so pulling
  // in a multi-church volunteer's events from elsewhere contradicted it.
  const eventScope = {
    churchId,
    OR: [{ createdById: user.id }, { cohosts: { some: { userId: user.id } } }],
  };
  const liveUpcoming = { ...eventScope, status: { not: EVENT_STATUS.CANCELLED }, startsAt: { gte: now } };

  const [upcoming, recentPast, memberCount, openRides, openRequests, requests, churchUpcomingCount, churchNextEvent] =
    await Promise.all([
      prisma.event.findMany({ where: liveUpcoming, orderBy: { startsAt: "asc" }, take: 10 }),
      prisma.event.findMany({
        where: { ...eventScope, startsAt: { lt: now } },
        orderBy: { startsAt: "desc" },
        take: 5,
      }),
      prisma.membership.count({ where: { churchId } }),
      listOpenRideRequestsForChurch(churchId, user.id),
      listOpenRequestsForChurch(churchId, user.id),
      listRequestsForClaimer(user.id),
      // The stat card below links to /events (every gathering at the
      // church, not just ones this volunteer hosts) — it needs to be
      // counted the same way, or it reads as a bug: "0 gatherings" next to
      // a church that clearly has several. `eventScope`'s
      // hosting-or-cohosting count still powers "Gatherings you're
      // planning or helping with" further down, which is the one place
      // that scope is actually correct.
      prisma.event.count({ where: { churchId, status: EVENT_STATUS.PUBLISHED, startsAt: { gte: now } } }),
      prisma.event.findFirst({
        where: { churchId, status: EVENT_STATUS.PUBLISHED, startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        select: { id: true, title: true },
      }),
    ]);

  const pending = requests.filter((r) => r.status === REQUEST_STATUS.PENDING);
  const active = requests.filter((r) => r.status === REQUEST_STATUS.CLAIMED);
  const myEvents = [...upcoming, ...recentPast];

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {user.activeMembership?.church.name}, {memberCount} {memberCount === 1 ? "member" : "members"}
          </p>
        </div>
        <LinkButton href="/volunteer/events/new">
          <Plus weight="bold" className="size-4" /> Plan a gathering
        </LinkButton>
      </div>

      <div className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CalendarBlank}
          label="Upcoming gatherings"
          value={churchUpcomingCount}
          sublabel={churchNextEvent ? `Next: ${churchNextEvent.title}` : undefined}
          tone="bg-cat-study-soft text-cat-study"
          accent="border-l-cat-study"
          href="/events"
        />
        <StatCard
          icon={HandHeart}
          label="Requests waiting on you"
          value={pending.length}
          tone="bg-accent-100 text-accent-700"
          accent="border-l-accent-500"
          href="#pending-requests"
        />
        <StatCard
          icon={Car}
          label="Rides needing a volunteer"
          value={openRides.length}
          tone="bg-warning-soft text-warning"
          accent="border-l-warning"
          href="/volunteer/rides"
        />
        <StatCard
          icon={HandHeart}
          label="Open requests to claim"
          value={openRequests.length}
          tone="bg-warning-soft text-warning"
          accent="border-l-warning"
          href="#open-requests"
        />
        <StatCard
          icon={UsersThree}
          label="People in your church"
          value={memberCount}
          tone="bg-brand-50 text-brand-600"
          accent="border-l-brand-500"
          href={`/churches/${churchId}/members`}
        />
      </div>

      {pending.length > 0 && (
        <Card id="pending-requests" className="mb-6">
          <h2 className="mb-3 font-bold text-ink">Requests waiting on you</h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={r.requester.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {r.requester.name} <span className="font-normal text-ink-muted">· {REQUEST_CATEGORY_LABELS[r.category]}</span>
                    </p>
                    {r.description && <p className="text-sm text-ink-muted">&quot;{r.description}&quot;</p>}
                  </div>
                </div>
                <RespondToRequestButtons requestId={r.id} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {active.length > 0 && (
        <Card className="mb-6">
          <h2 className="mb-3 font-bold text-ink">Your requests</h2>
          <div className="space-y-3">
            {active.map((r) => (
              <div key={r.id} className="space-y-2.5 rounded-xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={r.requester.name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {r.requester.name} <span className="font-normal text-ink-muted">· {REQUEST_CATEGORY_LABELS[r.category]}</span>
                      </p>
                      {r.requester.email && <ContactEmail email={r.requester.email} />}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LinkButton href={`/messages/${r.id}`} variant="secondary" size="sm">
                      <ChatCircleDots weight="bold" className="size-4" /> Message
                    </LinkButton>
                    <RequestActionButton
                      requestId={r.id}
                      action={cancelRequestAction}
                      label="End"
                      pendingLabel="Ending…"
                      variant="ghost"
                      confirmMessage="End this request?"
                    />
                  </div>
                </div>
                <MeetingPlanEditor requestId={r.id} plan={r.meetingPlan} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {openRequests.length > 0 && (
        <Card id="open-requests" className="mb-6">
          <h2 className="mb-3 font-bold text-ink">Open requests to claim</h2>
          <p className="mb-3 text-sm text-ink-muted">
            Untargeted requests from students at your church — any eligible member can claim one.
          </p>
          <div className="space-y-3">
            {openRequests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={r.requester.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {r.title} <span className="font-normal text-ink-muted">· {REQUEST_CATEGORY_LABELS[r.category]}</span>
                    </p>
                    <p className="text-xs text-ink-faint">Requested by {r.requester.name}</p>
                    {r.description && <p className="text-sm text-ink-muted">{r.description}</p>}
                  </div>
                </div>
                <RequestActionButton
                  requestId={r.id}
                  action={claimRequestAction}
                  label="Claim"
                  pendingLabel="Claiming…"
                  variant="primary"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-bold text-ink">Gatherings you&apos;re planning or helping with</h2>
        {myEvents.length === 0 ? (
          <EmptyState
            icon={CalendarBlank}
            title="Nothing on the calendar yet"
            body="Plan your first dinner, coffee chat, or friend meetup."
            action={
              <LinkButton href="/volunteer/events/new" size="sm">
                <Plus weight="bold" className="size-4" /> Plan a gathering
              </LinkButton>
            }
          />
        ) : (
          <div className="space-y-2">
            {myEvents.map((event) => {
              const style = categoryStyle(event.category as EventCategory);
              const Icon = style.icon;
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className={`flex items-center justify-between rounded-xl border border-line p-3 transition-brand hover:border-brand-200 hover:bg-paper ${
                    event.startsAt < new Date() ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>
                      <Icon weight="fill" className="size-4.5" />
                    </span>
                    <span className="text-sm font-semibold text-ink">{event.title}</span>
                    {event.createdById !== user.id && <Badge tone="brand">Co-hosting</Badge>}
                  </div>
                  <span className="flex items-center gap-2 text-xs text-ink-muted">
                    {event.startsAt.toLocaleDateString()}
                    {event.startsAt < new Date() && event.status !== EVENT_STATUS.CANCELLED && <Badge tone="neutral">Past</Badge>}
                    {event.status === EVENT_STATUS.CANCELLED && <Badge tone="danger">Cancelled</Badge>}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </AuthShell>
  );
}
