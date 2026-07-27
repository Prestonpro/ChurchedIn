"use client";

import { useState } from "react";
import { CalendarPlus, HandHeart, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/Reveal";
import { FeatureDemo } from "@/components/FeatureDemo";
import { useMouseTracking } from "@/hooks/useMouseTracking";

const MAX_TILT = 8; // deg

// Server Components can't pass component/function references as props to
// Client Components, only serializable data — so page.tsx passes a plain
// string key and this lookup resolves it on the client (same pattern as
// NAV_ICONS in src/components/nav/NavLinks.tsx). FeatureCards looks the icon
// back up from this key on the client side.
const FEATURE_ICONS = {
  calendar: CalendarPlus,
  hand: HandHeart,
  users: UsersThree,
} as const;

export type Feature = {
  iconKey: keyof typeof FEATURE_ICONS;
  title: string;
  body: string;
  /** Shown in the detail modal — concrete specifics, not a restatement of
   * `body`. */
  details: string;
};

/**
 * Feature cards for the landing page. Clicking one pops it open into a
 * modal with the full detail (rather than expanding text inline) — only one
 * open at a time, tracked by index at this level so opening a second card
 * cleanly replaces the first instead of both being open simultaneously.
 */
export function FeatureCards({ features }: { features: Feature[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {features.map((feature, index) => (
        <Reveal key={feature.title} delay={index * 100}>
          <FeatureCard
            feature={feature}
            isOpen={openIndex === index}
            onOpen={() => setOpenIndex(index)}
            onClose={() => setOpenIndex(null)}
          />
        </Reveal>
      ))}
    </div>
  );
}

/** A single feature card — split out from FeatureCards so it can call
 * useMouseTracking (hooks can't be called from an Array.map() callback). */
function FeatureCard({
  feature: { iconKey, title, body, details },
  isOpen,
  onOpen,
  onClose,
}: {
  feature: Feature;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
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
            onClick={onOpen}
            aria-haspopup="dialog"
            className="w-full cursor-pointer text-left"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-brand group-hover:bg-brand-600 group-hover:text-white">
              <IconComponent weight="duotone" className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
          </button>
        </Card>
      </div>

      <Modal open={isOpen} onClose={onClose} title={title} maxWidthClassName="max-w-xl">
        {/* The demo is entirely visual — this keeps the same information
         * available to screen reader users. */}
        <p className="sr-only">{details}</p>
        <FeatureDemo demoKey={iconKey} />
      </Modal>
    </div>
  );
}
