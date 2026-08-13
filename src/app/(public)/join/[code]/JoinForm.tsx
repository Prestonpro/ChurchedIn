"use client";

import { useState } from "react";
import { useActionState } from "react";
import { EnvelopeSimple, User, HandHeart, GraduationCap } from "@phosphor-icons/react/dist/ssr";
import { joinChurchAction, joinChurchAsExistingUserAction } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { GoogleButton, OrDivider } from "@/components/ui/GoogleButton";

const ROLE_OPTIONS = [
  { value: "VOLUNTEER", label: "Volunteer", icon: HandHeart },
  { value: "STUDENT", label: "International student", icon: GraduationCap },
] as const;

export function JoinForm({ code, isLoggedIn }: { code: string; isLoggedIn?: boolean }) {
  const loggedOutAction = joinChurchAction.bind(null, code);
  const loggedInAction = joinChurchAsExistingUserAction.bind(null, code);
  const [state, formAction] = useActionState(isLoggedIn ? loggedInAction : loggedOutAction, undefined);
  
  // Shared with the Google button below so it can carry whichever role is
  // currently selected through the OAuth redirect round-trip.
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]["value"]>("VOLUNTEER");

  const roleGroup = (
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
              checked={role === value}
              onChange={() => setRole(value)}
              className="sr-only"
            />
            <Icon weight="duotone" className="size-6" />
            {label}
          </label>
        ))}
      </div>
    </div>
  );

  if (isLoggedIn) {
    return (
      <div className="space-y-4">
        {roleGroup}
        <form action={formAction} className="space-y-4 mt-6">
          <FormError message={state && "error" in state ? state.error : undefined} />
          <input type="hidden" name="role" value={role} />
          <SubmitButton pendingText="Joining…" className="w-full">
            Join Church
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {roleGroup}

      <GoogleButton
        href={`/api/auth/google?joinCode=${encodeURIComponent(code)}&role=${role}`}
        label="Continue with Google"
      />
      <OrDivider />

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
        <input type="hidden" name="role" value={role} />
        <SubmitButton pendingText="Joining…" className="w-full">
          Join
        </SubmitButton>
      </form>
    </div>
  );
}
