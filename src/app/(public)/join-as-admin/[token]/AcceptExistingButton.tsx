"use client";

import { useActionState } from "react";
import { acceptExistingCoAdminAction } from "@/lib/actions/churchInvites";
import { FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function AcceptExistingButton({ token }: { token: string }) {
  const action = acceptExistingCoAdminAction.bind(null, token);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <SubmitButton pendingText="Joining…" className="w-full">
        Accept and go to my dashboard
      </SubmitButton>
    </form>
  );
}
