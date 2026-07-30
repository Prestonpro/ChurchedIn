"use client";

import { useTransition } from "react";
import { Prohibit } from "@phosphor-icons/react/dist/ssr";
import { blockUserAction } from "@/lib/actions/blocks";
import { Button } from "@/components/ui/Button";

export function BlockButton({ userId, name }: { userId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-ink-faint hover:bg-danger-soft hover:text-danger"
      disabled={pending}
      title={`Block ${name}`}
      aria-label={`Block ${name}`}
      onClick={() => {
        if (confirm(`Block ${name}? They won't be able to RSVP to your events or contact you. You can undo this later from the bottom of this page.`)) {
          startTransition(async () => {
            await blockUserAction(userId);
          });
        }
      }}
    >
      <Prohibit weight="bold" className="size-4" />
    </Button>
  );
}
