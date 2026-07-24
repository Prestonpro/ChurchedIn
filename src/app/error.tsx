"use client";

import { useEffect } from "react";
import { WarningCircle, ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import { Button, LinkButton } from "@/components/ui/Button";

/**
 * Catches any uncaught error thrown while rendering a page or server action
 * under the root layout (no route segment here defines a more specific
 * error.tsx). Deliberately doesn't attempt to re-render whatever page threw
 * — reset() re-tries the same segment, which is the right default for a
 * transient failure (a flaky query, a Resend hiccup that wasn't swallowed
 * upstream) but won't help a genuine bug, hence the "go back" escape hatch.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <WarningCircle weight="fill" className="size-7" />
      </span>
      <h1 className="mt-5 text-xl font-extrabold text-ink">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        That&apos;s on us, not you. Try again, or head back and pick up where
        you left off.
      </p>
      <div className="mt-7 flex items-center gap-3">
        <Button onClick={reset} variant="secondary">
          <ArrowClockwise weight="bold" className="size-4" />
          Try again
        </Button>
        <LinkButton href="/">Go home</LinkButton>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-ink-faint">Error ref: {error.digest}</p>
      )}
    </div>
  );
}
