"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { leafletPin } from "@/lib/leafletPin";

const LIGHT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * A small, lightly-interactive map preview for the event detail page — a
 * single pin, no popup, no fly-to. Panning/zoom buttons still work (so a
 * viewer can get their bearings without leaving the page), but scroll-wheel
 * zoom is off so the map doesn't hijack the page's own scroll.
 */
export function EventMiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      scrollWheelZoom={false}
      className="h-40 w-full rounded-xl"
    >
      <TileLayer url={LIGHT_TILE_URL} attribution={TILE_ATTRIBUTION} />
      <Marker position={[lat, lng]} icon={leafletPin("#2563eb")} />
    </MapContainer>
  );
}
