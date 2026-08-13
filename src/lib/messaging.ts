import { REQUEST_STATUS, type RequestStatus } from "@/lib/constants";

/**
 * Whether a new message can be sent in this request's conversation.
 * CLAIMED only, and never when the pair is blocked — a block must close off
 * messaging as completely as it closes off everything else (safety rule 2).
 */
export function canSendMessage(status: RequestStatus, isBlocked: boolean): boolean {
  return status === REQUEST_STATUS.CLAIMED && !isBlocked;
}

/**
 * Whether the conversation's existing history can even be viewed. Wider than
 * canSendMessage on purpose: a COMPLETED or CANCELLED request keeps its
 * thread visible, read-only — finishing or cancelling a request is often
 * exactly the moment someone wants to look back at it or report it, so
 * hiding the history at that point would work against the safety rule it
 * exists to serve. A block still overrides everything, same as
 * canSendMessage. Safe to key on status alone here (unlike
 * requestContactVisible, which also checks respondedAt) — a Conversation
 * row only ever gets lazy-created once a request has genuinely passed
 * through CLAIMED, so by the time one exists, status alone is enough.
 */
export function canViewConversation(status: RequestStatus, isBlocked: boolean): boolean {
  if (isBlocked) return false;
  return (
    status === REQUEST_STATUS.CLAIMED ||
    status === REQUEST_STATUS.COMPLETED ||
    status === REQUEST_STATUS.CANCELLED
  );
}

export type MessageForUnreadCheck = { senderId: string; readAt: Date | null };

/** Count of messages in a thread the viewer hasn't read — anything not sent
 * by them with no readAt yet. */
export function unreadCountFor(messages: MessageForUnreadCheck[], viewerId: string): number {
  return messages.filter((m) => m.senderId !== viewerId && m.readAt === null).length;
}

/**
 * Whether this new message should trigger an email notification. True only
 * when the recipient had zero unread messages in this thread already —
 * self-resetting once they read it, so a fast back-and-forth conversation
 * doesn't send one email per reply, but going quiet and getting a new
 * message later does. `recipientUnreadCountBefore` is the count computed
 * immediately before the new message is created, i.e. it excludes it.
 */
export function shouldNotifyByEmail(recipientUnreadCountBefore: number): boolean {
  return recipientUnreadCountBefore === 0;
}
