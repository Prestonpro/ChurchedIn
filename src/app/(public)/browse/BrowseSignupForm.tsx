"use client";

import { useActionState } from "react";
import { EnvelopeSimple, User } from "@phosphor-icons/react/dist/ssr";
import { createBrowsingAccountAction } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function BrowseSignupForm() {
  const [state, formAction] = useActionState(createBrowsingAccountAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field label="Your name" name="name" icon={User} required />
      <Field label="Email" name="email" type="email" autoComplete="email" icon={EnvelopeSimple} required />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        hint="At least 8 characters."
        required
      />
      <SubmitButton pendingText="Creating…" className="w-full">
        Start browsing
      </SubmitButton>
    </form>
  );
}
