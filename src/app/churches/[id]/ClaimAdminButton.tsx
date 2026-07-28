"use client";

import { useState, useTransition } from "react";
import { Star } from "@phosphor-icons/react/dist/ssr";
import { claimChurchAdminAction } from "@/lib/actions/churches";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

export function ClaimAdminButton({ churchId }: { churchId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function claim() {
    setError(undefined);
    startTransition(async () => {
      const result = await claimChurchAdminAction(churchId);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <FormError message={error} />
      <Button variant="secondary" disabled={pending} onClick={claim} className="w-full">
        <Star weight="bold" className="size-4" />
        {pending ? "Claiming…" : "Claim as church leader"}
      </Button>
    </div>
  );
}
