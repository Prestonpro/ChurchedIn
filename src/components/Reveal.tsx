"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"; // same spring-like ease-out as transition-brand

// "variant" rather than a plain "direction" since one of these (icon) isn't
// directional at all — it's a scale+rotate pop, not a translate.
const VARIANTS = {
  /** Default: rises + scales up slightly — for cards and general content. */
  up: { hidden: "translateY(24px) scale(0.95)", visible: "translateY(0) scale(1)" },
  /** Section headings — a horizontal motion to contrast with the cards'
   * vertical rise. */
  left: { hidden: "translateX(-32px)", visible: "translateX(0)" },
  /** Standalone icons — a playful scale+rotate pop. */
  icon: { hidden: "scale(0.5) rotate(-15deg)", visible: "scale(1) rotate(0deg)" },
} as const;

/**
 * Fades + animates content into place the first time it scrolls into view.
 * A Server Component page can still render this directly — Server Component
 * output is valid `children` for a Client Component boundary.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  const { hidden, visible } = VARIANTS[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? visible : hidden,
        transition: `opacity 600ms ${EASE} ${delay}ms, transform 600ms ${EASE} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
