"use client";

import { useState, useTransition } from "react";
import { SealCheck } from "@phosphor-icons/react/dist/ssr";
import { verifyAsPastorAction } from "@/lib/actions/churches";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

export function PastorVerifyButton({ churchId }: { churchId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function run() {
    if (!confirm("Verify this church as pastor-led? This is a trust-based confirmation, not an official check.")) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await verifyAsPastorAction(churchId);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <Button variant="secondary" size="sm" disabled={pending} onClick={run}>
        <SealCheck weight="bold" className="size-3.5" />
        {pending ? "Verifying…" : "Verify as pastor"}
      </Button>
    </div>
  );
}
