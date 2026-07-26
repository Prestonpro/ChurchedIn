"use client";

import { useActionState, useState } from "react";
import { Car, MapPin, Clock, X } from "@phosphor-icons/react/dist/ssr";
import { createFirstVisitRideRequestAction } from "@/lib/actions/rides";
import { Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";

/**
 * "Need a ride to visit?" from the church profile (and, via a link, the
 * /discover card) — a first-visit ride, routed to this church's
 * volunteers via the same rides board as any other request
 * (listOpenRideRequestsForChurch doesn't distinguish by type). Pre-fills
 * destination with the church's own address/name, per the brief.
 */
export function FirstVisitRideForm({
  churchId,
  defaultDestination,
  autoOpen,
}: {
  churchId: string;
  defaultDestination: string;
  autoOpen: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const action = createFirstVisitRideRequestAction.bind(null, churchId);
  const [state, formAction] = useActionState(action, undefined);

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="w-full">
        <Car weight="bold" className="size-4" /> Need a ride to visit?
      </Button>
    );
  }

  if (state && "ok" in state && state.ok) {
    return (
      <p className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
        Ride request sent! A volunteer at this church will see it on their rides board.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-soft">Request a ride to visit</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex size-6 items-center justify-center rounded-lg text-ink-faint hover:bg-paper"
          aria-label="Close"
        >
          <X weight="bold" className="size-3.5" />
        </button>
      </div>
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field
        label="Where should they pick you up / drop you off?"
        name="destination"
        icon={MapPin}
        required
        defaultValue={defaultDestination}
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Date" name="date" type="date" required />
        <Field label="Time" name="time" icon={Clock} required placeholder="e.g. 10:00 AM" />
      </div>
      <TextAreaField
        label="Anything a volunteer should know? (optional)"
        name="notes"
        placeholder="First time visiting, could use directions and a friendly face!"
      />
      <SubmitButton pendingText="Sending…" className="w-full">
        Request a ride
      </SubmitButton>
    </form>
  );
}
