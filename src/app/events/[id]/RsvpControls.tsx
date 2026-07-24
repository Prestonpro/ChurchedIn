"use client";

import { useActionState } from "react";
import { CheckCircle, HourglassMedium, ProhibitInset } from "@phosphor-icons/react/dist/ssr";
import { rsvpToEventAction, cancelRsvpAction } from "@/lib/actions/rsvps";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/components/ui/Field";
import { RSVP_STATUS, type RsvpStatus } from "@/lib/constants";

export function RsvpControls({
  eventId,
  currentStatus,
  roleLabel,
  cap,
}: {
  eventId: string;
  currentStatus: RsvpStatus | null;
  roleLabel: "attendee" | "helper";
  /** This role bucket's capacity — 0 means "not accepting", not "unlimited" (null is unlimited). */
  cap: number | null;
}) {
  const rsvp = rsvpToEventAction.bind(null, eventId);
  const cancel = cancelRsvpAction.bind(null, eventId);
  const [rsvpState, rsvpAction] = useActionState(rsvp, undefined);
  const [cancelState, cancelFormAction] = useActionState(cancel, undefined);

  if (currentStatus === null && cap === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-paper px-4 py-3 text-sm font-medium text-ink-muted">
        <ProhibitInset weight="bold" className="size-5 shrink-0" />
        {roleLabel === "helper"
          ? "This event isn't looking for helpers."
          : "This event isn't open for attendees."}
      </div>
    );
  }

  if (currentStatus === RSVP_STATUS.CONFIRMED || currentStatus === RSVP_STATUS.WAITLISTED) {
    const confirmed = currentStatus === RSVP_STATUS.CONFIRMED;
    return (
      <div className="space-y-3">
        <FormError message={cancelState && "error" in cancelState ? cancelState.error : undefined} />
        <div
          className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
            confirmed ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
          }`}
        >
          {confirmed ? (
            <CheckCircle weight="fill" className="size-5 shrink-0" />
          ) : (
            <HourglassMedium weight="fill" className="size-5 shrink-0" />
          )}
          {confirmed
            ? `You're confirmed as ${roleLabel === "helper" ? "a helper" : "an attendee"}.`
            : "You're on the waitlist. We'll email you if a spot opens up."}
        </div>
        <form action={cancelFormAction}>
          <SubmitButton variant="secondary" size="sm" pendingText="Cancelling…">
            Cancel my RSVP
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FormError message={rsvpState && "error" in rsvpState ? rsvpState.error : undefined} />
      <form action={rsvpAction}>
        <SubmitButton pendingText="RSVPing…">
          {roleLabel === "helper" ? "I'm in to help!" : "I'm in!"}
        </SubmitButton>
      </form>
    </div>
  );
}
