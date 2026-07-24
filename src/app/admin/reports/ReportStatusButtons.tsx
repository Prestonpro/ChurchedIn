"use client";

import { useTransition } from "react";
import { CheckCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import { updateReportStatusAction } from "@/lib/actions/reports";
import { Button } from "@/components/ui/Button";

export function ReportStatusButtons({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateReportStatusAction(reportId, "REVIEWED");
          })
        }
      >
        <CheckCircle weight="bold" className="size-3.5" /> Mark reviewed
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateReportStatusAction(reportId, "DISMISSED");
          })
        }
      >
        <XCircle weight="bold" className="size-3.5" /> Dismiss
      </Button>
    </div>
  );
}
