"use client";

import { useMouseTracking } from "@/hooks/useMouseTracking";
import { StepNumber } from "@/components/StepNumber";

const MAX_TILT = 5; // deg — lighter than the feature cards' 8deg; these sit closer together

/** One of the "01/02/03" step cards — same tilt + cursor-spotlight pattern
 * as the feature cards above (mouse-tracked, GPU-only transform/opacity),
 * just a touch more subtle, replacing the plain scale-on-hover. */
export function StepCard({ number, title, body }: { number: string; title: string; body: string }) {
  const { ref, x, y, isHovering } = useMouseTracking<HTMLDivElement>();

  const rotateX = isHovering ? -y * MAX_TILT : 0;
  const rotateY = isHovering ? x * MAX_TILT : 0;
  const spotlightX = ((x + 1) / 2) * 100;
  const spotlightY = ((y + 1) / 2) * 100;

  return (
    <div style={{ perspective: "800px" }} className="h-full">
      <div
        ref={ref}
        className="h-full transition-transform duration-300 ease-out"
        style={{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
      >
        <div className="group relative h-full overflow-hidden rounded-2xl border border-line bg-paper p-6 shadow-card transition-brand hover:border-brand-200 hover:shadow-lifted">
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: isHovering ? 1 : 0,
              background: `radial-gradient(circle at ${spotlightX}% ${spotlightY}%, rgba(255,255,255,0.35), transparent 60%)`,
            }}
          />
          <StepNumber
            value={number}
            className="block text-4xl font-extrabold tabular-nums text-brand-100 transition-brand group-hover:text-brand-400"
          />
          <h3 className="mt-2 text-lg font-bold text-ink">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
        </div>
      </div>
    </div>
  );
}
