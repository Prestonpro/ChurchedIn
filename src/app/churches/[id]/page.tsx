import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Buildings,
  Globe,
  Translate,
  Clock,
  UsersThree,
  MapPin,
  NavigationArrow,
  CalendarBlank,
  Ticket,
} from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { getChurchProfile, listEventsForChurch } from "@/lib/queries";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberCountBadge } from "@/components/MemberCountBadge";
import { Badge } from "@/components/ui/Badge";
import { MiniMapLoader } from "@/components/MiniMapLoader";
import { CopyButton } from "@/components/ui/CopyButton";
import { ROLES, type EventCategory } from "@/lib/constants";
import { JoinChurchForm } from "./JoinChurchForm";
import { ClaimAdminButton } from "./ClaimAdminButton";
import { FirstVisitRideForm } from "./FirstVisitRideForm";

export default async function ChurchProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ride?: string }>;
}) {
  const { id } = await params;
  const { ride } = await searchParams;
  const user = await requireUser();

  const membership = user.memberships.find((m) => m.churchId === id);
  const isMember = !!membership;
  const canManageSettings = membership?.role === ROLES.CHURCH_ADMIN;

  // A church's own profile (name, bio, service times, location) is public by
  // design — see listDiscoverableChurches' doc comment. Its *event feed* is
  // not: that's per-church operational data, and rendering titles/dates here
  // to any signed-in visitor (including a church-less /browse account, which
  // reaches this page straight off /discover) leaked it. Non-members get the
  // upcoming count only, which /discover already publishes anyway.
  const [church, events] = await Promise.all([
    getChurchProfile(id),
    isMember ? listEventsForChurch(id) : Promise.resolve([]),
  ]);
  if (!church) {
    notFound();
  }
  const upcoming = events.filter((e) => e.startsAt >= new Date());

  const languageList = church.languages
    ? church.languages.split(",").map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <AuthShell user={user}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Buildings weight="fill" className="size-5.5" />
                </span>
                <div>
                  <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink">
                    {church.name}
                    {!church.claimedAt && (
                      <Badge tone="neutral">Not yet claimed</Badge>
                    )}
                  </h1>
                  <p className="text-sm text-ink-muted">
                    {church.memberCount} {church.memberCount === 1 ? "member" : "members"}
                    {church.denomination && <> · {church.denomination}</>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canManageSettings && (
                  <Link
                    href={`/churches/${id}/settings`}
                    className="text-sm font-semibold text-brand-600 transition-brand hover:underline"
                  >
                    Settings
                  </Link>
                )}
                <MemberCountBadge memberCount={church.memberCount} />
              </div>
            </div>

            {church.bio && <p className="mt-4 text-sm leading-relaxed text-ink-soft">{church.bio}</p>}

            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm text-ink-soft">
              {church.serviceTimes && (
                <p className="flex items-center gap-2">
                  <Clock weight="bold" className="size-4 shrink-0 text-ink-faint" />
                  {church.serviceTimes}
                </p>
              )}
              {languageList.length > 0 && (
                <p className="flex items-center gap-2">
                  <Translate weight="bold" className="size-4 shrink-0 text-ink-faint" />
                  {languageList.join(", ")}
                </p>
              )}
              {church.website && (
                <p className="flex items-center gap-2">
                  <Globe weight="bold" className="size-4 shrink-0 text-ink-faint" />
                  <a
                    href={church.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:underline"
                  >
                    {church.website}
                  </a>
                </p>
              )}
            </div>

          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-1.5 font-bold text-ink">
              <CalendarBlank weight="bold" className="size-4.5 text-brand-600" /> Upcoming gatherings
            </h2>
            {!isMember ? (
              <EmptyState
                icon={CalendarBlank}
                title={
                  church.upcomingEventCount === 0
                    ? "Nothing on the calendar yet"
                    : `${church.upcomingEventCount} upcoming ${church.upcomingEventCount === 1 ? "gathering" : "gatherings"}`
                }
                body="Join this church to see what's happening and RSVP."
              />
            ) : upcoming.length === 0 ? (
              <EmptyState icon={CalendarBlank} title="Nothing on the calendar yet" />
            ) : (
              <div className="space-y-2">
                {upcoming.map((event) => {
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
                        <span className="text-sm font-semibold text-ink">{event.title}</span>
                      </div>
                      <span className="text-xs text-ink-muted">{event.startsAt.toLocaleDateString()}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          {church.locationLat !== null && church.locationLng !== null && (
            <Card>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
                <MapPin weight="bold" className="size-4 text-brand-600" /> Location
              </h2>
              <div className="mb-3 overflow-hidden rounded-xl">
                <MiniMapLoader lat={church.locationLat} lng={church.locationLng} />
              </div>
              {church.address && <p className="text-sm text-ink-soft">{church.address}</p>}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${church.locationLat},${church.locationLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-brand hover:underline"
              >
                <NavigationArrow weight="bold" className="size-4" /> Get directions
              </a>
            </Card>
          )}

          {!isMember && (
            <Card>
              <h2 className="mb-3 flex items-center gap-1.5 font-bold text-ink">
                <UsersThree weight="bold" className="size-4 text-brand-600" /> Join this church
              </h2>
              <JoinChurchForm churchId={id} requireJoinCode={church.claimedAt !== null} />
            </Card>
          )}

          {isMember && !canManageSettings && (
            <Card>
              <h2 className="mb-3 flex items-center gap-1.5 font-bold text-ink">
                <Ticket weight="bold" className="size-4 text-brand-600" /> Invite people
              </h2>
              <p className="mb-3 text-sm text-ink-soft">
                Share this code with anyone you&apos;d like to invite to {church.name}.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <code className="rounded-lg bg-paper px-4 py-2.5 text-lg font-bold tracking-[0.3em] text-brand-700">
                  {church.joinCode}
                </code>
                <CopyButton text={church.joinCode} label="Copy code" />
              </div>
            </Card>
          )}

          {isMember && !canManageSettings && !church.claimedAt && (
            <Card>
              <h2 className="mb-2 flex items-center gap-1.5 font-bold text-ink">
                <Buildings weight="bold" className="size-4 text-brand-600" /> Claim this church
              </h2>
              <p className="mb-3 text-sm text-ink-soft">
                This listing doesn&apos;t have a leader yet. If you help lead {church.name}, you can claim it to
                manage its profile, gatherings, and members.
              </p>
              <ClaimAdminButton churchId={id} />
            </Card>
          )}

          <Card>
            <FirstVisitRideForm
              churchId={id}
              defaultDestination={church.address || church.name}
              autoOpen={ride === "1"}
            />
          </Card>
        </div>
      </div>
    </AuthShell>
  );
}
