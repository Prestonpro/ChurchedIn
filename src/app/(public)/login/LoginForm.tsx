"use client";

import { useActionState } from "react";
import Link from "next/link";
import { EnvelopeSimple, LockSimple } from "@phosphor-icons/react/dist/ssr";
import { loginAction } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        icon={EnvelopeSimple}
        required
      />
      <div>
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          icon={LockSimple}
          required
        />
        <Link
          href="/forgot-password"
          className="mt-1.5 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <SubmitButton pendingText="Logging in…" className="w-full">
        Log in
      </SubmitButton>
    </form>
  );
}
