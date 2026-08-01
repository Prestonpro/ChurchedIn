import Link from "next/link";
import { Clock, Translate, UsersThree, MapPinLine, Car, NavigationArrow, Path } from "@phosphor-icons/react/dist/ssr";
import { MemberCountBadge } from "@/components/MemberCountBadge";
import { Badge } from "@/components/ui/Badge";
import type { DiscoverableChurch } from "./DiscoverClient";

/** Shared between the sidebar list and the map popup — same info either
 * way, per the brief ("Clicking a pin shows a popup with the church card
 * info").
 *
 * `onRoute` is only passed by the map popup, which is also why the in-map
 * "Route" button replaces the plain Google Maps link there rather than
 * adding a fourth action: the sidebar renders this card inside a big
 * selection <button>, so putting another <button> in here would nest
 * interactive elements. */
export function ChurchCard({
  church,
  compact = false,
  onRoute,
  routeLoading = false,
}: {
  church: DiscoverableChurch;
  compact?: boolean;
  onRoute?: () => void;
  routeLoading?: boolean;
}) {
  const languageList = church.languages
    ? church.languages.split(",").map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <div className={compact ? "w-64" : ""}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-ink">{church.name}</h3>
        <MemberCountBadge memberCount={church.memberCount} />
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        {church.denomination}
        {church.denomination && church.distanceMiles != null && " · "}
        {church.distanceMiles != null && `${church.distanceMiles.toFixed(1)} mi away`}
      </p>
      {!church.isClaimed && (
        <Badge tone="warning" className="mt-1.5">
          Not yet claimed
        </Badge>
      )}
      {languageList.length > 0 && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-soft">
          <Translate weight="bold" className="size-3.5 shrink-0 text-ink-faint" />
          {languageList.join(", ")}
        </p>
      )}
      {church.serviceTimes && (
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
          <Clock weight="bold" className="size-3.5 shrink-0 text-ink-faint" />
          {church.serviceTimes}
        </p>
      )}
      {church.address && (
        <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
          <MapPinLine weight="bold" className="size-3.5 shrink-0 text-ink-faint" />
          {church.address}
        </p>
      )}
      {church.bio && !compact && (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{church.bio}</p>
      )}
      {church.upcomingEventCount > 0 && (
        <p className="mt-1.5 text-xs font-medium text-ink-soft">
          {church.upcomingEventCount} upcoming {church.upcomingEventCount === 1 ? "gathering" : "gatherings"}
        </p>
      )}
      <div className="mt-3 flex gap-1.5">
        <Link
          href={`/churches/${church.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-ink transition-brand hover:bg-brand-700"
        >
          <UsersThree weight="bold" className="size-3.5" /> Visit profile
        </Link>
        <Link
          href={`/churches/${church.id}?ride=1`}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-accent-300 bg-accent-50 px-2.5 py-1.5 text-xs font-semibold text-ink transition-brand hover:border-accent-400 hover:bg-accent-100"
        >
          <Car weight="bold" className="size-3.5" /> Need a ride?
        </Link>
      </div>
      {church.locationLat !== null &&
        church.locationLng !== null &&
        (onRoute ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRoute();
            }}
            disabled={routeLoading}
            className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-line-dark hover:bg-surface disabled:opacity-60"
          >
            {routeLoading ? (
              <>
                <span className="size-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                Routing…
              </>
            ) : (
              <>
                <Path weight="bold" className="size-3.5" /> Route from my location
              </>
            )}
          </button>
        ) : (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${church.locationLat},${church.locationLng}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 flex items-center justify-center gap-1 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-line-dark hover:bg-surface"
          >
            <NavigationArrow weight="bold" className="size-3.5" /> Get directions
          </a>
        ))}
    </div>
  );
}
