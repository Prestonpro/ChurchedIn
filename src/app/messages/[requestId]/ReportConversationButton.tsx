"use client";

import { useActionState, useState } from "react";
import { Flag, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { reportConversationAction } from "@/lib/actions/messages";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SelectField, TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { REPORT_REASONS } from "@/lib/validation";

export function ReportConversationButton({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const action = reportConversationAction.bind(null, requestId);
  const [state, formAction] = useActionState(action, undefined);
  const reported = !!state && "ok" in state && state.ok;

  return (
    <>
      <Button variant="ghost" size="sm" className="text-ink-muted hover:bg-danger-soft hover:text-danger" onClick={() => setOpen(true)}>
        <Flag weight="bold" className="size-3.5" /> Report
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Report this conversation">
        {reported ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-paper px-4 py-3.5 text-sm text-ink-soft">
            <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-brand-600" />
            <span>Your report has been sent to your church&apos;s leaders. Thanks for flagging this.</span>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <FormError message={state && "error" in state ? state.error : undefined} />
            <p className="text-sm text-ink-muted">
              This sends the conversation&apos;s messages to your church&apos;s leaders for review. They won&apos;t
              be able to see any other conversations.
            </p>
            <SelectField label="What's going on?" name="reason" required defaultValue="">
              <option value="" disabled>
                Choose a reason
              </option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </SelectField>
            <TextAreaField label="Anything else? (optional)" name="details" placeholder="Add any details that would help." />
            <SubmitButton variant="danger" pendingText="Sending…" className="w-full">
              Send report
            </SubmitButton>
          </form>
        )}
      </Modal>
    </>
  );
}
