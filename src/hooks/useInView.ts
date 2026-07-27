"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reports whether an element is currently in the viewport, for
 * scroll-triggered reveal animations. Replays every time — leaving the
 * viewport resets it, so scrolling back re-triggers the reveal, matching
 * how these animations read on most sites. Reveals immediately (no
 * observer) under prefers-reduced-motion.
 */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timeout = setTimeout(() => {
        setPrefersReducedMotion(true);
        setIsInView(true);
      }, 0);
      return () => clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView, prefersReducedMotion };
}
