"use client";

import { useState, useTransition } from "react";
import { unblockUserAction } from "@/lib/actions/blocks";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

export function UnblockButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function run() {
    setError(undefined);
    startTransition(async () => {
      const result = await unblockUserAction(userId);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <Button variant="ghost" size="sm" disabled={pending} onClick={run}>
        {pending ? "Unblocking…" : "Unblock"}
      </Button>
    </div>
  );
}
