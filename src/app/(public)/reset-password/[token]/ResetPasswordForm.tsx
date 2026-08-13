"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions/passwordReset";
import { FormError } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ResetPasswordForm({ token }: { token: string }) {
  const action = resetPasswordAction.bind(null, token);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        required
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        required
      />
      <SubmitButton pendingText="Saving…" className="w-full">
        Set new password
      </SubmitButton>
    </form>
  );
}
