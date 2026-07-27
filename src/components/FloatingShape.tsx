"use client";

import { useScrollOffset } from "@/hooks/useScrollOffset";

/**
 * A single ambient decorative circle with the existing CSS float loop, plus
 * a scroll-linked parallax drift (a different rate per shape creates
 * depth). Small client component so page.tsx can stay a Server Component
 * while still rendering scroll-reactive decoration.
 */
export function FloatingShape({
  position,
  size,
  tone,
  delay = "0s",
  scrollSpeed = 0.05,
  scrollMax = 40,
  strong = false,
}: {
  position: string;
  size: string;
  tone: string;
  delay?: string;
  scrollSpeed?: number;
  /** Clamp for the scroll-linked offset — raise alongside `strong` so the
   * bigger float doesn't get cut off by the section's own overflow-hidden
   * boundary; give the shape's own position enough margin to match. */
  scrollMax?: number;
  /** A bigger float-loop amplitude for shapes with more open space to move
   * in — see .animate-float-strong in globals.css. */
  strong?: boolean;
}) {
  const offset = useScrollOffset(scrollSpeed, scrollMax);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${position} transition-transform duration-300 ease-out`}
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div
        className={`${size} ${strong ? "animate-float-strong" : "animate-float-gentle"} rounded-full ${tone}`}
        style={{ animationDelay: delay }}
      />
    </div>
  );
}
