"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PIN_STATUS_COLOR } from "@/lib/eventMapStatus";
import { leafletPin } from "@/lib/leafletPin";
import { EventPopupCard } from "./EventPopupCard";
import type { MapEvent } from "./EventMapClient";

const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function FlyToSelected({ event }: { event: MapEvent | null }) {
  const map = useMap();
  useEffect(() => {
    if (event) {
      map.flyTo([event.lat, event.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
    }
  }, [event, map]);
  return null;
}

export function LeafletMap({
  events,
  selectedId,
  onSelect,
  onRsvp,
  rsvpPending,
}: {
  events: MapEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRsvp: (eventId: string) => void;
  rsvpPending: boolean;
}) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const selectedEvent = events.find((e) => e.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedId && markerRefs.current[selectedId]) {
      markerRefs.current[selectedId]?.openPopup();
    }
  }, [selectedId]);

  const first = events[0];
  const center: [number, number] = first ? [first.lat, first.lng] : [39.5, -98.35];

  return (
    <MapContainer
      center={center}
      zoom={first ? 12 : 4}
      className="h-full w-full leaflet-popup-dark"
      scrollWheelZoom
      style={{ background: "#1a1a1a" }}
    >
      <TileLayer url={DARK_TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FlyToSelected event={selectedEvent} />
      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lng]}
          icon={leafletPin(PIN_STATUS_COLOR[event.pinStatus], event.id === selectedId ? 26 : 20)}
          eventHandlers={{ click: () => onSelect(event.id) }}
          ref={(ref) => {
            markerRefs.current[event.id] = ref;
          }}
        >
          <Popup minWidth={240} closeButton={false}>
            <EventPopupCard event={event} onRsvp={onRsvp} rsvpPending={rsvpPending} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
