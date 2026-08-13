"use client";

import { useActionState } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { requestMentorAction } from "@/lib/actions/requests";
import { TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

/** Targeted pick from the Mentorship directory — replaces
 * ConnectionRequestForm. `claimerId` is the specific volunteer chosen. */
export function RequestMentorForm({ claimerId }: { claimerId: string }) {
  const [state, formAction] = useActionState(requestMentorAction, undefined);

  return (
    <form action={formAction} className="space-y-2.5">
      <input type="hidden" name="claimerId" value={claimerId} />
      <FormError message={state && "error" in state ? state.error : undefined} />
      <TextAreaField
        label="Message (optional)"
        name="message"
        placeholder="Say a little about what you're hoping for."
      />
      <SubmitButton size="sm" pendingText="Sending…">
        <PaperPlaneTilt weight="bold" className="size-3.5" /> Send request
      </SubmitButton>
    </form>
  );
}
