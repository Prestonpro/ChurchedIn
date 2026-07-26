"use client";

import { useState, useActionState } from "react";
import { HandHeart, GraduationCap } from "@phosphor-icons/react/dist/ssr";
import { joinDiscoveredChurchAction } from "@/lib/actions/churches";
import { FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

const ROLE_OPTIONS = [
  { value: "VOLUNTEER", label: "Volunteer", icon: HandHeart },
  { value: "STUDENT", label: "International student", icon: GraduationCap },
] as const;

/** For an already-logged-in user joining a church found on /discover —
 * same role choice as the (public) signup-time join flow, minus the
 * account fields since they already have one. */
export function JoinChurchForm({ churchId }: { churchId: string }) {
  const action = joinDiscoveredChurchAction.bind(null, churchId);
  const [state, formAction] = useActionState(action, undefined);
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]["value"]>("VOLUNTEER");

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <div className="grid grid-cols-2 gap-2">
        {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-line-strong px-2 py-3 text-center text-xs font-medium text-ink-soft transition-brand hover:border-brand-300 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"
          >
            <input
              type="radio"
              name="role"
              value={value}
              checked={role === value}
              onChange={() => setRole(value)}
              className="sr-only"
            />
            <Icon weight="duotone" className="size-5" />
            {label}
          </label>
        ))}
      </div>
      <SubmitButton pendingText="Joining…" className="w-full">
        Join this church
      </SubmitButton>
    </form>
  );
}
