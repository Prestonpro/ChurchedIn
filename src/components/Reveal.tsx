"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"; // same spring-like ease-out as transition-brand

/**
 * Fades + rises content into place the first time it scrolls into view.
 * A Server Component page can still render this directly — Server Component
 * output is valid `children` for a Client Component boundary.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 600ms ${EASE} ${delay}ms, transform 600ms ${EASE} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
