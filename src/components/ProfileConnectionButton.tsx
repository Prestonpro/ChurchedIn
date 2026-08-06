"use client";

import { useState, useTransition, useActionState } from "react";
import { Check, ChatCircleDots, ArrowCounterClockwise, PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";
import { requestConnectionAction } from "@/lib/actions/connections";
import { cancelConnectionRequestAction, endConnectionAction } from "@/lib/actions/connections";
import { Button, LinkButton } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

type Connection = {
  id: string;
  status: string;
  conversationId?: string | null;
};

export function ProfileConnectionButton({
  mentorId,
  isOpenToMentor,
  connection,
  email,
}: {
  mentorId: string;
  isOpenToMentor: boolean;
  connection: Connection | null;
  email: string | null;
}) {
  const [requestState, requestAction] = useActionState(requestConnectionAction, undefined);
  const [cancelPending, startCancelTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | undefined>();
  const [endPending, startEndTransition] = useTransition();
  const [endError, setEndError] = useState<string | undefined>();

  function cancelRequest() {
    if (!connection) return;
    if (!confirm("Cancel this friend request?")) return;
    setCancelError(undefined);
    startCancelTransition(async () => {
      const result = await cancelConnectionRequestAction(connection.id);
      if (result && "error" in result) setCancelError(result.error);
    });
  }

  function endConnection() {
    if (!connection) return;
    if (!confirm("End this friendship?")) return;
    setEndError(undefined);
    startEndTransition(async () => {
      const result = await endConnectionAction(connection.id);
      if (result && "error" in result) setEndError(result.error);
    });
  }

  // No connection yet — show Add Friend if they're open to it
  if (!connection) {
    if (!isOpenToMentor) return null;
    return (
      <div className="pt-4 mt-4 border-t border-line">
        <FormError message={requestState && "error" in requestState ? requestState.error : undefined} />
        <form action={requestAction} className="space-y-3">
          <input type="hidden" name="mentorId" value={mentorId} />
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
            <PaperPlaneRight weight="bold" className="size-4" /> Send friend request
          </Button>
        </form>
      </div>
    );
  }

  if (connection.status === "PENDING") {
    return (
      <div className="space-y-2">
        <Badge tone="warning">Request sent</Badge>
        <FormError message={cancelError} />
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-muted hover:bg-danger-soft hover:text-danger"
          disabled={cancelPending}
          onClick={cancelRequest}
        >
          {cancelPending ? "Cancelling…" : "Cancel request"}
        </Button>
      </div>
    );
  }

  if (connection.status === "ACCEPTED") {
    return (
      <div className="space-y-2">
        <Badge tone="success">
          <Check weight="bold" className="size-3" /> Friends
        </Badge>
        {email && (
          <p className="text-sm text-ink-muted">{email}</p>
        )}
        {connection.conversationId && (
          <LinkButton href={`/messages/${connection.id}`} variant="secondary" size="sm">
            <ChatCircleDots weight="bold" className="size-4" /> Message
          </LinkButton>
        )}
        <FormError message={endError} />
        <Button
          variant="ghost"
          size="sm"
          className="text-ink-muted hover:bg-danger-soft hover:text-danger"
          disabled={endPending}
          onClick={endConnection}
        >
          {endPending ? "Ending…" : "End friendship"}
        </Button>
      </div>
    );
  }

  if (connection.status === "DECLINED") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-ink-muted">
          This person wasn&apos;t able to connect last time. You can try again.
        </p>
        <form action={requestAction}>
          <input type="hidden" name="mentorId" value={mentorId} />
          <Button type="submit" size="sm" variant="secondary">
            <ArrowCounterClockwise weight="bold" className="size-4" /> Try again
          </Button>
        </form>
      </div>
    );
  }

  if (connection.status === "ENDED") {
    return (
      <p className="text-sm text-ink-muted">This connection has ended.</p>
    );
  }

  return null;
}
