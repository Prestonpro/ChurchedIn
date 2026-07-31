"use client";

import { useState, useTransition } from "react";
import { Prohibit } from "@phosphor-icons/react/dist/ssr";
import { blockUserAction } from "@/lib/actions/blocks";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

export function BlockButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function run() {
    if (!confirm(`Block ${name}? They won't be able to RSVP to your events or contact you. You can undo this later from the bottom of this page.`)) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await blockUserAction(userId);
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
        className="text-ink-faint hover:bg-danger-soft hover:text-danger"
        disabled={pending}
        title={`Block ${name}`}
        aria-label={`Block ${name}`}
        onClick={run}
      >
        <Prohibit weight="bold" className="size-4" />
      </Button>
    </div>
  );
}
