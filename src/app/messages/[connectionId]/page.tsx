import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getConversationForConnection } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Avatar } from "@/components/ui/Avatar";
import { CONNECTION_STATUS } from "@/lib/constants";
import { MessageForm } from "./MessageForm";
import { ReportConversationButton } from "./ReportConversationButton";

export default async function ConversationPage({ params }: { params: Promise<{ connectionId: string }> }) {
  const { connectionId } = await params;
  const user = await requireUser();

  const conversation = await getConversationForConnection(connectionId, user.id);
  if (!conversation) {
    notFound();
  }

  // Marking the other party's messages read as part of loading the thread,
  // the same "write during the read" tradeoff /events' page.tsx already
  // makes for its own "seen" stamp — simpler than a separate round-trip
  // action fired from the client on mount, at the cost of a GET doing a
  // write. Scoped to messages from the other party only, so opening your
  // own sent messages never touches their readAt.
  await prisma.message.updateMany({
    where: { conversationId: conversation.id, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <AuthShell user={user}>
      <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/messages"
              aria-label="Back to messages"
              className="flex size-9 items-center justify-center rounded-lg text-ink-faint transition-brand hover:bg-paper hover:text-ink"
            >
              <ArrowLeft weight="bold" className="size-4.5" />
            </Link>
            <Avatar name={conversation.otherParty.name} size="sm" />
            <div>
              <p className="font-bold text-ink">{conversation.otherParty.name}</p>
              {conversation.connectionStatus === CONNECTION_STATUS.ENDED && (
                <p className="text-xs text-ink-faint">This connection has ended</p>
              )}
            </div>
          </div>
          <ReportConversationButton connectionId={connectionId} />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {conversation.messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-faint">
              No messages yet — say hello to {conversation.otherParty.name.split(" ")[0]}!
            </p>
          ) : (
            conversation.messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      mine ? "bg-brand-600 text-white" : "bg-paper text-ink"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-ink-faint"}`}>
                      {m.createdAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {conversation.canSend ? (
          <MessageForm connectionId={connectionId} />
        ) : (
          <p className="border-t border-line bg-paper px-4 py-3 text-center text-sm text-ink-muted">
            This connection has ended — you can still read the history above, but you can&apos;t send new
            messages.
          </p>
        )}
      </div>
    </AuthShell>
  );
}
