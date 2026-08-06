"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { leafletPin } from "@/lib/leafletPin";
import { MAP_COLORS } from "@/lib/mapColors";

const LIGHT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Continental-US-ish center so a brand-new event (no prior coordinates)
// opens on a reasonable default view instead of the middle of the ocean.
const DEFAULT_CENTER: [number, number] = [39.5, -98.35];

function ClickToPlacePin({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** MapContainer's `center`/`zoom` props only apply once, at mount — moving
 * them afterward (e.g. picking a Nominatim autocomplete suggestion far
 * from the current view) needs the imperative map instance instead. Skips
 * the first render since `center`/`zoom` already placed the initial view;
 * without that guard this would immediately re-run the same move on mount. */
function RecenterOnChange({ lat, lng }: { lat?: number | null; lng?: number | null }) {
  const map = useMap();
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (lat != null && lng != null) {
      map.setView([lat, lng], 14);
    }
  }, [lat, lng, map]);
  return null;
}

export function PinDropMap({
  lat,
  lng,
  onPick,
}: {
  lat?: number | null;
  lng?: number | null;
  onPick: (lat: number, lng: number) => void;
}) {
  const hasPin = lat != null && lng != null;
  const center: [number, number] = hasPin ? [lat, lng] : DEFAULT_CENTER;

  return (
    <MapContainer center={center} zoom={hasPin ? 14 : 4} scrollWheelZoom={false} className="h-48 w-full rounded-xl">
      <TileLayer url={LIGHT_TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ClickToPlacePin onPick={onPick} />
      <RecenterOnChange lat={lat} lng={lng} />
      {hasPin && <Marker position={[lat, lng]} icon={leafletPin(MAP_COLORS.brand600)} />}
    </MapContainer>
  );
}
