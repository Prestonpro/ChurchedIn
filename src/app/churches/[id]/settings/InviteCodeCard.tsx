"use client";

import { useState, useTransition } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import { regenerateJoinCodeAction } from "@/lib/actions/churches";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

export function InviteCodeCard({ churchId, joinCode }: { churchId: string; joinCode: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function regenerate() {
    if (!confirm("Regenerate the invite code? The old code will stop working immediately.")) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await regenerateJoinCodeAction(churchId);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      // Nothing on the client can construct the new code — the action
      // updates the DB directly. Refresh the page's server data instead.
      window.location.reload();
    });
  }

  return (
    <div className="space-y-2">
      <FormError message={error} />
      <div className="flex flex-wrap items-center gap-3">
        <code className="rounded-lg bg-paper px-4 py-2.5 text-lg font-bold tracking-[0.3em] text-brand-700">
          {joinCode}
        </code>
        <CopyButton text={joinCode} label="Copy code" />
        <Button variant="ghost" size="sm" disabled={pending} onClick={regenerate}>
          <ArrowsClockwise weight="bold" className="size-3.5" />
          {pending ? "Regenerating…" : "Regenerate"}
        </Button>
      </div>
    </div>
  );
}
