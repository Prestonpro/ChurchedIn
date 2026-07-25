"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/actions/rides";

/** Shared claim/complete/cancel button for the rides board and "my ride
 * requests" pages — surfaces the action's error (if any) instead of
 * silently discarding it. */
export function RideActionButton({
  rideId,
  action,
  label,
  pendingLabel,
  variant = "secondary",
  confirmMessage,
}: {
  rideId: string;
  action: (rideId: string) => Promise<ActionResult>;
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
      const result = await action(rideId);
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
