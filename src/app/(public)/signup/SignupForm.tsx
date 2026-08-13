"use client";

import { useActionState } from "react";
import Link from "next/link";
import { EnvelopeSimple, User, Buildings, MapPin, Warning } from "@phosphor-icons/react/dist/ssr";
import { createChurchAction } from "@/lib/actions/auth";
import { Field, FormError } from "@/components/ui/Field";
import { PasswordField } from "@/components/ui/PasswordField";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function SignupForm() {
  const [state, formAction] = useActionState(createChurchAction, undefined);
  const duplicates = state && "duplicates" in state ? state.duplicates : undefined;

  return (
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
      <div className="space-y-4 border-t border-line pt-4">
        <Field label="Church name" name="churchName" icon={Buildings} required />
        <Field label="City" name="churchCity" icon={MapPin} hint="Optional." />
      </div>

      {duplicates && duplicates.length > 0 && (
        <div className="space-y-3 rounded-xl border border-warning/40 bg-warning-soft p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-warning">
            <Warning weight="fill" className="size-4 shrink-0" />
            This might already be on ChurchedIn
          </p>
          <ul className="space-y-2">
            {duplicates.map((d) => (
              <li key={d.id} className="text-sm text-ink-soft">
                <span className="font-semibold text-ink">{d.name}</span>
                {d.city && <> · {d.city}</>}
                {d.claimed ? (
                  <> — already has a leader. If this is your church, ask them for an invite code
                    instead of creating a second copy. Have a code? <Link href="/join" className="font-medium text-brand-600 hover:underline">Join with a code</Link>.</>
                ) : (
                  <> — listed but no leader yet. <Link href="/discover" className="font-medium text-brand-600 hover:underline">Find it on Discover</Link> to join and claim it, instead of creating a duplicate.</>
                )}
              </li>
            ))}
          </ul>
          {/* A checkbox, not a second button — whether an unchecked checkbox
              appears in FormData at all is native browser behavior, not
              something React's Server Action wiring or event timing can get
              wrong. Check it, then hit the same submit button again below. */}
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft">
            <input
              type="checkbox"
              name="confirmDuplicate"
              value="1"
              className="size-4.5 rounded border-line-strong text-brand-600 focus:ring-2 focus:ring-brand-200"
            />
            This is a different church — create it anyway
          </label>
        </div>
      )}

      <SubmitButton pendingText="Creating…" className="w-full">
        Create your church&apos;s space
      </SubmitButton>
    </form>
  );
}
