"use client";

import { useActionState } from "react";
import { Ticket } from "@phosphor-icons/react/dist/ssr";
import { Field, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { goToCodeAction } from "./actions";

export function JoinCodeForm() {
  const [state, formAction] = useActionState(goToCodeAction, undefined);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field
        label="Join code"
        name="code"
        required
        maxLength={6}
        icon={Ticket}
        className="text-center text-lg font-bold uppercase tracking-[0.3em]"
        placeholder="ABC123"
      />
      <SubmitButton pendingText="Continuing…" className="w-full">
        Continue
      </SubmitButton>
    </form>
  );
}
