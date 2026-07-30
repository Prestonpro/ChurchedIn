export type LatLng = [number, number];

export type DrivingRoute = {
  /** Road-following path in Leaflet's [lat, lng] order, ready to hand to a Polyline. */
  path: LatLng[];
  durationSeconds: number;
  distanceMiles: number;
};

const METERS_PER_MILE = 1609.344;

/**
 * OSRM's public demo server — free and keyless, which is why it's here, but
 * it's explicitly a demo instance with no uptime guarantee and it rate-limits
 * heavy callers. Every caller of fetchDrivingRoute has to handle a null
 * return (see RouteSummary's fallback to the Google Maps handoff), so a bad
 * day for this host degrades the feature instead of breaking the map. Swap
 * this base URL for a keyed provider (Mapbox Directions, OpenRouteService,
 * a self-hosted OSRM) if this ever needs to be dependable.
 */
const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/** `driving` returns the fastest route by default, which is what the UI claims. */
export async function fetchDrivingRoute(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<DrivingRoute | null> {
  // OSRM takes lng,lat (GeoJSON order) and returns coordinates the same way,
  // the opposite of Leaflet's lat,lng — the flip on the way out below is the
  // easiest thing in this file to get wrong.
  const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.code !== "Ok") return null;

    const route = data.routes?.[0];
    const rawCoords: unknown = route?.geometry?.coordinates;
    if (!Array.isArray(rawCoords) || rawCoords.length < 2) return null;

    const path = rawCoords
      .filter((p): p is [number, number] => Array.isArray(p) && p.length >= 2)
      .map(([lng, lat]): LatLng => [lat, lng]);
    if (path.length < 2) return null;

    if (typeof route.duration !== "number" || typeof route.distance !== "number") return null;

    return {
      path,
      durationSeconds: route.duration,
      distanceMiles: route.distance / METERS_PER_MILE,
    };
  } catch {
    // Includes the AbortError from superseding an in-flight request, which
    // isn't a failure worth surfacing — the newer request owns the UI now.
    return null;
  }
}

/** "4 min", "38 min", "1 hr 12 min" — matches how a maps app phrases an ETA. */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

/** Clock time the driver would arrive if they left now. */
export function formatArrivalTime(seconds: number, now: Date): string {
  const arrival = new Date(now.getTime() + seconds * 1000);
  return arrival.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function googleMapsDirectionsUrl(to: LatLng, from?: LatLng | null): string {
  const base = `https://www.google.com/maps/dir/?api=1&destination=${to[0]},${to[1]}`;
  return from ? `${base}&origin=${from[0]},${from[1]}` : base;
}
