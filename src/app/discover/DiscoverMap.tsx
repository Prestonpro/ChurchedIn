"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
          <Popup minWidth={220}>
            <ChurchCard church={church} compact />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
