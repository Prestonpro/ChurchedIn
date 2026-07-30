"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { leafletPin } from "@/lib/leafletPin";
import { ChurchCard } from "./ChurchCard";
import { RouteLayer } from "./RouteLayer";
import { RouteSummary, type RouteState } from "./RouteSummary";
import type { DiscoverableChurch } from "./DiscoverClient";

const LIGHT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Continental-US-ish fallback when the browser won't share (or hasn't yet
// resolved) the viewer's location.
const DEFAULT_CENTER: [number, number] = [39.5, -98.35];

// Every pin is the same small size regardless of member count — size used
// to scale with it, but that made a handful of huge churches dominate the
// map visually over everything else.
const PIN_SIZE = 14;

// Brand teal for "member count is a map-seed estimate"; accent gold for a
// church with at least one real, signed-up member (see
// listDiscoverableChurches' hasRealMembers) — a simple, self-explanatory
// signal that doesn't need a separate legend.
function pinColor(hasRealMembers: boolean): string {
  return hasRealMembers ? "#e3ab3b" : "#49ab9b";
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
  routeState,
  onRoute,
  onClearRoute,
}: {
  churches: DiscoverableChurch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: [number, number] | null;
  routeState: RouteState;
  onRoute: (church: DiscoverableChurch) => void;
  onClearRoute: () => void;
}) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  // Hovering a marker opens its popup immediately; leaving it (the marker
  // OR the popup content itself) schedules a close a beat later, so
  // moving the cursor from the pin into the popup to click something
  // doesn't slam it shut first.
  const closeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const withPins = churches.filter((c) => c.locationLat !== null && c.locationLng !== null);

  function openNow(id: string) {
    clearTimeout(closeTimers.current[id]);
    markerRefs.current[id]?.openPopup();
  }
  function closeSoon(id: string) {
    clearTimeout(closeTimers.current[id]);
    closeTimers.current[id] = setTimeout(() => markerRefs.current[id]?.closePopup(), 200);
  }

  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      markerRefs.current[selectedId]?.openPopup();
    }
  }, [selectedId]);

  const first = withPins[0];
  const center: [number, number] = userLocation ?? (first ? [first.locationLat!, first.locationLng!] : DEFAULT_CENTER);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={userLocation ? 11 : first ? 8 : 4}
        className="h-full w-full leaflet-popup-card"
      >
        <TileLayer url={LIGHT_TILE_URL} attribution={TILE_ATTRIBUTION} />
        {/* Skipped while a route is on screen, so recentering on the viewer
            doesn't fight RouteLayer's fitBounds over the whole trip. */}
        {!routeState.route && <RecenterOnLocation center={userLocation} />}
        {userLocation && <Marker position={userLocation} icon={leafletPin("#111827", 14)} />}
        {routeState.route && (
          <RouteLayer key={`${routeState.churchId}-${routeState.computedAt?.getTime()}`} route={routeState.route} />
        )}
        {withPins.map((church) => (
          <Marker
            key={church.id}
            position={[church.locationLat!, church.locationLng!]}
            icon={leafletPin(
              pinColor(church.hasRealMembers),
              PIN_SIZE + (church.id === selectedId ? 6 : 0),
            )}
            eventHandlers={{
              click: () => onSelect(church.id),
              mouseover: () => openNow(church.id),
              mouseout: () => closeSoon(church.id),
            }}
            ref={(ref) => {
              markerRefs.current[church.id] = ref;
            }}
          >
            <Popup minWidth={220} closeButton={false}>
              <div onMouseEnter={() => openNow(church.id)} onMouseLeave={() => closeSoon(church.id)}>
                <ChurchCard
                  church={church}
                  compact
                  onRoute={() => {
                    // Close the popup first: Leaflet auto-pans to keep an open
                    // popup in view, which fights RouteLayer's fitBounds and
                    // can shove part of the drawn trip off screen. The ETA
                    // card takes over from here anyway.
                    markerRefs.current[church.id]?.closePopup();
                    onRoute(church);
                  }}
                  routeLoading={routeState.loading && routeState.churchId === church.id}
                />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <RouteSummary state={routeState} userLocation={userLocation} onClear={onClearRoute} />
    </div>
  );
}
