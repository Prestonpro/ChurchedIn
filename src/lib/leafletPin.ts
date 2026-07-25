import L from "leaflet";

/**
 * A small colored circle divIcon — sidesteps Leaflet's classic "default
 * marker icon 404s under a bundler" problem entirely (no image assets to
 * resolve), and doubles as the color-coding the event map's pins need.
 * Shared between the standalone map's pins and the event detail page's
 * single-pin mini-map so both use the same visual language.
 */
export function leafletPin(color: string, size = 20): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:9999px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}
