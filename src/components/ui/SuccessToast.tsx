"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

/**
 * A brief, auto-dismissing confirmation banner — "Profile saved", not a
 * general-purpose toast queue (there's only ever one of these visible per
 * page right now, so a stacking/queueing system would be solving a problem
 * this app doesn't have yet).
 *
 * `trigger` is a counter, not a boolean: bump it (e.g. `setSaveCount(n =>
 * n + 1)`) each time an action succeeds. A boolean that just stays `true`
 * after the first save wouldn't re-fire on a second save with the same
 * value; a changing number does, by React's own dependency-comparison
 * rules. `0` means "never shown yet" and is treated as a no-op, so the
 * toast doesn't flash on mount.
 *
 * Portaled to document.body for the same reason ui/Modal.tsx and
 * nav/MobileMenu.tsx are: a `fixed`-positioned child of an ancestor with
 * `backdrop-filter` (AuthShell's header) resolves its position against
 * that ancestor instead of the viewport. Most callers of this component
 * live inside <main>, not the header, so this may never actually bite —
 * but portaling costs nothing and means no future caller has to relearn
 * that lesson.
 */
export function SuccessToast({ trigger, message }: { trigger: number; message: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (trigger === 0) return;
    // Deferred via setTimeout(fn, 0), not called straight from the effect
    // body — see the `mounted` flag above for why: `react-hooks/set-state-
    // in-effect` is an ESLint error here, and ESLint errors fail the Vercel
    // build.
    const showTimeout = setTimeout(() => setVisible(true), 0);
    const hideTimeout = setTimeout(() => setVisible(false), 3000);
    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [trigger]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
      <span
        role="status"
        className="animate-fade-up pointer-events-auto flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lifted"
      >
        <CheckCircle weight="fill" className="size-4 text-success" />
        {message}
      </span>
    </div>,
    document.body,
  );
}
