"use client";

import { useActionState, useState } from "react";
import { MapPin, Clock } from "@phosphor-icons/react/dist/ssr";
import { createRideRequestAction } from "@/lib/actions/rides";
import { Field, TextAreaField, CheckboxField, FormError } from "@/components/ui/Field";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { SubmitButton } from "@/components/ui/SubmitButton";

/** Remounted (via `key`) after a successful submit to clear all inputs —
 * the freshly created request appearing in the list below is the
 * confirmation, so there's no separate "sent!" banner to go stale. Bumping
 * the key happens during render (comparing against the last-seen state),
 * not in a useEffect, per React's guidance for adjusting state in response
 * to a prop/state change. */
export function RideRequestForm() {
  const [state, formAction] = useActionState(createRideRequestAction, undefined);
  const [formKey, setFormKey] = useState(0);
  const [lastState, setLastState] = useState(state);
  const [destination, setDestination] = useState("");

  if (state !== lastState) {
    setLastState(state);
    if (state && "ok" in state && state.ok) {
      setFormKey((k) => k + 1);
    }
  }

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <LocationAutocomplete
        label="Where do you need to go?"
        name="destination"
        icon={MapPin}
        required
        placeholder="Airport, grocery store, church, ..."
        value={destination}
        onChange={setDestination}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date" name="date" type="date" required />
        <Field label="Time" name="time" icon={Clock} required placeholder="e.g. 2:00 PM" />
      </div>
      <TextAreaField
        label="Anything a volunteer should know? (optional)"
        name="notes"
        placeholder="Flight number, how much luggage, why you need the ride, ..."
      />
      <CheckboxField label="I'd prefer a group ride with other students" name="prefersGroupRide" />
      <SubmitButton pendingText="Sending…" className="w-full">
        Request a ride
      </SubmitButton>
    </form>
  );
}
