"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandsClapping } from "@phosphor-icons/react/dist/ssr";
import { requestVouchAction } from "@/lib/actions/churches";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";

export function VouchButton({ churchId }: { churchId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function run() {
    setError(undefined);
    startTransition(async () => {
      const result = await requestVouchAction(churchId);
      if (result && "error" in result) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <Button variant="secondary" size="sm" disabled={pending} onClick={run}>
        <HandsClapping weight="bold" className="size-3.5" />
        {pending ? "Vouching…" : "I can confirm this is a real church"}
      </Button>
    </div>
  );
}
