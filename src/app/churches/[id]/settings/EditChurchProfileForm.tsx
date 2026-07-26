"use client";

import { useActionState } from "react";
import { Buildings, Globe, Translate, Clock } from "@phosphor-icons/react/dist/ssr";
import { updateChurchProfileAction } from "@/lib/actions/churches";
import { Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LocationPicker } from "@/components/LocationPicker";

type ChurchDefaults = {
  name: string;
  denomination: string | null;
  serviceTimes: string | null;
  languages: string | null;
  bio: string | null;
  website: string | null;
  address: string | null;
  locationLat: number | null;
  locationLng: number | null;
};

export function EditChurchProfileForm({ churchId, church }: { churchId: string; church: ChurchDefaults }) {
  const action = updateChurchProfileAction.bind(null, churchId);
  const [state, formAction] = useActionState(action, undefined);
  const saved = !!state && "ok" in state && state.ok;

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      {saved && <p className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">Saved.</p>}

      <Field label="Church name" name="name" icon={Buildings} required defaultValue={church.name} />
      <Field
        label="Denomination (optional)"
        name="denomination"
        defaultValue={church.denomination ?? ""}
        placeholder="Non-denominational, Baptist, ..."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Service times (optional)"
          name="serviceTimes"
          icon={Clock}
          defaultValue={church.serviceTimes ?? ""}
          placeholder="Sundays at 10am"
        />
        <Field
          label="Languages (optional)"
          name="languages"
          icon={Translate}
          defaultValue={church.languages ?? ""}
          placeholder="English, Mandarin"
        />
      </div>
      <TextAreaField label="Short description (optional)" name="bio" defaultValue={church.bio ?? ""} />
      <Field label="Website (optional)" name="website" icon={Globe} defaultValue={church.website ?? ""} />

      <LocationPicker
        title="Church location (optional)"
        helpText="Add an address and drop a pin so visitors can find you on the discovery map."
        defaultAddress={church.address ?? undefined}
        defaultLat={church.locationLat}
        defaultLng={church.locationLng}
      />

      <SubmitButton pendingText="Saving…" className="w-full">
        Save changes
      </SubmitButton>
    </form>
  );
}
