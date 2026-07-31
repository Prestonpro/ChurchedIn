"use client";

import { useState, useTransition } from "react";
import { Check, X } from "@phosphor-icons/react/dist/ssr";
import { resolveReportAction } from "@/lib/actions/reports";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import { REPORT_STATUS } from "@/lib/constants";

export function ReportActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>(undefined);

  function resolve(status: "REVIEWED" | "DISMISSED") {
    setError(undefined);
    startTransition(async () => {
      const result = await resolveReportAction(reportId, status);
      if (result && "error" in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <FormError message={error} />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={() => resolve(REPORT_STATUS.REVIEWED)}>
          <Check weight="bold" className="size-3.5" /> Mark reviewed
        </Button>
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => resolve(REPORT_STATUS.DISMISSED)}>
          <X weight="bold" className="size-3.5" /> Dismiss
        </Button>
      </div>
    </div>
  );
}
