"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";

const PinDropMap = dynamic(() => import("./PinDropMap").then((mod) => mod.PinDropMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded-xl bg-paper text-xs text-ink-faint">
      Loading map…
    </div>
  ),
});

/**
 * Optional add-on to a required plain-text location field elsewhere in the
 * form — feeds a map view + a detail page's mini-map. The address field
 * searches Nominatim as you type (see LocationAutocomplete); picking a
 * suggestion fills the text and drops the pin at its real coordinates, but
 * typing a plain address that never matches anything and clicking the map
 * by hand still works exactly as before. Shared between event creation
 * (/volunteer/events/new) and church creation (/churches/new) — both need
 * identically-shaped "address text + drop a pin" inputs.
 */
export function LocationPicker({
  title = "Add to the map (optional)",
  helpText = "Shows up as a pin on the map so people can find it visually.",
  defaultAddress,
  defaultLat,
  defaultLng,
}: {
  title?: string;
  helpText?: string;
  defaultAddress?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
}) {
  const [address, setAddress] = useState(defaultAddress ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    defaultLat != null && defaultLng != null ? { lat: defaultLat, lng: defaultLng } : null,
  );

  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <div>
        <p className="text-sm font-semibold text-ink-soft">{title}</p>
        <p className="text-xs text-ink-muted">{helpText}</p>
      </div>
      <LocationAutocomplete
        label="Map address"
        name="address"
        icon={MapPin}
        placeholder="123 Main St, Springfield"
        value={address}
        onChange={setAddress}
        onSelect={(result) => setCoords({ lat: result.lat, lng: result.lng })}
      />
      <div>
        <p className="mb-1.5 text-sm font-semibold text-ink-soft">Drop a pin</p>
        <PinDropMap lat={coords?.lat} lng={coords?.lng} onPick={(lat, lng) => setCoords({ lat, lng })} />
        <p className="mt-1.5 text-xs text-ink-faint">
          {coords ? `Pin set at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}. Click elsewhere to move it.` : "Click the map to drop a pin."}
        </p>
      </div>
      <input type="hidden" name="locationLat" value={coords?.lat ?? ""} />
      <input type="hidden" name="locationLng" value={coords?.lng ?? ""} />
    </div>
  );
}
