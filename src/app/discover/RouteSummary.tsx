"use client";

import { Car, NavigationArrow, X, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { formatDuration, formatArrivalTime, googleMapsDirectionsUrl } from "@/lib/routing";
import type { DrivingRoute, LatLng } from "@/lib/routing";

export type RouteState = {
  churchId: string | null;
  churchName: string | null;
  destination: LatLng | null;
  route: DrivingRoute | null;
  computedAt: Date | null;
  loading: boolean;
  error: string | null;
};

/**
 * The ETA card that sits over the map once a route is drawn. Deliberately
 * still offers the Google Maps handoff: this shows the trip at a glance, but
 * it has no turn-by-turn directions and no live traffic, so anyone actually
 * about to drive should finish the job in a real maps app.
 */
export function RouteSummary({
  state,
  userLocation,
  onClear,
}: {
  state: RouteState;
  userLocation: LatLng | null;
  onClear: () => void;
}) {
  if (!state.churchId && !state.error && !state.loading) return null;

  return (
    <div className="absolute bottom-3 left-3 right-3 z-[1000] mx-auto max-w-sm rounded-2xl border border-line bg-surface/95 p-4 shadow-card backdrop-blur-sm sm:right-auto">
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear route"
        className="absolute right-3 top-3 flex size-7 cursor-pointer items-center justify-center rounded-lg text-ink-faint transition-brand hover:bg-paper hover:text-ink"
      >
        <X weight="bold" className="size-3.5" />
      </button>

      {state.error ? (
        <>
          <p className="flex items-start gap-2 pr-8 text-sm text-ink-soft">
            <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-warning" />
            {state.error}
          </p>
          {state.destination && (
            <a
              href={googleMapsDirectionsUrl(state.destination, userLocation)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-line-dark hover:bg-surface"
            >
              <NavigationArrow weight="bold" className="size-3.5" /> Open in Google Maps
            </a>
          )}
        </>
      ) : state.loading ? (
        <p className="flex items-center gap-2 pr-8 text-sm text-ink-soft">
          <span className="size-3.5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Finding the fastest route…
        </p>
      ) : state.route && state.computedAt ? (
        <>
          <p className="pr-8 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Driving to {state.churchName}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="flex items-center gap-1.5 text-2xl font-extrabold text-ink">
              <Car weight="fill" className="size-5 text-brand-600" />
              {formatDuration(state.route.durationSeconds)}
            </span>
            <span className="text-sm text-ink-muted">{state.route.distanceMiles.toFixed(1)} mi</span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Arrive around {formatArrivalTime(state.route.durationSeconds, state.computedAt)} if you leave now
          </p>
          {state.destination && (
            <a
              href={googleMapsDirectionsUrl(state.destination, userLocation)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-line-dark hover:bg-surface"
            >
              <NavigationArrow weight="bold" className="size-3.5" /> Turn-by-turn in Google Maps
            </a>
          )}
        </>
      ) : null}
    </div>
  );
}
