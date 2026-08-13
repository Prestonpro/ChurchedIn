"use client";

import { useState, useTransition } from "react";
import { Prohibit } from "@phosphor-icons/react/dist/ssr";
import { blockUserAction } from "@/lib/actions/blocks";
import { FormError } from "@/components/ui/Field";

/** Lives only on the public profile page now, not on every friend-
 * directory card — styled to match ReportButton, its neighbor there. */
export function BlockButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);
  const [blocked, setBlocked] = useState(false);

  function run() {
    if (!confirm(`Block ${name}? They won't be able to RSVP to your events or contact you. You can undo this later from your Requests page.`)) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await blockUserAction(userId);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        setBlocked(true);
      }
    });
  }

  if (blocked) {
    return <p className="text-xs text-ink-muted">You&apos;ve blocked {name.split(" ")[0]}.</p>;
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <button
        onClick={run}
        disabled={pending}
        className="cursor-pointer text-xs text-ink-faint underline-offset-2 hover:text-danger hover:underline disabled:cursor-default disabled:opacity-60"
      >
        <Prohibit className="mr-1 inline size-3" />
        Block {name.split(" ")[0]}
      </button>
    </div>
  );
}
