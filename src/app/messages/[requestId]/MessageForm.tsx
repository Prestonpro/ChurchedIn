"use client";

import { useActionState, useState } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { sendMessageAction } from "@/lib/actions/messages";
import { FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

/** Remounted (via `key`) after a successful send to clear the textarea — the
 * new message appearing above is the confirmation, so there's no separate
 * "sent!" banner to go stale. Same pattern as RideRequestForm. */
export function MessageForm({ requestId }: { requestId: string }) {
  const action = sendMessageAction.bind(null, requestId);
  const [state, formAction] = useActionState(action, undefined);
  const [formKey, setFormKey] = useState(0);
  const [lastState, setLastState] = useState(state);

  if (state !== lastState) {
    setLastState(state);
    if (state && "ok" in state && state.ok) {
      setFormKey((k) => k + 1);
    }
  }

  return (
    <form key={formKey} action={formAction} className="border-t border-line p-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <div className="mt-2 flex items-end gap-2">
        <label className="flex-1">
          <span className="sr-only">Write a message</span>
          <textarea
            name="body"
            required
            maxLength={2000}
            rows={2}
            placeholder="Write a message…"
            className="min-h-11 w-full resize-none rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink transition-brand placeholder:text-ink-faint hover:border-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </label>
        <SubmitButton pendingText="Sending…">
          <PaperPlaneTilt weight="fill" className="size-4" /> Send
        </SubmitButton>
      </div>
    </form>
  );
}
