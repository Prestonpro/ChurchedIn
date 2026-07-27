"use client";

import { useEffect, useState } from "react";

/**
 * A small scroll-linked offset (px), rAF-throttled and clamped to `max` so
 * it can never run away on a long page — for a subtle parallax drift on
 * decorative elements, not a real scroll-jacking effect. Disabled entirely
 * under prefers-reduced-motion (stays 0).
 */
export function useScrollOffset(speed: number, max = 40) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame: number | null = null;
    function handleScroll() {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const raw = window.scrollY * speed;
        setOffset(Math.max(-max, Math.min(max, raw)));
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [speed, max]);

  return offset;
}
