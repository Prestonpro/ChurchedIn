"use client";

import { useActionState } from "react";
import { EnvelopeSimple, LockSimple, User, Buildings, MapPin } from "@phosphor-icons/react/dist/ssr";
import { createChurchAction } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function SignupForm() {
  const [state, formAction] = useActionState(createChurchAction, undefined);

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
      <div className="space-y-4 border-t border-line pt-4">
        <Field label="Church name" name="churchName" icon={Buildings} required />
        <Field label="City" name="churchCity" icon={MapPin} hint="Optional." />
      </div>
      <SubmitButton pendingText="Creating…" className="w-full">
        Create your church&apos;s space
      </SubmitButton>
    </form>
  );
}
