"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/actions/requests";

/** Shared claim/accept/decline/complete/cancel button for every Requests
 * surface (the board, my requests, the mentorship directory) — surfaces the
 * action's error (if any) instead of silently discarding it. Generic port
 * of RideActionButton for any single-argument HelpRequest action. */
export function RequestActionButton({
  requestId,
  action,
  label,
  pendingLabel,
  variant = "secondary",
  confirmMessage,
}: {
  requestId: string;
  action: (requestId: string) => Promise<ActionResult>;
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  confirmMessage?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function run() {
    if (confirmMessage && !confirm(confirmMessage)) return;
    setError(undefined);
    startTransition(async () => {
      const result = await action(requestId);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <Button variant={variant} size="sm" disabled={pending} onClick={run}>
        {pending ? pendingLabel : label}
      </Button>
    </div>
  );
}
