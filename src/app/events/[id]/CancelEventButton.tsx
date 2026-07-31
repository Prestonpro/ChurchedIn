"use client";

import { useState, useTransition } from "react";
import { Prohibit } from "@phosphor-icons/react/dist/ssr";
import { cancelEventAction } from "@/lib/actions/events";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

export function CancelEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function run() {
    if (!confirm("Cancel this event? Everyone who RSVPed will be emailed.")) return;
    setError(undefined);
    // The callback must be async and the action awaited: a synchronous callback
    // returns before the action resolves, so `pending` cleared immediately and
    // the ActionResult was dropped on the floor. cancelEventAction rejects a
    // caller who is neither the creator nor a church leader, and that message
    // used to vanish — the button simply went back to idle with the event still
    // live. Same shape as RideActionButton.
    startTransition(async () => {
      const result = await cancelEventAction(eventId);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <Button variant="danger" size="sm" disabled={pending} onClick={run}>
        <Prohibit weight="bold" className="size-3.5" />
        {pending ? "Cancelling…" : "Cancel event"}
      </Button>
    </div>
  );
}
