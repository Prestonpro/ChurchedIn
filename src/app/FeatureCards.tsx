"use client";

import { useState } from "react";
import { CalendarPlus, HandHeart, UsersThree, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { useMouseTracking } from "@/hooks/useMouseTracking";

const MAX_TILT = 8; // deg

// Server Components can't pass component/function references as props to
// Client Components, only serializable data — so page.tsx passes a plain
// string key and this lookup resolves it on the client (same pattern as
// NAV_ICONS in src/components/nav/NavLinks.tsx).
const FEATURE_ICONS = {
  calendar: CalendarPlus,
  hand: HandHeart,
  users: UsersThree,
} as const;

export type Feature = {
  iconKey: keyof typeof FEATURE_ICONS;
  title: string;
  body: string;
  /** Extra depth shown when the card is expanded — concrete specifics,
   * not a restatement of `body`. */
  details: string;
};

/** Click-to-expand feature cards for the landing page. Independently
 * expandable (not accordion-exclusive) since these are peer features, not
 * mutually exclusive options. Click-based rather than hover-based so
 * touch and desktop behave identically. */
export function FeatureCards({ features }: { features: Feature[] }) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  function toggle(index: number) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {features.map((feature, index) => (
        <FeatureCard
          key={feature.title}
          feature={feature}
          isOpen={openIndexes.has(index)}
          onToggle={() => toggle(index)}
          detailId={`feature-detail-${index}`}
        />
      ))}
    </div>
  );
}

/** A single feature card — split out from FeatureCards so it can call
 * useMouseTracking (hooks can't be called from an Array.map() callback). */
function FeatureCard({
  feature: { iconKey, title, body, details },
  isOpen,
  onToggle,
  detailId,
}: {
  feature: Feature;
  isOpen: boolean;
  onToggle: () => void;
  detailId: string;
}) {
  const IconComponent = FEATURE_ICONS[iconKey];
  const { ref, x, y, isHovering } = useMouseTracking<HTMLDivElement>();

  const rotateX = isHovering ? -y * MAX_TILT : 0;
  const rotateY = isHovering ? x * MAX_TILT : 0;
  const spotlightX = ((x + 1) / 2) * 100;
  const spotlightY = ((y + 1) / 2) * 100;

  return (
    <div style={{ perspective: "800px" }}>
      <div
        ref={ref}
        className="transition-transform duration-300 ease-out"
        style={{ transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` }}
      >
        <Card className="group relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: isHovering ? 1 : 0,
              background: `radial-gradient(circle at ${spotlightX}% ${spotlightY}%, rgba(255,255,255,0.35), transparent 60%)`,
            }}
          />
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-controls={detailId}
            className="w-full text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-brand group-hover:bg-brand-600 group-hover:text-white">
                <IconComponent weight="duotone" className="size-6" />
              </span>
              <CaretDown
                weight="bold"
                className={`mt-2 size-4 shrink-0 text-ink-faint transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
            <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
          </button>
          <div
            id={detailId}
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-muted">
                {details}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
