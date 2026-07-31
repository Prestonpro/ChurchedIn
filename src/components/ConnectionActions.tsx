"use client";

import { useState, useTransition } from "react";
import { Check, X } from "@phosphor-icons/react/dist/ssr";
import { respondToConnectionAction, endConnectionAction, cancelConnectionRequestAction } from "@/lib/actions/connections";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

export function RespondToConnectionButtons({ connectionId }: { connectionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function respond(action: "ACCEPT" | "DECLINE") {
    setError(undefined);
    startTransition(async () => {
      const result = await respondToConnectionAction(connectionId, action);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => respond("ACCEPT")}>
          <Check weight="bold" className="size-3.5" /> Accept
        </Button>
        <Button variant="secondary" size="sm" disabled={pending} onClick={() => respond("DECLINE")}>
          <X weight="bold" className="size-3.5" /> Decline
        </Button>
      </div>
    </div>
  );
}

export function CancelRequestButton({ connectionId }: { connectionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function run() {
    if (!confirm("Cancel this request?")) return;
    setError(undefined);
    startTransition(async () => {
      const result = await cancelConnectionRequestAction(connectionId);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <Button
        variant="ghost"
        size="sm"
        className="text-ink-muted hover:bg-danger-soft hover:text-danger"
        disabled={pending}
        onClick={run}
      >
        {pending ? "Cancelling…" : "Cancel request"}
      </Button>
    </div>
  );
}

export function EndConnectionButton({ connectionId }: { connectionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function run() {
    if (!confirm("End this connection?")) return;
    setError(undefined);
    startTransition(async () => {
      const result = await endConnectionAction(connectionId);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <Button
        variant="ghost"
        size="sm"
        className="text-ink-muted hover:bg-danger-soft hover:text-danger"
        disabled={pending}
        onClick={run}
      >
        {pending ? "Ending…" : "End connection"}
      </Button>
    </div>
  );
}
