"use client";

import { useState } from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { useMouseTracking } from "@/hooks/useMouseTracking";
import { StepNumber } from "@/components/StepNumber";
import { Modal } from "@/components/ui/Modal";
import { StepDemo } from "@/components/StepDemo";

const MAX_TILT = 5; // deg — lighter than the feature cards' 8deg; these sit closer together

type StepDemoKey = "startJoin" | "shareBrowse" | "connect";

/** One of the "01/02/03" step cards — same tilt + cursor-spotlight pattern
 * as the feature cards above, and now the same "click to see a live demo"
 * behavior too: clicking pops open a modal walking through that step. */
export function StepCard({
  number,
  demoKey,
  title,
  body,
}: {
  number: string;
  demoKey: StepDemoKey;
  title: string;
  body: string;
}) {
  const { ref, x, y, isHovering } = useMouseTracking<HTMLDivElement>();
  const [isOpen, setIsOpen] = useState(false);

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
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          className="group relative h-full w-full cursor-pointer overflow-hidden rounded-2xl border border-line bg-paper p-6 text-left shadow-card transition-brand hover:border-brand-200 hover:shadow-lifted"
        >
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
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-transform duration-200 group-hover:translate-x-1">
            See it in action <ArrowRight weight="bold" className="size-3.5" />
          </span>
        </button>
      </div>

      <Modal open={isOpen} onClose={() => setIsOpen(false)} title={title} maxWidthClassName="max-w-xl">
        <p className="sr-only">{body}</p>
        <StepDemo demoKey={demoKey} />
      </Modal>
    </div>
  );
}
