import { CONNECTION_STATUS, type ConnectionStatus } from "@/lib/constants";

/**
 * Whether a new message can be sent in this connection's conversation.
 * ACCEPTED only, and never when the pair is blocked — a block must close off
 * messaging as completely as it closes off everything else (safety rule 2).
 */
export function canSendMessage(status: ConnectionStatus, isBlocked: boolean): boolean {
  return status === CONNECTION_STATUS.ACCEPTED && !isBlocked;
}

/**
 * Whether the conversation's existing history can even be viewed. Wider than
 * canSendMessage on purpose: an ENDED connection keeps its thread visible,
 * read-only — ending a connection is often exactly the moment someone wants
 * to look back at it or report it, so hiding the history at that point would
 * work against the safety rule it exists to serve. A block still overrides
 * everything, same as canSendMessage.
 */
export function canViewConversation(status: ConnectionStatus, isBlocked: boolean): boolean {
  if (isBlocked) return false;
  return status === CONNECTION_STATUS.ACCEPTED || status === CONNECTION_STATUS.ENDED;
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
