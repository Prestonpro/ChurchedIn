"use client";

import { useTransition } from "react";
import { Check, X } from "@phosphor-icons/react/dist/ssr";
import { respondToConnectionAction, endConnectionAction } from "@/lib/actions/connections";
import { Button } from "@/components/ui/Button";

export function RespondToConnectionButtons({ connectionId }: { connectionId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await respondToConnectionAction(connectionId, "ACCEPT");
          })
        }
      >
        <Check weight="bold" className="size-3.5" /> Accept
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await respondToConnectionAction(connectionId, "DECLINE");
          })
        }
      >
        <X weight="bold" className="size-3.5" /> Decline
      </Button>
    </div>
  );
}

export function EndConnectionButton({ connectionId }: { connectionId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-ink-muted hover:bg-danger-soft hover:text-danger"
      disabled={pending}
      onClick={() => {
        if (confirm("End this connection?")) {
          startTransition(async () => {
            await endConnectionAction(connectionId);
          });
        }
      }}
    >
      {pending ? "Ending…" : "End connection"}
    </Button>
  );
}
