import type { Metadata } from "next";
import Link from "next/link";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { listConversationsForUser } from "@/lib/queries";
import { unreadCountFor } from "@/lib/messaging";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { CONNECTION_STATUS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await listConversationsForUser(user.id);

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Messages</h1>
        <p className="mt-1 text-sm text-ink-muted">Conversations with friends you&apos;re connected with.</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={ChatCircleDots}
          title="No conversations yet"
          body="Once a friend request is accepted, you can message each other here."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            // Only the single most recent message is loaded here (see
            // listConversationsForUser), so this checks just that one — good
            // enough to decide the row's unread dot, unlike the nav badge
            // which needs the real total (countUnreadMessagesForUser).
            const isUnread = c.lastMessage ? unreadCountFor([c.lastMessage], user.id) > 0 : false;
            return (
              <Link key={c.id} href={`/messages/${c.connectionId}`}>
                <Card interactive className="flex items-center gap-3">
                  <Avatar name={c.otherParty.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-ink">{c.otherParty.name}</p>
                      <span className="shrink-0 text-xs text-ink-faint">
                        {c.lastMessageAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`truncate text-sm ${isUnread ? "font-semibold text-ink" : "text-ink-muted"}`}>
                      {c.lastMessage ? c.lastMessage.body : "No messages yet — say hello!"}
                    </p>
                    {c.connectionStatus === CONNECTION_STATUS.ENDED && (
                      <p className="mt-0.5 text-xs text-ink-faint">This connection has ended</p>
                    )}
                  </div>
                  {isUnread && <span className="size-2.5 shrink-0 rounded-full bg-accent-500" />}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </AuthShell>
  );
}
