"use client";

import Link from "next/link";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { PIN_STATUS_COLOR, PIN_STATUS_LABEL } from "@/lib/eventMapStatus";
import type { MapEvent } from "./EventMapClient";

/** Rendered inside a Leaflet Popup — kept as plain, mostly-Tailwind markup
 * (Leaflet's popup wrapper isn't a React portal into our page's normal DOM
 * tree in terms of stacking context, but Tailwind's utility classes still
 * apply fine since they're just CSS). Glassmorphism here specifically
 * (blurred, translucent) since the brief calls for it on the map's
 * overlays — a deliberate departure from the app's usual opaque Card. */
export function EventPopupCard({
  event,
  onRsvp,
  rsvpPending,
  rsvpError,
}: {
  event: MapEvent;
  onRsvp: (eventId: string) => void;
  rsvpPending: boolean;
  /** Only set when this is the popup the last RSVP attempt was made from — see
   * LeafletMap. RSVPing here used to discard the action's result entirely, so
   * a full/cancelled event or a blocked pair saw the button go idle again with
   * no visible outcome. */
  rsvpError?: string;
}) {
  const style = categoryStyle(event.category);
  const startsAt = new Date(event.startsAt);
  const canRsvp = !event.hasMyRsvp && event.pinStatus !== "full";

  return (
    <div className="w-56 rounded-xl border border-white/10 bg-ink/85 p-3.5 text-white backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.chipClass}`}>
          {style.label}
        </span>
        <span className="text-[11px] font-semibold" style={{ color: PIN_STATUS_COLOR[event.pinStatus] }}>
          {PIN_STATUS_LABEL[event.pinStatus]}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-bold leading-snug">{event.title}</h3>
      <p className="mt-1 text-xs text-white/70">
        {startsAt.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" })}
        {" · "}
        {startsAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
      </p>
      <p className="mt-0.5 truncate text-xs text-white/60">{event.location}</p>

      <div className="mt-3 space-y-2 rounded-lg bg-white/5 p-2">
        <CapacityBar label="Attending" count={event.confirmedAttendees} cap={event.studentCap} />
        <CapacityBar label="Helping" count={event.confirmedHelpers} cap={event.volunteerCap} />
      </div>

      {rsvpError && (
        <p className="mt-2 rounded-lg border border-danger/30 bg-danger-soft/90 px-2.5 py-1.5 text-xs font-medium text-danger">
          {rsvpError}
        </p>
      )}

      <div className="mt-3 flex gap-1.5">
        <Link
          href={`/events/${event.id}`}
          className="flex-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-center text-xs font-semibold text-white transition-brand hover:bg-white/20"
        >
          View event
        </Link>
        {canRsvp && (
          <button
            type="button"
            disabled={rsvpPending}
            onClick={() => onRsvp(event.id)}
            className="flex-1 rounded-lg bg-brand-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-brand hover:bg-brand-600 disabled:opacity-50"
          >
            {rsvpPending ? "…" : "RSVP"}
          </button>
        )}
      </div>
    </div>
  );
}
