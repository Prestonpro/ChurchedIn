"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import { Field } from "@/components/ui/Field";

const PinDropMap = dynamic(() => import("./PinDropMap").then((mod) => mod.PinDropMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded-xl bg-paper text-xs text-ink-faint">
      Loading map…
    </div>
  ),
});

/**
 * Optional add-on to the required `location` text field above it — feeds
 * the event map (/events/map) and the detail page's mini-map. Deliberately
 * a separate address string, not reused from `location`: this one is
 * paired with a lat/lng pin, and geocoding an arbitrary free-text address
 * into coordinates would need an external geocoding API (out of scope for
 * a "no API key" feature, per the brief).
 */
export function LocationPicker({
  defaultAddress,
  defaultLat,
  defaultLng,
}: {
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
        <p className="text-sm font-semibold text-ink-soft">Add to the event map (optional)</p>
        <p className="text-xs text-ink-muted">
          Shows this gathering as a pin on the event map so people can find it visually.
        </p>
      </div>
      <Field
        label="Map address"
        name="address"
        icon={MapPin}
        placeholder="123 Main St, Springfield"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <div>
        <p className="mb-1.5 text-sm font-semibold text-ink-soft">Drop a pin</p>
        <PinDropMap lat={coords?.lat} lng={coords?.lng} onPick={(lat, lng) => setCoords({ lat, lng })} />
        <p className="mt-1.5 text-xs text-ink-faint">
          {coords ? `Pin set at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} — click elsewhere to move it.` : "Click the map to drop a pin."}
        </p>
      </div>
      <input type="hidden" name="locationLat" value={coords?.lat ?? ""} />
      <input type="hidden" name="locationLng" value={coords?.lng ?? ""} />
    </div>
  );
}
