"use client";

import { useEffect, useState } from "react";
import { CalendarBlank, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

// Full literal class names (not built via template fragments like
// `bg-${tone}-soft`) — Tailwind's build-time scanner only picks up
// complete class tokens that appear literally in the source.
const EVENTS = [
  { title: "Coffee Chat", time: "Fri · 3:00 PM", bg: "bg-cat-coffee-soft", text: "text-cat-coffee" },
  { title: "Study Group", time: "Tue · 7:00 PM", bg: "bg-cat-study-soft", text: "text-cat-study" },
];

function wait(ms: number, timeouts: ReturnType<typeof setTimeout>[]) {
  return new Promise<void>((resolve) => {
    timeouts.push(setTimeout(resolve, ms));
  });
}

/** Live animated mockup of browsing a feed of gatherings and RSVPing in a
 * couple of taps — two event cards stagger in, the first highlights as if
 * tapped, then confirms. */
export function ShareBrowseDemo({ playKey }: { playKey: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visibleCount, setVisibleCount] = useState(0);
  const [highlighted, setHighlighted] = useState(false);
  const [rsvped, setRsvped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const kickoff = setTimeout(() => {
      setVisibleCount(0);
      setHighlighted(false);
      setRsvped(false);

      if (prefersReducedMotion) {
        setVisibleCount(EVENTS.length);
        setHighlighted(true);
        setRsvped(true);
        return;
      }

      (async () => {
        await wait(250, timeouts);
        for (let i = 1; i <= EVENTS.length; i++) {
          if (cancelled) return;
          setVisibleCount(i);
          await wait(350, timeouts);
        }
        await wait(500, timeouts);
        if (cancelled) return;
        setHighlighted(true);
        await wait(500, timeouts);
        if (cancelled) return;
        setRsvped(true);
      })();
    }, 0);
    timeouts.push(kickoff);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [playKey, prefersReducedMotion]);

  return (
    <div className="space-y-2.5">
      {EVENTS.map((event, i) => {
        const isFirst = i === 0;
        const isHighlighted = isFirst && highlighted;
        return (
          <div
            key={event.title}
            className="transition-all duration-300"
            style={{
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? "translateY(0)" : "translateY(10px)",
            }}
          >
            <div
              className={`flex items-center justify-between rounded-xl border bg-surface p-4 transition-brand ${
                isHighlighted ? "border-brand-300 shadow-lifted" : "border-line shadow-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex size-9 items-center justify-center rounded-lg ${event.bg} ${event.text}`}>
                  <CalendarBlank weight="duotone" className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">{event.title}</p>
                  <p className="text-xs text-ink-muted">{event.time}</p>
                </div>
              </div>
              {isFirst && rsvped && (
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle weight="fill" className="size-4" /> You&apos;re going!
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
