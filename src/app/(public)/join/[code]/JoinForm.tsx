"use client";

import { useActionState } from "react";
import { EnvelopeSimple, LockSimple, User, HandHeart, GraduationCap } from "@phosphor-icons/react/dist/ssr";
import { joinChurchAction } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

const ROLE_OPTIONS = [
  { value: "VOLUNTEER", label: "Volunteer", icon: HandHeart },
  { value: "STUDENT", label: "International student", icon: GraduationCap },
] as const;

export function JoinForm({ code }: { code: string }) {
  const action = joinChurchAction.bind(null, code);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />

      <div>
        <span className="text-sm font-semibold text-ink-soft">I&apos;m joining as a…</span>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-line-strong px-3 py-3.5 text-center text-sm font-medium text-ink-soft transition-brand hover:border-brand-300 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"
            >
              <input
                type="radio"
                name="role"
                value={value}
                defaultChecked={value === "VOLUNTEER"}
                className="sr-only"
              />
              <Icon weight="duotone" className="size-6" />
              {label}
            </label>
          ))}
        </div>
      </div>

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
      <SubmitButton pendingText="Joining…" className="w-full">
        Join
      </SubmitButton>
    </form>
  );
}
