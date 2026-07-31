/**
 * Hex equivalents of the app's design tokens (globals.css), for the handful of
 * places that need a literal color string rather than a Tailwind class: Leaflet
 * divIcon markers and polylines are raw HTML/canvas painted outside Tailwind's
 * class-scanning reach, the same reason emailLayout.ts keeps its own hex
 * constants. Keep these in sync with globals.css's `@theme` block by hand —
 * there's no shared source of truth between a CSS custom property and a JS
 * string.
 */
export const MAP_COLORS = {
  /** --color-brand-600 — "this is mine/me" (an RSVP'd pin, my own route line). */
  brand600: "#409688",
  /** --color-ink — a neutral marker (the viewer's own location), not events. */
  ink: "#2b2420",
} as const;
