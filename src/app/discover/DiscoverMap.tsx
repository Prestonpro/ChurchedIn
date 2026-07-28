"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { leafletPin } from "@/lib/leafletPin";
import { ChurchCard } from "./ChurchCard";
import type { DiscoverableChurch } from "./DiscoverClient";

const LIGHT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Continental-US-ish fallback when the browser won't share (or hasn't yet
// resolved) the viewer's location.
const DEFAULT_CENTER: [number, number] = [39.5, -98.35];

// Pin color by member-count tier — matches MemberCountBadge's tiers, so the
// map and the cards agree on what "an active, real community" looks like.
function pinColorForMemberCount(memberCount: number): string {
  if (memberCount >= 30) return "#2563eb";
  if (memberCount >= 10) return "#16a34a";
  if (memberCount >= 3) return "#63bbac";
  return "#9ca3af";
}

// Same tiers/order as MemberCountBadge, so the legend, the pins, and the
// badge text all agree on what each color means.
const LEGEND_TIERS = [
  { color: "#2563eb", label: "Large community", sublabel: "30+ members" },
  { color: "#16a34a", label: "Established", sublabel: "10–29 members" },
  { color: "#63bbac", label: "Growing", sublabel: "3–9 members" },
  { color: "#9ca3af", label: "New", sublabel: "0–2 members" },
] as const;

function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border border-line bg-surface/95 p-3 text-xs shadow-card backdrop-blur-sm">
      <p className="mb-1.5 font-bold text-ink">Pin size = community size</p>
      <div className="space-y-1">
        {LEGEND_TIERS.map((tier) => (
          <div key={tier.label} className="flex items-center gap-2">
            <span
              className="inline-block size-3 shrink-0 rounded-full border border-white shadow-sm"
              style={{ background: tier.color }}
            />
            <span className="text-ink-soft">
              {tier.label} <span className="text-ink-faint">· {tier.sublabel}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecenterOnLocation({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 11, { duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

export function DiscoverMap({
  churches,
  selectedId,
  onSelect,
  userLocation,
}: {
  churches: DiscoverableChurch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: [number, number] | null;
}) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const withPins = churches.filter((c) => c.locationLat !== null && c.locationLng !== null);

  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      markerRefs.current[selectedId]?.openPopup();
    }
  }, [selectedId]);

  const first = withPins[0];
  const center: [number, number] = userLocation ?? (first ? [first.locationLat!, first.locationLng!] : DEFAULT_CENTER);

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={userLocation ? 11 : first ? 8 : 4} className="h-full w-full">
        <TileLayer url={LIGHT_TILE_URL} attribution={TILE_ATTRIBUTION} />
        <RecenterOnLocation center={userLocation} />
        {userLocation && (
          <Marker
            position={userLocation}
            icon={leafletPin("#111827", 14)}
          />
        )}
        {withPins.map((church) => (
          <Marker
            key={church.id}
            position={[church.locationLat!, church.locationLng!]}
            icon={leafletPin(pinColorForMemberCount(church.memberCount), church.id === selectedId ? 26 : 20)}
            eventHandlers={{ click: () => onSelect(church.id) }}
            ref={(ref) => {
              markerRefs.current[church.id] = ref;
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              {church.name}
            </Tooltip>
            <Popup minWidth={220}>
              <ChurchCard church={church} compact />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <MapLegend />
    </div>
  );
}
