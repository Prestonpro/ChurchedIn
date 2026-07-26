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
} from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { getChurchProfile, listEventsForChurch, hasUserVouchedForChurch, isVerifiedElsewhere } from "@/lib/queries";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerificationBadge } from "@/components/VerificationBadge";
import { VouchButton } from "@/components/VouchButton";
import { PastorVerifyButton } from "@/components/PastorVerifyButton";
import { MiniMapLoader } from "@/components/MiniMapLoader";
import { VERIFICATION_STATUS, type EventCategory } from "@/lib/constants";
import { JoinChurchForm } from "./JoinChurchForm";
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
  const church = await getChurchProfile(id);
  if (!church) {
    notFound();
  }

  const isMember = user.memberships.some((m) => m.churchId === id);
  const membership = user.memberships.find((m) => m.churchId === id);
  const canManageSettings = membership?.role === "CHURCH_ADMIN" || !!membership?.isPastor;
  const canVerifyAsPastor =
    isMember &&
    church.verificationStatus !== VERIFICATION_STATUS.PASTOR_VERIFIED &&
    (membership?.isPastor || membership?.role === "CHURCH_ADMIN");

  const [events, hasVouched, canVouch] = await Promise.all([
    listEventsForChurch(id),
    isMember ? Promise.resolve(false) : hasUserVouchedForChurch(user.id, id),
    isMember ? Promise.resolve(false) : isVerifiedElsewhere(user.id, id),
  ]);
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
                  <h1 className="text-2xl font-extrabold text-ink">{church.name}</h1>
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
                <VerificationBadge status={church.verificationStatus} />
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

            {canVouch && !hasVouched && (
              <div className="mt-4 border-t border-line pt-4">
                <VouchButton churchId={id} />
              </div>
            )}
            {hasVouched && (
              <p className="mt-4 border-t border-line pt-4 text-sm font-medium text-success">
                You&apos;ve vouched for this church. Thanks for helping build trust in the community.
              </p>
            )}
            {canVerifyAsPastor && (
              <div className="mt-4 border-t border-line pt-4">
                <PastorVerifyButton churchId={id} />
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-1.5 font-bold text-ink">
              <CalendarBlank weight="bold" className="size-4.5 text-brand-600" /> Upcoming gatherings
            </h2>
            {upcoming.length === 0 ? (
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
              <JoinChurchForm churchId={id} />
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
