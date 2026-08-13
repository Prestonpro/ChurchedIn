"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Buildings, Globe, Translate, Clock, Warning } from "@phosphor-icons/react/dist/ssr";
import { createChurchProfileAction } from "@/lib/actions/churches";
import { Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LocationPicker } from "@/components/LocationPicker";
import { LANGUAGES } from "@/lib/constants";

export function ChurchProfileForm() {
  const [state, formAction] = useActionState(createChurchProfileAction, undefined);
  const duplicates = state && "duplicates" in state ? state.duplicates : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />

      <Field label="Church name" name="name" icon={Buildings} required placeholder="Grace Community Church" />
      <Field
        label="Denomination (optional)"
        name="denomination"
        placeholder="Non-denominational, Baptist, ..."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Service times (optional)"
          name="serviceTimes"
          icon={Clock}
          placeholder="Sundays at 10am"
        />
        <SearchableSelect
          label="Languages (optional)"
          name="languages"
          icon={Translate}
          placeholder="English, Mandarin"
          options={LANGUAGES}
          isMulti
        />
      </div>
      <TextAreaField
        label="Short description (optional)"
        name="bio"
        placeholder="A few sentences about your church and its heart for international students."
      />
      <Field label="Website (optional)" name="website" icon={Globe} placeholder="https://..." />

      <LocationPicker
        title="Church location (optional)"
        helpText="Add an address and drop a pin so visitors can find you on the discovery map."
      />

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
          {/* See SignupForm's identical checkbox for why this isn't a
              second submit button. */}
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
        Create church profile
      </SubmitButton>
    </form>
  );
}
