"use client";

import { useEffect, useState } from "react";
import { CalendarPlus } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const TITLE = "Friday Dinner at the Nguyen's";
const GUESTS = ["Maria S.", "Daniel K.", "Priya R.", "Tom W."];

function wait(ms: number, timeouts: ReturnType<typeof setTimeout>[]) {
  return new Promise<void>((resolve) => {
    timeouts.push(setTimeout(resolve, ms));
  });
}

/** Live animated mockup of creating a gathering — the card assembles
 * itself: title types in, category pill pops, headcount bar fills, then
 * guest avatars appear one by one. */
export function GatheringDemo({ playKey }: { playKey: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [titleChars, setTitleChars] = useState(0);
  const [showPill, setShowPill] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [headcount, setHeadcount] = useState(0);
  const [visibleGuests, setVisibleGuests] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const kickoff = setTimeout(() => {
      setTitleChars(0);
      setShowPill(false);
      setShowDate(false);
      setHeadcount(0);
      setVisibleGuests(0);

      if (prefersReducedMotion) {
        setTitleChars(TITLE.length);
        setShowPill(true);
        setShowDate(true);
        setHeadcount(4);
        setVisibleGuests(GUESTS.length);
        return;
      }

      (async () => {
        await wait(300, timeouts);
        for (let i = 1; i <= TITLE.length; i++) {
          if (cancelled) return;
          setTitleChars(i);
          await wait(26, timeouts);
        }
        await wait(250, timeouts);
        if (cancelled) return;
        setShowPill(true);
        await wait(300, timeouts);
        if (cancelled) return;
        setShowDate(true);
        await wait(350, timeouts);
        if (cancelled) return;
        setHeadcount(4);
        await wait(700, timeouts);
        for (let i = 1; i <= GUESTS.length; i++) {
          if (cancelled) return;
          setVisibleGuests(i);
          await wait(150, timeouts);
        }
      })();
    }, 0);
    timeouts.push(kickoff);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [playKey, prefersReducedMotion]);

  return (
    <Card className="relative overflow-hidden bg-surface p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <CalendarPlus weight="duotone" className="size-5" />
        </span>
        <span
          className="inline-flex items-center rounded-full bg-cat-dinner-soft px-2.5 py-1 text-xs font-semibold text-cat-dinner transition-all duration-300"
          style={{ opacity: showPill ? 1 : 0, transform: showPill ? "scale(1)" : "scale(0.6)" }}
        >
          Dinner
        </span>
      </div>
      <h3 className="mt-3 min-h-7 text-base font-bold text-ink">
        {TITLE.slice(0, titleChars)}
        {titleChars > 0 && titleChars < TITLE.length && (
          <span className="animate-pulse-gentle text-brand-400">|</span>
        )}
      </h3>
      <p
        className="mt-1 text-xs text-ink-muted transition-opacity duration-300"
        style={{ opacity: showDate ? 1 : 0 }}
      >
        Fri, Jan 30 · 6:30 PM
      </p>
      <div className="mt-4">
        <CapacityBar label="Attending" count={headcount} cap={8} />
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium text-ink-muted">Who&apos;s coming</p>
        <div className="mt-2 flex gap-1.5">
          {GUESTS.map((name, i) => (
            <div
              key={name}
              className="transition-all duration-300"
              style={{
                opacity: i < visibleGuests ? 1 : 0,
                transform: i < visibleGuests ? "scale(1)" : "scale(0.5)",
              }}
            >
              <Avatar name={name} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
