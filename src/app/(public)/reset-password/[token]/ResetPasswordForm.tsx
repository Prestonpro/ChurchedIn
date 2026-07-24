"use client";

import { useActionState } from "react";
import { LockSimple } from "@phosphor-icons/react/dist/ssr";
import { resetPasswordAction } from "@/lib/actions/passwordReset";
import { Field, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ResetPasswordForm({ token }: { token: string }) {
  const action = resetPasswordAction.bind(null, token);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        icon={LockSimple}
        hint="At least 8 characters."
        required
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        icon={LockSimple}
        required
      />
      <SubmitButton pendingText="Saving…" className="w-full">
        Set new password
      </SubmitButton>
    </form>
  );
}
