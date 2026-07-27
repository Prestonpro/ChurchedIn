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
}: {
  position: string;
  size: string;
  tone: string;
  delay?: string;
  scrollSpeed?: number;
}) {
  const offset = useScrollOffset(scrollSpeed);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${position} transition-transform duration-300 ease-out`}
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className={`${size} animate-float-gentle rounded-full ${tone}`} style={{ animationDelay: delay }} />
    </div>
  );
}
