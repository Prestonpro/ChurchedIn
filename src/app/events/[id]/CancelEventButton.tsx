"use client";

import { useTransition } from "react";
import { Prohibit } from "@phosphor-icons/react/dist/ssr";
import { cancelEventAction } from "@/lib/actions/events";
import { Button } from "@/components/ui/Button";

export function CancelEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (confirm("Cancel this event? Everyone who RSVPed will be emailed.")) {
          startTransition(() => {
            cancelEventAction(eventId);
          });
        }
      }}
    >
      <Prohibit weight="bold" className="size-3.5" />
      {pending ? "Cancelling…" : "Cancel event"}
    </Button>
  );
}
