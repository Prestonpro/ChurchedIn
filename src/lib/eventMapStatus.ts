import { MAP_COLORS } from "@/lib/mapColors";

export type PinStatus = "rsvped" | "available" | "almost-full" | "full";

/** Solid hex colors for the Leaflet divIcon pins — kept as real hex (not
 * Tailwind classes) since the color is injected into a raw HTML string
 * handed to Leaflet, outside Tailwind's class-scanning reach. "rsvped" uses
 * the app's own brand teal (it's a "you" signal, not a stoplight status);
 * the other three are a conventional green/amber/red availability read,
 * which stays outside the brand palette on purpose. */
export const PIN_STATUS_COLOR: Record<PinStatus, string> = {
  rsvped: MAP_COLORS.brand600,
  available: "#16a34a",
  "almost-full": "#ca8a04",
  full: "#dc2626",
};

export const PIN_STATUS_LABEL: Record<PinStatus, string> = {
  rsvped: "You're going",
  available: "Spots available",
  "almost-full": "Almost full",
  full: "Full",
};

/** Fraction of capacity filled for one RSVP role bucket. A cap of `null`
 * (uncapped) or `0` ("not accepting this role at all," per the existing
 * EventForm convention) is excluded from the fullness signal entirely —
 * only a real positive cap counts toward "almost full"/"full", so an event
 * that's merely not accepting helpers doesn't read as globally full when
 * students can still freely RSVP. */
function fractionFilled(confirmed: number, cap: number | null): number {
  if (cap === null || cap <= 0) return 0;
  return confirmed / cap;
}

/**
 * The map pin's color/status for one event, from the current viewer's
 * point of view. "You've RSVP'd" always wins over the capacity signal —
 * it's about the viewer's relationship to the event, not the event's
 * general availability.
 */
export function eventPinStatus(event: {
  confirmedAttendees: number;
  studentCap: number | null;
  confirmedHelpers: number;
  volunteerCap: number | null;
  hasMyRsvp: boolean;
}): PinStatus {
  if (event.hasMyRsvp) return "rsvped";

  const fraction = Math.max(
    fractionFilled(event.confirmedAttendees, event.studentCap),
    fractionFilled(event.confirmedHelpers, event.volunteerCap),
  );
  if (fraction >= 1) return "full";
  if (fraction >= 0.8) return "almost-full";
  return "available";
}
