"use client";

import { useTransition } from "react";
import { unblockUserAction } from "@/lib/actions/blocks";
import { Button } from "@/components/ui/Button";

export function UnblockButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => { await unblockUserAction(userId); })}
    >
      {pending ? "Unblocking…" : "Unblock"}
    </Button>
  );
}
