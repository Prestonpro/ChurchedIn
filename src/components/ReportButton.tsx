"use client";

import { useState, useActionState } from "react";
import { Flag, X } from "@phosphor-icons/react/dist/ssr";
import { fileReportAction } from "@/lib/actions/reports";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import { REPORT_USER_REASONS } from "@/lib/validation";

export function ReportButton({ reportedUserId, name }: { reportedUserId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(fileReportAction, undefined);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="text-sm text-ink-muted">
        Your report has been submitted. Church admins will review it.
      </p>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer text-xs text-ink-faint underline-offset-2 hover:text-danger hover:underline"
      >
        <Flag className="mr-1 inline size-3" />
        Report {name.split(" ")[0]}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-ink">Report {name.split(" ")[0]}</h3>
              <button
                onClick={() => setOpen(false)}
                className="cursor-pointer text-ink-faint hover:text-ink"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <form
              action={async (fd) => {
                await formAction(fd);
                setSubmitted(true);
                setOpen(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="reportedUserId" value={reportedUserId} />
              <FormError message={state && "error" in state ? state.error : undefined} />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-soft">Reason</label>
                {REPORT_USER_REASONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                    <input type="radio" name="reason" value={r} required className="accent-brand-600" />
                    {r}
                  </label>
                ))}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink-soft">
                  Additional details <span className="font-normal text-ink-faint">(optional)</span>
                </label>
                <textarea
                  name="details"
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
                  placeholder="Anything else we should know…"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="danger" size="sm">
                  Submit report
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
