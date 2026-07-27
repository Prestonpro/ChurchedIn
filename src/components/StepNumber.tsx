"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";

const SCRAMBLE_FRAMES = 8;
const FRAME_MS = 45;

/** Flickers through a few random 2-digit values before settling on the real
 * one, once it scrolls into view — same viewport-entry trigger as the
 * step card's own Reveal, just a separate observer on this smaller element
 * (both fire within the same frame in practice, no visible desync). */
export function StepNumber({ value, className = "" }: { value: string; className?: string }) {
  const { ref, isInView, prefersReducedMotion } = useInView<HTMLSpanElement>();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      const timeout = setTimeout(() => setDisplay(value), 0);
      return () => clearTimeout(timeout);
    }

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      if (frame >= SCRAMBLE_FRAMES) {
        setDisplay(value);
        clearInterval(interval);
        return;
      }
      setDisplay(String(Math.floor(Math.random() * 90 + 10)));
    }, FRAME_MS);
    return () => clearInterval(interval);
  }, [isInView, prefersReducedMotion, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
