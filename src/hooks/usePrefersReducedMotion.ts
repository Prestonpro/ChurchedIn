"use client";

import { useEffect, useState } from "react";

/** Small shared check for the feature demos' auto-play timelines — under
 * reduced motion they skip straight to the settled end state instead of
 * running the animated sequence. */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timeout = setTimeout(() => setPrefersReducedMotion(query.matches), 0);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => {
      clearTimeout(timeout);
      query.removeEventListener("change", onChange);
    };
  }, []);

  return prefersReducedMotion;
}
