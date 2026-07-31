"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { newMessageEmail } from "@/lib/emailTemplates";
import { isBlockedPair } from "@/lib/queries";
import { canSendMessage, shouldNotifyByEmail } from "@/lib/messaging";
import { messageSchema, reportConversationSchema, firstIssueMessage } from "@/lib/validation";
import { REPORT_STATUS } from "@/lib/constants";

export type ActionResult = { error: string } | { ok: true } | void;

async function requireConversationParticipant(connectionId: string) {
  const user = await requireUser();
  const conversation = await prisma.conversation.findUnique({
    where: { connectionId },
    include: { connection: { select: { status: true } } },
  });
  if (!conversation) {
    return { user, conversation: null, error: "That conversation doesn't exist." };
  }
  if (conversation.studentId !== user.id && conversation.mentorId !== user.id) {
    return { user, conversation: null, error: "You don't have access to this conversation." };
  }
  return { user, conversation, error: null };
}

export async function sendMessageAction(
  connectionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, conversation, error } = await requireConversationParticipant(connectionId);
  if (!conversation) {
    return { error: error ?? "That conversation doesn't exist." };
  }

  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const recipientId = conversation.studentId === user.id ? conversation.mentorId : conversation.studentId;
  // Blocked-pair and status checks live here (not just at the conversation
  // query layer) because sending is a stricter gate than viewing — an ENDED
  // connection can still be *read*, per canViewConversation, but not
  // written to. Re-checked on every send rather than trusted from an earlier
  // page load, since either could have changed since.
  const isBlocked = await isBlockedPair(user.id, recipientId);
  if (!canSendMessage(conversation.connection.status, isBlocked)) {
    return { error: "You can't send messages in this conversation." };
  }

  // Counted before the insert below, not after — shouldNotifyByEmail needs
  // to know whether the recipient already had something unread waiting
  // *before* this message, so a fast back-and-forth doesn't email on every
  // reply but going quiet and getting a new message later does.
  const recipientUnreadCountBefore = await prisma.message.count({
    where: { conversationId: conversation.id, senderId: user.id, readAt: null },
  });

  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId: conversation.id, senderId: user.id, body: parsed.data.body },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  if (shouldNotifyByEmail(recipientUnreadCountBefore)) {
    const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { email: true } });
    if (recipient) {
      const email = newMessageEmail({ senderName: user.name, connectionId });
      await sendEmail({ to: recipient.email, subject: email.subject, body: email.text, html: email.html });
    }
  }

  revalidatePath(`/messages/${connectionId}`);
  revalidatePath("/messages");
  return { ok: true };
}

/** Reports a conversation to the church's admins — the reporter's own church
 * (which is always one of the two participants' shared church, the same one
 * stored on the conversation), so it lands in that church's review queue
 * regardless of which participant filed it. */
export async function reportConversationAction(
  connectionId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, conversation, error } = await requireConversationParticipant(connectionId);
  if (!conversation) {
    return { error: error ?? "That conversation doesn't exist." };
  }

  const parsed = reportConversationSchema.safeParse({
    reason: formData.get("reason"),
    details: formData.get("details"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  const reportedUserId = conversation.studentId === user.id ? conversation.mentorId : conversation.studentId;

  await prisma.report.create({
    data: {
      churchId: conversation.churchId,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
      reportedById: user.id,
      reportedUserId,
      conversationId: conversation.id,
      status: REPORT_STATUS.OPEN,
    },
  });

  return { ok: true };
}
