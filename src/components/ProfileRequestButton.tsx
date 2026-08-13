"use client";

import { useState, useTransition, useActionState } from "react";
import { Check, ChatCircleDots, ArrowCounterClockwise, PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";
import { requestMentorAction, cancelRequestAction } from "@/lib/actions/requests";
import { Button, LinkButton } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { REQUEST_STATUS, type RequestStatus } from "@/lib/constants";

type RequestSummary = {
  id: string;
  status: RequestStatus;
  hasConversation: boolean;
};

/** Replaces ProfileConnectionButton — the Mentorship directory's targeted
 * pick, shown on a volunteer's public profile when a student views it.
 * `request` is the most recent Mentorship HelpRequest between the viewer
 * and this volunteer (there can be several over time, since a re-request
 * creates a new row instead of reviving an old one — see
 * requestState.ts). */
export function ProfileRequestButton({
  claimerId,
  isOpenToMentorship,
  request,
  email,
}: {
  claimerId: string;
  isOpenToMentorship: boolean;
  request: RequestSummary | null;
  email: string | null;
}) {
  const [requestState, requestAction] = useActionState(requestMentorAction, undefined);
  const [cancelPending, startCancelTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | undefined>();

  function cancel() {
    if (!request) return;
    if (!confirm("Cancel this request?")) return;
    setCancelError(undefined);
    startCancelTransition(async () => {
      const result = await cancelRequestAction(request.id);
      if (result && "error" in result) setCancelError(result.error);
    });
  }

  // No request yet (or the last one is fully resolved and terminal) — show
  // "Send request" if they're open to it.
  if (!request || request.status === REQUEST_STATUS.CANCELLED) {
    if (!isOpenToMentorship) return null;
    return (
      <div className="pt-4 mt-4 border-t border-line">
        <FormError message={requestState && "error" in requestState ? requestState.error : undefined} />
        <form action={requestAction} className="space-y-3">
          <input type="hidden" name="claimerId" value={claimerId} />
          <div className="space-y-1">
            <label htmlFor="message" className="block text-sm font-bold text-ink-soft">
              Message (optional)
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Say a little about what you're hoping for."
            />
          </div>
          <Button type="submit" size="sm" className="w-fit">
            <PaperPlaneRight weight="bold" className="size-4" /> Send request
          </Button>
        </form>
      </div>
    );
  }

  if (request.status === REQUEST_STATUS.PENDING) {
    return (
      <div className="space-y-2">
        <Badge tone="warning">Request sent</Badge>
        <FormError message={cancelError} />
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-muted hover:bg-danger-soft hover:text-danger"
          disabled={cancelPending}
          onClick={cancel}
        >
          {cancelPending ? "Cancelling…" : "Cancel request"}
        </Button>
      </div>
    );
  }

  if (request.status === REQUEST_STATUS.CLAIMED) {
    return (
      <div className="space-y-2">
        <Badge tone="success">
          <Check weight="bold" className="size-3" /> Connected
        </Badge>
        {email && <p className="text-sm text-ink-muted">{email}</p>}
        {request.hasConversation && (
          <LinkButton href={`/messages/${request.id}`} variant="secondary" size="sm">
            <ChatCircleDots weight="bold" className="size-4" /> Message
          </LinkButton>
        )}
        <FormError message={cancelError} />
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-muted hover:bg-danger-soft hover:text-danger"
          disabled={cancelPending}
          onClick={cancel}
        >
          {cancelPending ? "Ending…" : "End connection"}
        </Button>
      </div>
    );
  }

  if (request.status === REQUEST_STATUS.DECLINED || request.status === REQUEST_STATUS.COMPLETED) {
    // requestMentorAction allows a fresh request after either of these —
    // DECLINED because the claimer just wasn't available last time,
    // COMPLETED because a naturally-concluded mentorship (e.g. end of
    // semester) isn't permanently closed the way the old ENDED state was.
    return (
      <div className="space-y-2">
        <p className="text-sm text-ink-muted">
          {request.status === REQUEST_STATUS.DECLINED
            ? "This person wasn't able to connect last time. You can try again."
            : "This connection has ended. You can send a new request."}
        </p>
        <form action={requestAction}>
          <input type="hidden" name="claimerId" value={claimerId} />
          <Button type="submit" size="sm" variant="secondary">
            <ArrowCounterClockwise weight="bold" className="size-4" /> Try again
          </Button>
        </form>
      </div>
    );
  }

  return null;
}
