"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavigationArrow, CalendarCheck, Compass } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchDrivingRoute, type LatLng } from "@/lib/routing";
import { ChurchCard } from "./ChurchCard";
import type { RouteState } from "./RouteSummary";

const DiscoverMap = dynamic(() => import("./DiscoverMap").then((mod) => mod.DiscoverMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-paper text-sm text-ink-faint">Loading map…</div>
  ),
});

export type DiscoverableChurch = {
  id: string;
  name: string;
  denomination: string | null;
  languages: string | null;
  serviceTimes: string | null;
  bio: string | null;
  locationLat: number | null;
  locationLng: number | null;
  address: string | null;
  website: string | null;
  memberCount: number;
  upcomingEventCount: number;
  isClaimed: boolean;
  hasRealMembers: boolean;
  distanceMiles: number | null;
};

/** Haversine great-circle distance in miles — no geocoding API needed
 * since both points are already lat/lng (the church's stored pin, the
 * browser's reported location). */
function distanceMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const EMPTY_ROUTE: RouteState = {
  churchId: null,
  churchName: null,
  destination: null,
  route: null,
  computedAt: null,
  loading: false,
  error: null,
};

export function DiscoverClient({ churches }: { churches: DiscoverableChurch[] }) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [denomination, setDenomination] = useState("");
  const [language, setLanguage] = useState("");
  const [minMembers, setMinMembers] = useState(0);
  const [hasEventsOnly, setHasEventsOnly] = useState(false);

  const [routeState, setRouteState] = useState<RouteState>(EMPTY_ROUTE);
  const routeAbort = useRef<AbortController | null>(null);

  useEffect(() => () => routeAbort.current?.abort(), []);

  const handleRoute = useCallback(
    async (church: DiscoverableChurch) => {
      if (church.locationLat === null || church.locationLng === null) return;
      const destination: LatLng = [church.locationLat, church.locationLng];
      const base = { churchId: church.id, churchName: church.name, destination };

      if (!userLocation) {
        setRouteState({
          ...base,
          route: null,
          computedAt: null,
          loading: false,
          error: "Share your location in your browser and we can route from where you are.",
        });
        return;
      }

      // A second "Route" press while one is still resolving supersedes it —
      // otherwise a slow first response could land after a newer one and
      // draw the wrong trip.
      routeAbort.current?.abort();
      const controller = new AbortController();
      routeAbort.current = controller;

      setRouteState({ ...base, route: null, computedAt: null, loading: true, error: null });

      const route = await fetchDrivingRoute(userLocation, destination, controller.signal);
      if (controller.signal.aborted) return;

      setRouteState(
        route
          ? { ...base, route, computedAt: new Date(), loading: false, error: null }
          : {
              ...base,
              route: null,
              computedAt: null,
              loading: false,
              error: "Couldn't work out a driving route just now.",
            },
      );
    },
    [userLocation],
  );

  const handleClearRoute = useCallback(() => {
    routeAbort.current?.abort();
    setRouteState(EMPTY_ROUTE);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      // Deferred rather than called directly in the effect body — React's
      // set-state-in-effect lint rule wants state updates to come from a
      // callback (an external event), not run synchronously during the
      // effect itself, even for this "no geolocation API at all" case.
      const timeout = setTimeout(() => setLocationDenied(true), 0);
      return () => clearTimeout(timeout);
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setLocationDenied(true),
      { timeout: 8000 },
    );
  }, []);

  const denominationOptions = useMemo(
    () => Array.from(new Set(churches.map((c) => c.denomination).filter((d): d is string => !!d))).sort(),
    [churches],
  );

  const withDistance = useMemo(() => {
    if (!userLocation) return churches;
    return churches.map((c) => ({
      ...c,
      distanceMiles:
        c.locationLat !== null && c.locationLng !== null
          ? distanceMiles(userLocation[0], userLocation[1], c.locationLat, c.locationLng)
          : null,
    }));
  }, [churches, userLocation]);

  const filtered = useMemo(() => {
    return withDistance
      .filter((c) => (denomination ? c.denomination === denomination : true))
      .filter((c) => (language ? (c.languages ?? "").toLowerCase().includes(language.toLowerCase()) : true))
      .filter((c) => c.memberCount >= minMembers)
      .filter((c) => (hasEventsOnly ? c.upcomingEventCount > 0 : true))
      .sort((a, b) => {
        if (a.distanceMiles != null && b.distanceMiles != null) return a.distanceMiles - b.distanceMiles;
        if (a.distanceMiles != null) return -1;
        if (b.distanceMiles != null) return 1;
        return 0;
      });
  }, [withDistance, denomination, language, minMembers, hasEventsOnly]);

  return (
    <div className="grid h-full grid-rows-[auto_1fr] lg:grid-cols-[380px_1fr] lg:grid-rows-1">
      <h1 className="sr-only">Discover churches</h1>
      <div className="flex flex-col overflow-hidden border-b border-line bg-surface lg:border-b-0 lg:border-r">
        <div className="space-y-3 border-b border-line p-4">
          {locationDenied && (
            <p className="flex items-center gap-1.5 rounded-lg bg-paper px-3 py-2 text-xs text-ink-muted">
              <NavigationArrow weight="bold" className="size-3.5 shrink-0" />
              Showing all churches. Enable location to sort by distance.
            </p>
          )}
          <select
            aria-label="Filter by denomination"
            value={denomination}
            onChange={(e) => setDenomination(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-base text-ink sm:text-sm transition-brand hover:border-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
          >
            <option value="">All denominations</option>
            {denominationOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by church size"
            value={minMembers}
            onChange={(e) => setMinMembers(Number(e.target.value))}
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-base text-ink sm:text-sm transition-brand hover:border-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
          >
            <option value={0}>Any size</option>
            <option value={3}>3+ members</option>
            <option value={10}>10+ members</option>
            <option value={30}>30+ members</option>
          </select>
          <input
            type="text"
            aria-label="Filter by language spoken"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Language spoken (e.g. Mandarin)"
            className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-base text-ink sm:text-sm placeholder:text-ink-faint transition-brand hover:border-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={hasEventsOnly}
              onChange={(e) => setHasEventsOnly(e.target.checked)}
              className="size-4 rounded border-line-strong text-brand-600"
            />
            <CalendarCheck weight="bold" className="size-4 text-ink-faint" />
            Has upcoming gatherings
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            {filtered.length} {filtered.length === 1 ? "church" : "churches"}
          </p>
          {filtered.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No churches match these filters"
              body="Try widening your search, like allowing any size or clearing the language filter."
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((church) => (
                <li key={church.id}>
                  {/* A plain div, not a <button>: ChurchCard renders real
                    Link/anchor elements for its own actions, and a <button>
                    wrapping an <a> is invalid HTML (and used to make
                    "Visit profile" both navigate and re-select the row).
                    role="button" + a key handler keeps this row keyboard-
                    operable without that nesting. */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(church.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(church.id);
                      }
                    }}
                    className={`w-full cursor-pointer rounded-xl border p-3 text-left transition-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
                      selectedId === church.id ? "border-brand-400 bg-brand-50" : "border-line hover:border-brand-200 hover:bg-paper"
                    }`}
                  >
                    <ChurchCard church={church} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="min-h-[320px]">
        <DiscoverMap
          churches={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          userLocation={userLocation}
          routeState={routeState}
          onRoute={handleRoute}
          onClearRoute={handleClearRoute}
        />
      </div>
    </div>
  );
}
