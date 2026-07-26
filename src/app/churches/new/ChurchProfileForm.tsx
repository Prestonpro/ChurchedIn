"use client";

import { useActionState } from "react";
import { Buildings, Globe, Translate, Clock } from "@phosphor-icons/react/dist/ssr";
import { createChurchProfileAction } from "@/lib/actions/churches";
import { Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LocationPicker } from "@/components/LocationPicker";

export function ChurchProfileForm() {
  const [state, formAction] = useActionState(createChurchProfileAction, undefined);

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
        <Field
          label="Languages (optional)"
          name="languages"
          icon={Translate}
          placeholder="English, Mandarin"
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

      <SubmitButton pendingText="Creating…" className="w-full">
        Create church profile
      </SubmitButton>
    </form>
  );
}
