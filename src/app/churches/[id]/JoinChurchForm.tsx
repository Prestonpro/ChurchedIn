"use client";

import { useState, useActionState } from "react";
import { HandHeart, GraduationCap, Key } from "@phosphor-icons/react/dist/ssr";
import { joinDiscoveredChurchAction } from "@/lib/actions/churches";
import { FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

const ROLE_OPTIONS = [
  { value: "VOLUNTEER", label: "Volunteer", icon: HandHeart },
  { value: "STUDENT", label: "International student", icon: GraduationCap },
] as const;

/** For an already-logged-in user joining a church found on /discover —
 * same role choice as the (public) signup-time join flow, minus the
 * account fields since they already have one.
 *
 * `requireJoinCode` is true for any church with a real leader (`claimedAt`
 * set) — same invite-code boundary the brand-new-account /join/[code] flow
 * already enforces, closing a self-service path where an uninvited stranger
 * could join a live church and reach its members' rides/events. A church
 * that's just an unclaimed map listing (no leader yet to hand out a code)
 * skips this, so the "claim this church" flow it's meant to feed into
 * still works. */
export function JoinChurchForm({ churchId, requireJoinCode }: { churchId: string; requireJoinCode: boolean }) {
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
      {requireJoinCode && (
        <div>
          <label className="block space-y-1.5">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <Key weight="bold" className="size-3.5" /> Invite code
            </span>
            <input
              type="text"
              name="joinCode"
              required
              maxLength={6}
              placeholder="ABC123"
              className="w-full rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-sm uppercase tracking-widest text-ink placeholder:text-ink-faint placeholder:tracking-normal focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </label>
          <p className="mt-1 text-xs text-ink-muted">Ask this church&apos;s leader for the code they use to invite people.</p>
        </div>
      )}
      <SubmitButton pendingText="Joining…" className="w-full">
        Join this church
      </SubmitButton>
    </form>
  );
}
