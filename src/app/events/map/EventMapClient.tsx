"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretLeft, CaretRight, MapPin, Rows, CalendarDots } from "@phosphor-icons/react/dist/ssr";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { PIN_STATUS_COLOR, PIN_STATUS_LABEL, type PinStatus } from "@/lib/eventMapStatus";
import { rsvpToEventAction } from "@/lib/actions/rsvps";
import { EVENT_CATEGORY_LABELS, type EventCategory } from "@/lib/constants";

const LeafletMap = dynamic(() => import("./LeafletMap").then((mod) => mod.LeafletMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-ink text-sm text-white/60">Loading map…</div>
  ),
});

export type MapEvent = {
  id: string;
  title: string;
  category: EventCategory;
  startsAt: string;
  location: string;
  lat: number;
  lng: number;
  studentCap: number | null;
  volunteerCap: number | null;
  confirmedAttendees: number;
  confirmedHelpers: number;
  hasMyRsvp: boolean;
  pinStatus: PinStatus;
};

export function EventMapClient({ events }: { events: MapEvent[] }) {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [hasSpotsOnly, setHasSpotsOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const [rsvpError, setRsvpError] = useState<string | undefined>(undefined);

  const filtered = useMemo(() => {
    return events
      .filter((e) => (category ? e.category === category : true))
      .filter((e) => (mineOnly ? e.hasMyRsvp : true))
      .filter((e) => (hasSpotsOnly ? e.pinStatus !== "full" : true));
  }, [events, category, mineOnly, hasSpotsOnly]);

  function handleRsvp(eventId: string) {
    setRsvpError(undefined);
    startTransition(async () => {
      const result = await rsvpToEventAction(eventId);
      if (result && "error" in result) {
        // The result was previously discarded entirely, so a full/cancelled
        // event, a non-member, or a blocked pair saw the spinner end with no
        // visible change at all.
        setRsvpError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="relative h-full w-full">
      <LeafletMap
        events={filtered}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onRsvp={handleRsvp}
        rsvpPending={pending}
        rsvpError={rsvpError}
      />

      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className="absolute left-3 top-3 z-[1000] flex size-9 items-center justify-center rounded-lg border border-white/10 bg-ink/85 text-white backdrop-blur-md transition-brand hover:bg-ink/95 sm:hidden"
        aria-label={sidebarOpen ? "Hide event list" : "Show event list"}
      >
        {sidebarOpen ? <CaretLeft weight="bold" className="size-4" /> : <CaretRight weight="bold" className="size-4" />}
      </button>

      <div
        className={`absolute inset-y-0 left-0 z-[999] flex w-[300px] max-w-[85vw] flex-col border-r border-white/10 bg-ink/85 text-white backdrop-blur-md transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="hidden items-center justify-between border-b border-white/10 px-4 py-3 sm:flex">
          <h1 className="font-bold">Event map</h1>
          <div className="flex items-center gap-1">
            <Link
              href="/events"
              title="List view"
              className="flex size-7 items-center justify-center rounded-lg text-white/60 transition-brand hover:bg-white/10 hover:text-white"
            >
              <Rows weight="bold" className="size-4" />
            </Link>
            <Link
              href="/events/calendar"
              title="Calendar view"
              className="flex size-7 items-center justify-center rounded-lg text-white/60 transition-brand hover:bg-white/10 hover:text-white"
            >
              <CalendarDots weight="bold" className="size-4" />
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="flex size-7 items-center justify-center rounded-lg text-white/60 transition-brand hover:bg-white/10 hover:text-white"
              aria-label="Hide event list"
            >
              <CaretLeft weight="bold" className="size-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 border-b border-white/10 p-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]"
          >
            <option value="">All categories</option>
            {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
              className="size-4 rounded border-white/20 bg-white/5 text-brand-500"
            />
            My RSVP&apos;d events
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasSpotsOnly}
              onChange={(e) => setHasSpotsOnly(e.target.checked)}
              className="size-4 rounded border-white/20 bg-white/5 text-brand-500"
            />
            Has spots available
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <MapPin weight="bold" className="size-6 text-white/30" />
              <p className="text-sm font-semibold text-white/70">No events match these filters</p>
              <p className="text-xs text-white/50">Try a different category or clear the filters above.</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {filtered.map((event) => {
                const style = categoryStyle(event.category);
                const startsAt = new Date(event.startsAt);
                const isSelected = event.id === selectedId;
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(event.id)}
                      className={`flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-brand ${
                        isSelected ? "bg-white/15" : "hover:bg-white/10"
                      }`}
                    >
                      <span
                        className="mt-1 flex size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PIN_STATUS_COLOR[event.pinStatus] }}
                        title={PIN_STATUS_LABEL[event.pinStatus]}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{event.title}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/60">
                          <MapPin weight="bold" className="size-3" />
                          {startsAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          {" · "}
                          {style.label}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
