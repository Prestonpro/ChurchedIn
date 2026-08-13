"use client";

import { useActionState } from "react";
import { User } from "@phosphor-icons/react/dist/ssr";
import { acceptNewCoAdminAction } from "@/lib/actions/churchInvites";
import { Field, FormError } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function AcceptInviteForm({ token }: { token: string }) {
  const action = acceptNewCoAdminAction.bind(null, token);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field label="Your name" name="name" icon={User} required />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        required
      />
      <SubmitButton pendingText="Joining…" className="w-full">
        Join as a co-leader
      </SubmitButton>
    </form>
  );
}
