"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMouseTracking } from "@/hooks/useMouseTracking";

const MAX_SHIFT = 6; // px — how far the button can pull toward the cursor
const PROXIMITY = 100; // px — invisible catch zone around the button

/**
 * Wraps a button/link so it gently pulls toward the cursor when nearby and
 * eases back to rest when it isn't. The pull is JS-driven (useMouseTracking
 * on a padded proximity zone); the direct-hover scale is plain CSS `:hover`
 * on a custom property rather than JS state, so it composes with the JS
 * translate in a single `transform` without fighting it, and can't flicker
 * from the translate shifting the button out from under the cursor mid-hover
 * (a common bug in magnetic-button implementations).
 */
export function MagneticButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { ref, x, y, isHovering } = useMouseTracking<HTMLDivElement>();
  const shiftX = isHovering ? x * MAX_SHIFT : 0;
  const shiftY = isHovering ? y * MAX_SHIFT : 0;

  return (
    <div
      ref={ref}
      className={`inline-flex ${className}`}
      style={{ padding: PROXIMITY, margin: -PROXIMITY }}
    >
      <div
        className="relative z-10 transition-transform duration-300 ease-out hover:[--magnetic-scale:1.03]"
        style={
          {
            "--magnetic-tx": `${shiftX}px`,
            "--magnetic-ty": `${shiftY}px`,
            transform: "translate(var(--magnetic-tx), var(--magnetic-ty)) scale(var(--magnetic-scale, 1))",
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}
