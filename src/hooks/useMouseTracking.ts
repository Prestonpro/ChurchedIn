"use client";

import { useEffect, useRef, useState } from "react";

type MouseTrackingState = {
  /** Cursor position relative to the tracked element's own bounds,
   * normalized to -1 (left/top edge) .. 1 (right/bottom edge), 0 at center. */
  x: number;
  y: number;
  isHovering: boolean;
};

const IDLE_STATE: MouseTrackingState = { x: 0, y: 0, isHovering: false };

/**
 * Tracks the cursor's normalized position over an element for hover-driven
 * effects (tilt, parallax, magnetic pull). Attach the returned `ref` to the
 * element to track. Always returns IDLE_STATE — no listeners attached at
 * all — when the user prefers reduced motion, so every consumer is safe by
 * construction rather than by remembering to check a flag.
 */
export function useMouseTracking<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [state, setState] = useState<MouseTrackingState>(IDLE_STATE);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const frameRef = useRef<number | null>(null);
  const latestEvent = useRef<MouseEvent | null>(null);

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

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion) return;

    function handleMove(e: MouseEvent) {
      latestEvent.current = e;
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        const ev = latestEvent.current;
        if (!ev || !el) return;
        const rect = el.getBoundingClientRect();
        const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((ev.clientY - rect.top) / rect.height) * 2 - 1;
        setState({ x, y, isHovering: true });
      });
    }
    function handleLeave() {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      setState(IDLE_STATE);
    }

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [prefersReducedMotion]);

  return {
    ref,
    ...(prefersReducedMotion ? IDLE_STATE : state),
    prefersReducedMotion,
  };
}
