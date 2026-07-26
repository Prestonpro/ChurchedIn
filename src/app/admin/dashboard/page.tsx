import Link from "next/link";
import { UsersThree, CalendarBlank, Flag, Plus, Buildings, HandsClapping, HandHeart, GraduationCap, Star } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LinkButton } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { listPartnershipsForChurch } from "@/lib/queries";
import { ROLES, VERIFICATION_STATUS, VOUCHES_NEEDED_FOR_COMMUNITY_VERIFIED, type EventCategory, type Role } from "@/lib/constants";
import { VerificationBadge } from "@/components/VerificationBadge";
import { PastorVerifyButton } from "@/components/PastorVerifyButton";
import { PartnershipManager } from "./PartnershipManager";

const ROLE_META: Record<Role, { label: string; icon: typeof Star }> = {
  CHURCH_ADMIN: { label: "Church leader", icon: Star },
  VOLUNTEER: { label: "Volunteer", icon: HandHeart },
  STUDENT: { label: "Student", icon: GraduationCap },
};

export default async function AdminDashboardPage() {
  const user = await requireRole(ROLES.CHURCH_ADMIN);
  const churchId = user.activeMembership!.churchId;

  const [church, memberCount, openReportCount, events, roleCounts, recentJoins, partnerships, vouchCount] =
    await Promise.all([
      prisma.church.findUnique({ where: { id: churchId } }),
      prisma.membership.count({ where: { churchId } }),
      prisma.report.count({ where: { churchId, status: "OPEN" } }),
      prisma.event.findMany({
        where: { churchId },
        orderBy: { startsAt: "desc" },
        take: 20,
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.membership.groupBy({ by: ["role"], where: { churchId }, _count: true }),
      prisma.membership.findMany({
        where: { churchId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { name: true } } },
      }),
      listPartnershipsForChurch(churchId),
      prisma.churchVouch.count({ where: { churchId } }),
    ]);
  const nextEvent = events
    .filter((e) => e.startsAt >= new Date() && e.status !== "CANCELLED")
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
  const countByRole = Object.fromEntries(roleCounts.map((r) => [r.role, r._count])) as Partial<Record<Role, number>>;

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-ink">{church?.name}</h1>
            {church && <VerificationBadge status={church.verificationStatus} />}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {memberCount} {memberCount === 1 ? "member" : "members"} — church leader overview
          </p>
        </div>
        <LinkButton href="/volunteer/events/new">
          <Plus weight="bold" className="size-4" /> Plan a gathering
        </LinkButton>
      </div>

      {church && church.verificationStatus !== VERIFICATION_STATUS.PASTOR_VERIFIED && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-ink">Church verification</h2>
              {church.verificationStatus === VERIFICATION_STATUS.UNVERIFIED ? (
                <p className="text-sm text-ink-muted">
                  {`${vouchCount} of ${VOUCHES_NEEDED_FOR_COMMUNITY_VERIFIED} community vouches received.`}{" "}
                  Members of other verified churches can vouch for you from your church&apos;s discover page.
                </p>
              ) : (
                <p className="text-sm text-ink-muted">
                  Community verified. A recognized pastor can upgrade this further.
                </p>
              )}
            </div>
            <PastorVerifyButton churchId={churchId} />
          </div>
        </Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={UsersThree}
          label="Members"
          value={memberCount}
          tone="bg-brand-50 text-brand-600"
          accent="border-l-brand-500"
        />
        <StatCard
          icon={CalendarBlank}
          label="Events"
          value={events.length}
          sublabel={nextEvent ? `Next: ${nextEvent.title}` : undefined}
          tone="bg-cat-study-soft text-cat-study"
          accent="border-l-cat-study"
        />
        <StatCard
          icon={Flag}
          label="Open reports"
          value={openReportCount}
          tone="bg-warning-soft text-warning"
          accent="border-l-warning"
          href="/admin/reports"
        />
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Buildings weight="fill" className="size-5" />
          </span>
          <div>
            <h2 className="font-bold text-ink">Invite people</h2>
            <p className="text-sm text-ink-muted">
              Share this code — anyone can join as a volunteer or student.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <code className="rounded-lg bg-paper px-4 py-2.5 text-lg font-bold tracking-[0.3em] text-brand-700">
            {church?.joinCode}
          </code>
          <CopyButton text={church?.joinCode ?? ""} label="Copy code" />
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="mb-4 font-bold text-ink">Your community</h2>
        <div className="mb-5 flex flex-wrap gap-4">
          {(Object.keys(ROLE_META) as Role[]).map((role) => {
            const meta = ROLE_META[role];
            const Icon = meta.icon;
            return (
              <div key={role} className="flex items-center gap-2 rounded-xl bg-paper px-3.5 py-2.5">
                <Icon weight="fill" className="size-4 text-brand-600" />
                <span className="text-sm font-bold text-ink">{countByRole[role] ?? 0}</span>
                <span className="text-xs text-ink-muted">{meta.label}{(countByRole[role] ?? 0) !== 1 ? "s" : ""}</span>
              </div>
            );
          })}
        </div>
        {recentJoins.length > 0 && (
          <>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Recently joined
            </h3>
            <ul className="space-y-2">
              {recentJoins.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5">
                  <Avatar name={m.user.name} size="xs" />
                  <span className="text-sm text-ink">{m.user.name}</span>
                  <Badge tone="neutral">{ROLE_META[m.role as Role].label}</Badge>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <HandsClapping weight="fill" className="size-5" />
          </span>
          <div>
            <h2 className="font-bold text-ink">Collaborate with another church</h2>
            <p className="text-sm text-ink-muted">
              Partner with a nearby church to browse each other&apos;s gatherings. RSVPs, reports, and
              the friend directory stay separate.
            </p>
          </div>
        </div>
        <PartnershipManager partnerships={partnerships} />
      </Card>

      <Card>
        <h2 className="mb-4 font-bold text-ink">Events</h2>
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarBlank}
            title="Nothing on the calendar yet"
            action={
              <LinkButton href="/volunteer/events/new" size="sm">
                <Plus weight="bold" className="size-4" /> Plan the first one
              </LinkButton>
            }
          />
        ) : (
          <div className="space-y-2">
            {events.map((event) => {
              const style = categoryStyle(event.category as EventCategory);
              const Icon = style.icon;
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="flex items-center justify-between rounded-xl border border-line p-3 transition-brand hover:border-brand-200 hover:bg-paper"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>
                      <Icon weight="fill" className="size-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{event.title}</p>
                      <p className="text-xs text-ink-muted">Planned by {event.createdBy.name}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-xs text-ink-muted">
                    {event.startsAt.toLocaleDateString()}
                    {event.status === "CANCELLED" && <Badge tone="danger">Cancelled</Badge>}
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
