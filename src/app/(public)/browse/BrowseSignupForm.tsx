"use client";

import { useActionState } from "react";
import { EnvelopeSimple, LockSimple, User } from "@phosphor-icons/react/dist/ssr";
import { createBrowsingAccountAction } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function BrowseSignupForm() {
  const [state, formAction] = useActionState(createBrowsingAccountAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field label="Your name" name="name" icon={User} required />
      <Field label="Email" name="email" type="email" autoComplete="email" icon={EnvelopeSimple} required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        icon={LockSimple}
        hint="At least 8 characters."
        required
      />
      <SubmitButton pendingText="Creating…" className="w-full">
        Start browsing
      </SubmitButton>
    </form>
  );
}
