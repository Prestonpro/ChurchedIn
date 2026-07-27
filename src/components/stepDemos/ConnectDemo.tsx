"use client";

import { useEffect, useState } from "react";
import { LockOpen, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

function wait(ms: number, timeouts: ReturnType<typeof setTimeout>[]) {
  return new Promise<void>((resolve) => {
    timeouts.push(setTimeout(resolve, ms));
  });
}

/** Live animated mockup of a reach-out being accepted: an outgoing message,
 * a brief "typing" pause, the accepted reply, then the contact-info reveal
 * — the one moment where email becomes visible, matching the app's actual
 * rule. */
export function ConnectDemo({ playKey }: { playKey: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [showOutgoing, setShowOutgoing] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showIncoming, setShowIncoming] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const kickoff = setTimeout(() => {
      setShowOutgoing(false);
      setShowTyping(false);
      setShowIncoming(false);
      setShowContact(false);

      if (prefersReducedMotion) {
        setShowOutgoing(true);
        setShowIncoming(true);
        setShowContact(true);
        return;
      }

      (async () => {
        await wait(300, timeouts);
        if (cancelled) return;
        setShowOutgoing(true);
        await wait(700, timeouts);
        if (cancelled) return;
        setShowTyping(true);
        await wait(1200, timeouts);
        if (cancelled) return;
        setShowTyping(false);
        setShowIncoming(true);
        await wait(700, timeouts);
        if (cancelled) return;
        setShowContact(true);
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
      <div
        className="flex justify-end transition-all duration-300"
        style={{ opacity: showOutgoing ? 1 : 0, transform: showOutgoing ? "translateY(0)" : "translateY(8px)" }}
      >
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2 text-sm text-white">
          Hi! Would love to grab coffee sometime.
        </div>
      </div>

      <div className="min-h-10">
        {showTyping && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-paper px-3.5 py-2.5">
              <span className="size-1.5 animate-pulse-gentle rounded-full bg-ink-faint" style={{ animationDelay: "0ms" }} />
              <span className="size-1.5 animate-pulse-gentle rounded-full bg-ink-faint" style={{ animationDelay: "150ms" }} />
              <span className="size-1.5 animate-pulse-gentle rounded-full bg-ink-faint" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        {showIncoming && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-paper px-3.5 py-2 text-sm text-ink">
              Sounds great! Accepted your request 🎉
            </div>
          </div>
        )}
      </div>

      <div
        className="flex items-center gap-2 rounded-xl border border-success-soft bg-success-soft px-3.5 py-2.5 transition-all duration-400"
        style={{ opacity: showContact ? 1 : 0, transform: showContact ? "scale(1)" : "scale(0.95)" }}
      >
        <LockOpen weight="fill" className="size-4 shrink-0 text-success" />
        <EnvelopeSimple weight="bold" className="size-4 shrink-0 text-success" />
        <span className="text-sm font-semibold text-success">yuki.tanaka@example.com</span>
      </div>
    </div>
  );
}
