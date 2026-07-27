import Link from "next/link";
import { CalendarBlank, Compass, Plus, UsersThree, Car, GearSix } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { listEventsForChurch } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { MemberCountBadge } from "@/components/MemberCountBadge";
import { Reveal } from "@/components/Reveal";
import { FloatingShape } from "@/components/FloatingShape";
import { ROLES } from "@/lib/constants";

/**
 * Where the ChurchedIn logo leads, and (for now) a separate destination
 * from the role dashboards — this is a warm "welcome back" snapshot in the
 * same visual language as the landing page (hero mesh, floating shapes,
 * scroll/mount reveals), not another data-dense management screen. The
 * dashboards keep their own distinct, role-specific management content.
 */
export default async function HomePage() {
  const user = await requireUser();
  const membership = user.activeMembership;
  const churchId = membership?.churchId;

  const [memberCount, events] = churchId
    ? await Promise.all([
        prisma.membership.count({ where: { churchId } }),
        listEventsForChurch(churchId),
      ])
    : [0, []];
  const nextEvent = events.find((e) => e.startsAt >= new Date());

  const role = membership?.role;
  const quickActions = [
    ...(role === ROLES.CHURCH_ADMIN || role === ROLES.VOLUNTEER
      ? [{ href: "/volunteer/events/new", label: "Plan a gathering", icon: Plus, tone: "brand" as const }]
      : []),
    { href: "/discover", label: "Discover churches", icon: Compass, tone: "accent" as const },
    ...(role === ROLES.STUDENT
      ? [{ href: "/student/mentors", label: "Find a friend", icon: UsersThree, tone: "brand" as const }]
      : []),
    {
      href: role === ROLES.STUDENT ? "/student/rides" : "/volunteer/rides",
      label: "Rides",
      icon: Car,
      tone: "accent" as const,
    },
    ...(role === ROLES.CHURCH_ADMIN
      ? [{ href: `/churches/${churchId}/settings`, label: "Church settings", icon: GearSix, tone: "brand" as const }]
      : []),
  ];

  return (
    <AuthShell user={user}>
      <div className="relative -mx-6 -mt-8 overflow-hidden rounded-b-3xl bg-hero-mesh px-6 pb-10 pt-10 sm:px-10">
        <FloatingShape position="left-[6%] top-[20%]" size="size-12" tone="bg-brand-300/35" scrollSpeed={0} />
        <FloatingShape position="right-[8%] top-[10%]" size="size-9" tone="bg-accent-300/35" delay="2s" scrollSpeed={0} />
        <Reveal>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Welcome back, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-xl text-ink-soft">
            {membership
              ? "Here's what's happening in your church community."
              : "Join or start a church to see your community here."}
          </p>
        </Reveal>
      </div>

      {membership && (
        <Reveal delay={100}>
          <Card className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/churches/${churchId}`}
                    className="text-lg font-bold text-ink transition-brand hover:text-brand-600 hover:underline"
                  >
                    {membership.church.name}
                  </Link>
                  <MemberCountBadge memberCount={memberCount} />
                </div>
                {nextEvent ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                    <CalendarBlank weight="bold" className="size-4 text-brand-600" />
                    Next up: <span className="font-medium text-ink-soft">{nextEvent.title}</span> ·{" "}
                    {nextEvent.startsAt.toLocaleDateString()}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-ink-muted">Nothing on the calendar yet.</p>
                )}
              </div>
              <Link
                href="/events"
                className="text-sm font-semibold text-brand-600 transition-brand hover:underline"
              >
                View all gatherings →
              </Link>
            </div>
          </Card>
        </Reveal>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Reveal key={action.href} delay={index * 80}>
              <Link
                href={action.href}
                className="group flex h-full flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-5 shadow-card transition-brand hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lifted"
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-xl transition-brand ${
                    action.tone === "brand"
                      ? "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
                      : "bg-accent-50 text-accent-600 group-hover:bg-accent-600 group-hover:text-white"
                  }`}
                >
                  <Icon weight="duotone" className="size-6" />
                </span>
                <span className="font-semibold text-ink">{action.label}</span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </AuthShell>
  );
}
