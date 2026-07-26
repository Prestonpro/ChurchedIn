"use client";

import dynamic from "next/dynamic";

const MiniMap = dynamic(() => import("./MiniMap").then((mod) => mod.MiniMap), {
  ssr: false,
  loading: () => <div className="flex h-40 items-center justify-center rounded-xl bg-paper text-xs text-ink-faint">Loading map…</div>,
});

export function MiniMapLoader({ lat, lng }: { lat: number; lng: number }) {
  return <MiniMap lat={lat} lng={lng} />;
}
