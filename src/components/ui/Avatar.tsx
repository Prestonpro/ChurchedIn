"use client";

import { useState } from "react";

const SIZE_CLASSES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
  lg: "size-14 text-base",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  src,
  size = "md",
  className = "",
}: {
  name: string;
  /** A real photo, when the person has set one. Falls back to initials
   * when absent, or if the URL 404s / fails to load at request time — a
   * tester specifically said they'd trust a face more than "a nameless
   * badge", so this only helps if a broken image link doesn't silently
   * regress back to something worse than initials would have shown. */
  src?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      // Arbitrary externally-hosted URLs from a plain "paste a link" field,
      // not an upload, so next/image's optimizer has nothing local to fetch
      // and would just need a remote-pattern allowlist for no real benefit
      // at avatar sizes.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        className={`shrink-0 rounded-full object-cover ${SIZE_CLASSES[size]} ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 ${SIZE_CLASSES[size]} ${className}`}
    >
      {initials(name)}
    </span>
  );
}
