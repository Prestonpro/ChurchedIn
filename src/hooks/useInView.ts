"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reports whether an element has entered the viewport, for scroll-triggered
 * reveal animations. Fires once (unobserves after the first reveal) — a
 * section shouldn't flicker in/out every time the user scrolls past it
 * again. Reveals immediately (no observer) under prefers-reduced-motion.
 */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timeout = setTimeout(() => setIsInView(true), 0);
      return () => clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}
