"use client";

import { useActionState } from "react";
import { EnvelopeSimple, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { requestPasswordResetAction } from "@/lib/actions/passwordReset";
import { Field, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, undefined);

  if (state && "ok" in state && state.ok) {
    return (
      <div className="flex items-start gap-2.5 rounded-lg border border-line bg-paper px-4 py-3.5 text-sm text-ink-soft">
        <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-brand-600" />
        <span>
          If that email matches an account, we&apos;ve sent a link to reset your password. It expires in
          1 hour.
        </span>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field label="Email" name="email" type="email" autoComplete="email" icon={EnvelopeSimple} required />
      <SubmitButton pendingText="Sending…" className="w-full">
        Send reset link
      </SubmitButton>
    </form>
  );
}
