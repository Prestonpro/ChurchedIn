"use client";

import { useState, useTransition } from "react";
import { Check, X } from "@phosphor-icons/react/dist/ssr";
import { respondToRequestAction } from "@/lib/actions/requests";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

/** Accept/decline for a targeted (PENDING) request — replaces
 * RespondToConnectionButtons. Cancel/complete are single actions, so those
 * now go straight through the generic RequestActionButton instead of a
 * dedicated component (see cancelRequestAction/completeRequestAction). */
export function RespondToRequestButtons({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function respond(action: "ACCEPT" | "DECLINE") {
    setError(undefined);
    startTransition(async () => {
      const result = await respondToRequestAction(requestId, action);
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
