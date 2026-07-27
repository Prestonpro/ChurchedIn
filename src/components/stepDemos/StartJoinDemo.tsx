"use client";

import { useEffect, useState } from "react";
import { Buildings, Ticket, CheckCircle, Spinner } from "@phosphor-icons/react/dist/ssr";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const CHURCH_NAME = "Grace Community Church";
const JOIN_CODE = "A7K2M9";

function wait(ms: number, timeouts: ReturnType<typeof setTimeout>[]) {
  return new Promise<void>((resolve) => {
    timeouts.push(setTimeout(resolve, ms));
  });
}

/** Live animated mockup of the two ways to get started: creating a church
 * (name types in, admin confirmation) crossfading into joining one with a
 * 6-character code (fills in, verifies, confirms). */
export function StartJoinDemo({ playKey }: { playKey: number }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [scene, setScene] = useState<"create" | "join">("create");
  const [nameChars, setNameChars] = useState(0);
  const [created, setCreated] = useState(false);
  const [codeChars, setCodeChars] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const kickoff = setTimeout(() => {
      setScene("create");
      setNameChars(0);
      setCreated(false);
      setCodeChars(0);
      setVerifying(false);
      setJoined(false);

      if (prefersReducedMotion) {
        setNameChars(CHURCH_NAME.length);
        setCreated(true);
        setScene("join");
        setCodeChars(JOIN_CODE.length);
        setJoined(true);
        return;
      }

      (async () => {
        await wait(300, timeouts);
        for (let i = 1; i <= CHURCH_NAME.length; i++) {
          if (cancelled) return;
          setNameChars(i);
          await wait(28, timeouts);
        }
        await wait(300, timeouts);
        if (cancelled) return;
        setCreated(true);
        await wait(1100, timeouts);
        if (cancelled) return;
        setScene("join");
        await wait(400, timeouts);
        for (let i = 1; i <= JOIN_CODE.length; i++) {
          if (cancelled) return;
          setCodeChars(i);
          await wait(120, timeouts);
        }
        await wait(250, timeouts);
        if (cancelled) return;
        setVerifying(true);
        await wait(700, timeouts);
        if (cancelled) return;
        setVerifying(false);
        setJoined(true);
      })();
    }, 0);
    timeouts.push(kickoff);

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [playKey, prefersReducedMotion]);

  return (
    <div className="relative min-h-40">
      <div
        className="absolute inset-0 transition-opacity duration-400"
        style={{ opacity: scene === "create" ? 1 : 0 }}
      >
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-semibold text-ink-muted">Start your church&apos;s space</p>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Buildings weight="duotone" className="size-5" />
            </span>
            <div className="min-h-9 flex-1 rounded-lg border border-line-strong bg-paper px-3 py-2 text-sm font-medium text-ink">
              {CHURCH_NAME.slice(0, nameChars)}
              {nameChars > 0 && nameChars < CHURCH_NAME.length && (
                <span className="animate-pulse-gentle text-brand-400">|</span>
              )}
            </div>
          </div>
          <div
            className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-success transition-opacity duration-300"
            style={{ opacity: created ? 1 : 0 }}
          >
            <CheckCircle weight="fill" className="size-4" /> Created! You&apos;re the church admin.
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 transition-opacity duration-400"
        style={{ opacity: scene === "join" ? 1 : 0 }}
      >
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-xs font-semibold text-ink-muted">Or join with a code</p>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <Ticket weight="duotone" className="size-5" />
            </span>
            <div className="flex gap-1.5">
              {JOIN_CODE.split("").map((char, i) => (
                <div
                  key={i}
                  className="flex size-9 items-center justify-center rounded-lg border border-line-strong bg-paper text-sm font-bold text-ink transition-all duration-200"
                  style={{ opacity: i < codeChars ? 1 : 0, transform: i < codeChars ? "scale(1)" : "scale(0.7)" }}
                >
                  {char}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 min-h-5">
            {verifying && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Spinner weight="bold" className="size-4 animate-spin" /> Verifying code…
              </p>
            )}
            {joined && (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
                <CheckCircle weight="fill" className="size-4" /> Joined! Welcome to the church.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
