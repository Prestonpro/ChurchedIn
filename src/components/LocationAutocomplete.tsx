"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Icon } from "@phosphor-icons/react";
import { MapPin } from "@phosphor-icons/react/dist/ssr";

export type GeocodeResult = { label: string; lat: number; lng: number };

// Nominatim (OpenStreetMap's free geocoder) — no API key, matching the
// app's existing Leaflet/OSM map stack. Its usage policy asks for at most
// ~1 request/second and an identifying Referer, which the browser already
// sends on every cross-origin fetch — the debounce below is what actually
// keeps us under that rate.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;

/**
 * A plain text field that also searches Nominatim as the visitor types and
 * offers real addresses in a dropdown. Selecting one fills the text *and*
 * (if `onSelect` is given) hands back real coordinates — LocationPicker
 * uses that to drop a map pin; a plain destination field like
 * RideRequestForm's just ignores it and gets a better-filled text value.
 *
 * Deliberately still a plain text input under the hood (not a `<select>`
 * or a combobox library) — the visitor can always just type an address
 * that never matches a suggestion and submit that instead. Suggestions are
 * a convenience, never a requirement.
 */
export function LocationAutocomplete({
  label,
  name,
  icon: IconComponent = MapPin,
  value,
  onChange,
  onSelect,
  placeholder,
  hint,
  required,
}: {
  label: string;
  name: string;
  icon?: Icon;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: GeocodeResult) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // Bumped on every keystroke so a slow, stale response can recognize it's
  // no longer the latest request and skip updating state — otherwise a
  // fast second keystroke's results could be overwritten a moment later by
  // the first keystroke's slower response landing after it.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const query = value.trim();
    if (query.length < MIN_QUERY_LENGTH) {
      // Deferred via setTimeout(fn, 0), not called straight from the effect
      // body — `react-hooks/set-state-in-effect` is an ESLint error here,
      // and ESLint errors fail the Vercel build.
      const clearSuggestionsTimeout = setTimeout(() => setSuggestions([]), 0);
      return () => clearTimeout(clearSuggestionsTimeout);
    }
    const thisRequestId = ++requestIdRef.current;
    const timeout = setTimeout(() => {
      const url = `${NOMINATIM_URL}?format=json&limit=5&q=${encodeURIComponent(query)}`;
      fetch(url)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: Array<{ display_name: string; lat: string; lon: string }>) => {
          if (thisRequestId !== requestIdRef.current) return;
          setSuggestions(
            data.map((d) => ({ label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) })),
          );
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch(() => {
          // A network hiccup just means no suggestions for this keystroke —
          // the field is still a normal text input either way.
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [value]);

  function pick(result: GeocodeResult) {
    onChange(result.label);
    onSelect?.(result);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <label className="relative block space-y-1.5">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      <div className="relative">
        <IconComponent
          weight="bold"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
        />
        <input
          className="w-full min-h-11 rounded-lg border border-line-strong bg-white px-3.5 py-2.5 pl-10 text-base text-ink placeholder:text-ink-faint transition-brand hover:border-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:text-sm"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          // The delay lets a suggestion's own onMouseDown/onClick fire
          // first when the visitor clicks one — without it, blur would
          // close the dropdown before the click on it registers.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={`${name}-suggestions`}
        />
      </div>
      {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      {open && suggestions.length > 0 && (
        <ul
          id={`${name}-suggestions`}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-white shadow-lifted"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lng}`} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className={`block w-full px-3.5 py-2 text-left text-sm ${
                  i === activeIndex ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-paper"
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
