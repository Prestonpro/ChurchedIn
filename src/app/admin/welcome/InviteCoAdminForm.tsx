"use client";

import { useActionState } from "react";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { inviteCoAdminAction } from "@/lib/actions/churchInvites";
import { Field, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function InviteCoAdminForm() {
  const [state, formAction] = useActionState(inviteCoAdminAction, undefined);

  if (state && "ok" in state && state.ok) {
    return (
      <p className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
        Invite sent! They&apos;ll get an email with a link to join as a co-leader.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field
        label="Their email"
        name="email"
        type="email"
        icon={EnvelopeSimple}
        required
        placeholder="friend@example.com"
      />
      <SubmitButton pendingText="Sending…">Send invite</SubmitButton>
    </form>
  );
}
