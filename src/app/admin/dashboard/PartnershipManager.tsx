"use client";

import { useActionState, useState, useTransition } from "react";
import { Ticket, Check, X, HandsClapping } from "@phosphor-icons/react/dist/ssr";
import {
  requestPartnershipAction,
  respondToPartnershipAction,
  endPartnershipAction,
} from "@/lib/actions/churchPartnerships";
import { Field, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Badge } from "@/components/ui/Badge";
import { PARTNERSHIP_STATUS } from "@/lib/constants";

type Partnership = {
  id: string;
  status: string;
  isIncoming: boolean;
  otherChurch: { id: string; name: string };
};

/** Admin-only cross-church collaboration panel: a join-code request form,
 * plus the three states a partnership can be in from this church's point
 * of view (incoming request to respond to, outgoing request awaiting a
 * reply, or an already-accepted partnership you can end). */
export function PartnershipManager({ partnerships }: { partnerships: Partnership[] }) {
  const [requestState, requestAction] = useActionState(requestPartnershipAction, undefined);
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  function respond(id: string, accept: boolean) {
    setPendingId(id);
    setActionError(undefined);
    startTransition(async () => {
      const result = await respondToPartnershipAction(id, accept);
      setPendingId(null);
      if (result && "error" in result) setActionError(result.error);
    });
  }

  function end(id: string) {
    setPendingId(id);
    setActionError(undefined);
    startTransition(async () => {
      const result = await endPartnershipAction(id);
      setPendingId(null);
      if (result && "error" in result) setActionError(result.error);
    });
  }

  const requestSent = !!requestState && "ok" in requestState && requestState.ok;
  const accepted = partnerships.filter((p) => p.status === PARTNERSHIP_STATUS.ACCEPTED);
  const incoming = partnerships.filter((p) => p.status === PARTNERSHIP_STATUS.PENDING && p.isIncoming);
  const outgoing = partnerships.filter((p) => p.status === PARTNERSHIP_STATUS.PENDING && !p.isIncoming);

  return (
    <div className="space-y-4">
      <FormError message={actionError} />

      {incoming.length > 0 && (
        <ul className="space-y-2">
          {incoming.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5"
            >
              <span className="text-sm font-medium text-ink">
                {p.otherChurch.name} wants to partner with you
              </span>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => respond(p.id, true)}
                  disabled={pending && pendingId === p.id}
                  className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-brand hover:bg-brand-700 disabled:opacity-50"
                >
                  <Check weight="bold" className="size-3.5" /> Accept
                </button>
                <button
                  type="button"
                  onClick={() => respond(p.id, false)}
                  disabled={pending && pendingId === p.id}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-faint transition-brand hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                >
                  <X weight="bold" className="size-3.5" /> Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {outgoing.length > 0 && (
        <ul className="space-y-2">
          {outgoing.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5"
            >
              <span className="text-sm text-ink-soft">
                Waiting on <span className="font-medium text-ink">{p.otherChurch.name}</span> to respond
              </span>
              <button
                type="button"
                onClick={() => end(p.id)}
                disabled={pending && pendingId === p.id}
                className="shrink-0 text-xs font-semibold text-ink-faint transition-brand hover:text-danger disabled:opacity-50"
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}

      {accepted.length > 0 && (
        <ul className="space-y-2">
          {accepted.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <HandsClapping weight="fill" className="size-4 text-brand-600" />
                {p.otherChurch.name}
                <Badge tone="brand">Partnered</Badge>
              </span>
              <button
                type="button"
                onClick={() => end(p.id)}
                disabled={pending && pendingId === p.id}
                className="shrink-0 text-xs font-semibold text-ink-faint transition-brand hover:text-danger disabled:opacity-50"
              >
                End partnership
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={requestAction} className="flex items-start gap-2">
        <div className="flex-1">
          <FormError message={requestState && "error" in requestState ? requestState.error : undefined} />
          {requestSent && (
            <p className="mb-2 text-xs font-medium text-success">Request sent!</p>
          )}
          <Field
            label="Partner with another church"
            name="joinCode"
            icon={Ticket}
            placeholder="Their join code"
            hint="Ask their church leader for it — same code volunteers and students use to join."
            className="uppercase tracking-widest"
            maxLength={12}
          />
        </div>
        <div className="pt-7">
          <SubmitButton size="sm" pendingText="Sending…">
            Send request
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
