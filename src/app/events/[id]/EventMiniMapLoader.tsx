"use client";

import dynamic from "next/dynamic";

const EventMiniMap = dynamic(() => import("./EventMiniMap").then((mod) => mod.EventMiniMap), {
  ssr: false,
  loading: () => <div className="flex h-40 items-center justify-center rounded-xl bg-paper text-xs text-ink-faint">Loading map…</div>,
});

export function EventMiniMapLoader({ lat, lng }: { lat: number; lng: number }) {
  return <EventMiniMap lat={lat} lng={lng} />;
}
