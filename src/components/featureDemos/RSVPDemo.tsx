"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CheckCircle, HandHeart } from "@phosphor-icons/react/dist/ssr";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const CONFETTI = [
  { x: -20, y: -26, delay: 0 },
  { x: 22, y: -20, delay: 40 },
  { x: -6, y: -34, delay: 90 },
  { x: 16, y: -30, delay: 20 },
  { x: 2, y: -38, delay: 60 },
];

function wait(ms: number, timeouts: ReturnType<typeof setTimeout>[]) {
  return new Promise<void>((resolve) => {
    timeouts.push(setTimeout(resolve, ms));
  });
}

/** Live animated mockup of RSVPing: a pulsing button confirms into a
 * checkmark with a small confetti burst, your avatar slides into the
 * attending row, and the headcount bar ticks up — followed by a caption
 * showing what a full gathering's waitlist state looks like instead. */
export function RSVPDemo({ playKey }: { playKey: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [headcount, setHeadcount] = useState(5);
  const [confirmed, setConfirmed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWaitlistNote, setShowWaitlistNote] = useState(false);
  const confirmedRef = useRef(false);

  function confirm() {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    setConfirmed(true);
    setShowConfetti(true);
    setHeadcount(6);
  }

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const kickoff = setTimeout(() => {
      confirmedRef.current = false;
      setHeadcount(5);
      setConfirmed(false);
      setShowConfetti(false);
      setShowWaitlistNote(false);

      if (prefersReducedMotion) {
        confirmedRef.current = true;
        setConfirmed(true);
        setHeadcount(6);
        setShowWaitlistNote(true);
        return;
      }

      (async () => {
        await wait(1400, timeouts);
        if (cancelled) return;
        confirm();
        await wait(1500, timeouts);
        if (cancelled) return;
        setShowWaitlistNote(true);
      })();
    }, 0);
    timeouts.push(kickoff);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [playKey, prefersReducedMotion]);

  return (
    <div className="space-y-3">
      <Card className="bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-ink">Tuesday Study Group</h3>
            <p className="mt-0.5 text-xs text-ink-muted">Tue, Feb 3 · 7:00 PM</p>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={confirm}
              disabled={confirmed}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-brand ${
                confirmed
                  ? "bg-success-soft text-success"
                  : "cursor-pointer bg-brand-600 text-white animate-pulse-gentle hover:bg-brand-700"
              }`}
            >
              {confirmed ? (
                <CheckCircle weight="fill" className="size-4" />
              ) : (
                <HandHeart weight="bold" className="size-4" />
              )}
              {confirmed ? "You're in!" : "RSVP"}
            </button>
            <div className="pointer-events-none absolute inset-0">
              {CONFETTI.map((c, i) => (
                <span
                  key={i}
                  className={`absolute left-1/2 top-1/2 size-1.5 rounded-full bg-accent-500 opacity-0 ${
                    showConfetti ? "animate-confetti-burst" : ""
                  }`}
                  style={
                    {
                      "--confetti-x": `${c.x}px`,
                      "--confetti-y": `${c.y}px`,
                      animationDelay: `${c.delay}ms`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <CapacityBar label="Attending" count={headcount} cap={8} />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <Avatar name="Maria S." size="sm" />
          <Avatar name="Daniel K." size="sm" />
          <Avatar name="Priya R." size="sm" />
          <Avatar name="Tom W." size="sm" />
          <div
            className="transition-all duration-500"
            style={{
              opacity: confirmed ? 1 : 0,
              transform: confirmed ? "translateX(0) scale(1)" : "translateX(-12px) scale(0.6)",
            }}
          >
            <Avatar name="You" size="sm" className="ring-2 ring-brand-300" />
          </div>
        </div>
      </Card>
      <div
        className="flex flex-wrap items-center gap-2 text-xs text-ink-muted transition-opacity duration-500"
        style={{ opacity: showWaitlistNote ? 1 : 0 }}
      >
        <Badge tone="warning">If full, you&apos;d waitlist</Badge>
        <span>Bumped up automatically the moment a spot opens.</span>
      </div>
    </div>
  );
}
