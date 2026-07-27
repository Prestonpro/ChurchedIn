"use client";

import { useEffect, useState } from "react";
import { PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const PROFILES = [
  { name: "Yuki Tanaka", flag: "🇯🇵", interest: "Cooking" },
  { name: "Carlos Mendez", flag: "🇲🇽", interest: "Basketball" },
  { name: "Amara Okafor", flag: "🇳🇬", interest: "Photography" },
];

const HIGHLIGHT_INDEX = 1;

function wait(ms: number, timeouts: ReturnType<typeof setTimeout>[]) {
  return new Promise<void>((resolve) => {
    timeouts.push(setTimeout(resolve, ms));
  });
}

/** Live animated mockup of finding a friend: profile cards stagger in, one
 * highlights, a "Reach out" button appears, a note slides open, then the
 * card shifts into a sent/pending state. */
export function FriendDemo({ playKey }: { playKey: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visibleCount, setVisibleCount] = useState(0);
  const [highlighted, setHighlighted] = useState(false);
  const [showReachOut, setShowReachOut] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const kickoff = setTimeout(() => {
      setVisibleCount(0);
      setHighlighted(false);
      setShowReachOut(false);
      setShowNote(false);
      setSent(false);

      if (prefersReducedMotion) {
        setVisibleCount(PROFILES.length);
        setHighlighted(true);
        setShowReachOut(true);
        setShowNote(true);
        setSent(true);
        return;
      }

      (async () => {
        await wait(200, timeouts);
        for (let i = 1; i <= PROFILES.length; i++) {
          if (cancelled) return;
          setVisibleCount(i);
          await wait(180, timeouts);
        }
        await wait(400, timeouts);
        if (cancelled) return;
        setHighlighted(true);
        await wait(500, timeouts);
        if (cancelled) return;
        setShowReachOut(true);
        await wait(900, timeouts);
        if (cancelled) return;
        setShowNote(true);
        await wait(1100, timeouts);
        if (cancelled) return;
        setSent(true);
      })();
    }, 0);
    timeouts.push(kickoff);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [playKey, prefersReducedMotion]);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        {PROFILES.map((profile, i) => {
          const isHighlighted = highlighted && i === HIGHLIGHT_INDEX;
          return (
            <div
              key={profile.name}
              className="transition-all duration-300"
              style={{
                opacity: i < visibleCount ? 1 : 0,
                transform: i < visibleCount ? "translateY(0) scale(1)" : "translateY(10px) scale(0.9)",
              }}
            >
              <div
                className={`relative rounded-xl border bg-surface p-3 text-center shadow-card transition-brand ${
                  isHighlighted ? "border-brand-300 shadow-lifted" : "border-line"
                }`}
              >
                {isHighlighted && sent && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-success text-white">
                    <CheckCircle weight="fill" className="size-3.5" />
                  </span>
                )}
                <Avatar name={profile.name} size="sm" className="mx-auto" />
                <p className="mt-1.5 truncate text-xs font-semibold text-ink">{profile.name.split(" ")[0]}</p>
                <p className="truncate text-[11px] text-ink-faint">
                  {profile.flag} {profile.interest}
                </p>
                {isHighlighted && showReachOut && !sent && (
                  <button
                    type="button"
                    className="mt-2 w-full cursor-pointer rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white transition-brand hover:bg-brand-700"
                  >
                    Reach out
                  </button>
                )}
                {isHighlighted && sent && (
                  <Badge tone="success" className="mt-2 w-full justify-center">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="mt-2.5 grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: showNote ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="rounded-xl border border-line bg-paper p-3">
            {!sent ? (
              <p className="text-xs italic text-ink-muted">&quot;Hey! Would love to grab coffee sometime.&quot;</p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
                <PaperPlaneTilt weight="fill" className="size-3.5" /> Request sent ✓
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
