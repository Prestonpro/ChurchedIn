"use client";

import { useActionState } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { requestConnectionAction } from "@/lib/actions/connections";
import { TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ConnectionRequestForm({ mentorId }: { mentorId: string }) {
  const [state, formAction] = useActionState(requestConnectionAction, undefined);

  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="mentorId" value={mentorId} />
      <FormError message={state && "error" in state ? state.error : undefined} />
      <TextAreaField
        label="Message (optional)"
        name="message"
        placeholder="Say a little about what you're hoping for."
      />
      <SubmitButton size="sm" pendingText="Sending…">
        <PaperPlaneTilt weight="bold" className="size-3.5" /> Say hi
      </SubmitButton>
    </form>
  );
}
