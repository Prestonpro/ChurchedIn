"use client";

import { useEffect, useState } from "react";
import { Polyline, Marker, useMap } from "react-leaflet";
import { leafletPin } from "@/lib/leafletPin";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { MAP_COLORS } from "@/lib/mapColors";
import type { DrivingRoute } from "@/lib/routing";

const DRAW_DURATION_MS = 1600;
const CASING_COLOR = "#ffffff";
const ROUTE_COLOR = MAP_COLORS.brand600;

/**
 * Draws the route progressively so pressing "Route" reads as the map working
 * something out, the way a maps app animates a freshly-computed trip. The
 * drawn head carries a dot so there's something to follow while it runs.
 *
 * Rendered with a `key` tied to the route by its parent, so a new route
 * remounts this and replays from the start rather than animating from
 * whatever the previous route's progress happened to be.
 */
export function RouteLayer({ route }: { route: DrivingRoute }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const map = useMap();
  // Starts at the first segment so the line grows in rather than flashing
  // complete for a frame first; the reduced-motion branch below jumps
  // straight to the full path instead.
  const [visibleCount, setVisibleCount] = useState(2);

  useEffect(() => {
    // Extra bottom room so the trip doesn't run underneath RouteSummary's
    // ETA card, which is pinned over the lower edge of the map.
    map.fitBounds(route.path, { paddingTopLeft: [48, 48], paddingBottomRight: [48, 150] });
  }, [route, map]);

  useEffect(() => {
    const total = route.path.length;

    if (prefersReducedMotion) {
      // Deferred rather than set in the effect body, per the same
      // set-state-in-effect rule the other hooks in here work around.
      const timeout = setTimeout(() => setVisibleCount(total), 0);
      return () => clearTimeout(timeout);
    }

    // No "already animated" guard on purpose: a ref-based one survives
    // StrictMode's dev-only effect double-invoke, so the second (real) run
    // would bail and the route would render complete without ever drawing.
    let frame = 0;
    let start: number | null = null;

    function tick(now: number) {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / DRAW_DURATION_MS);
      // Ease-out so it decelerates into the destination instead of stopping flat.
      const eased = 1 - Math.pow(1 - t, 3);
      setVisibleCount(Math.max(2, Math.round(eased * total)));
      if (t < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [route, prefersReducedMotion]);

  const drawn = route.path.slice(0, visibleCount);
  const head = drawn[drawn.length - 1];
  const stillDrawing = visibleCount < route.path.length;

  return (
    <>
      {/* Wider white line under the blue one — the standard map-route "casing"
          that keeps the path legible over dark tiles and busy streets. */}
      <Polyline positions={drawn} pathOptions={{ color: CASING_COLOR, weight: 9, opacity: 0.9 }} />
      <Polyline positions={drawn} pathOptions={{ color: ROUTE_COLOR, weight: 5, opacity: 1 }} />
      {stillDrawing && head && <Marker position={head} icon={leafletPin(ROUTE_COLOR, 12)} />}
    </>
  );
}
