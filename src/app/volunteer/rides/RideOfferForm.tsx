"use client";

import { useActionState, useState } from "react";
import { Clock, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { createRideOfferAction } from "@/lib/actions/rideOffers";
import { Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { MAX_RIDE_OFFER_CAPACITY } from "@/lib/constants";

/** Same remount-on-success pattern as RideRequestForm — the new offer
 * appearing in the list below is the confirmation. */
export function RideOfferForm() {
  const [state, formAction] = useActionState(createRideOfferAction, undefined);
  const [formKey, setFormKey] = useState(0);
  const [lastState, setLastState] = useState(state);

  if (state !== lastState) {
    setLastState(state);
    if (state && "ok" in state && state.ok) {
      setFormKey((k) => k + 1);
    }
  }

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Date" name="date" type="date" required />
        <Field label="Time" name="time" icon={Clock} required placeholder="e.g. 9:00 AM" />
      </div>
      <Field
        label="Seats available"
        name="capacity"
        type="number"
        icon={UsersThree}
        min={1}
        max={MAX_RIDE_OFFER_CAPACITY}
        defaultValue={3}
        required
      />
      <TextAreaField
        label="Anything riders should know? (optional)"
        name="notes"
        placeholder="Where you're leaving from, what to bring, ..."
      />
      <SubmitButton pendingText="Posting…" className="w-full">
        Offer a ride
      </SubmitButton>
    </form>
  );
}
