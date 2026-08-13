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
import { REQUEST_STATUS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = (await listConversationsForUser(user.id)).filter((c) => c.otherParty !== null);

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Messages</h1>
        <p className="mt-1 text-sm text-ink-muted">Conversations with people you&apos;re connected with.</p>
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={ChatCircleDots}
          title="No conversations yet"
          body="Once a request is claimed or accepted, you can message each other here."
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            // Only the single most recent message is loaded here (see
            // listConversationsForUser), so this checks just that one — good
            // enough to decide the row's unread dot, unlike the nav badge
            // which needs the real total (countUnreadMessagesForUser).
            const isUnread = c.lastMessage ? unreadCountFor([c.lastMessage], user.id) > 0 : false;
            const otherParty = c.otherParty!;
            return (
              <Link key={c.id} href={`/messages/${c.requestId}`}>
                <Card interactive className="flex items-center gap-3">
                  <Avatar name={otherParty.name} src={otherParty.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-ink">{otherParty.name}</p>
                      <span className="shrink-0 text-xs text-ink-faint">
                        {c.lastMessageAt.toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`truncate text-sm ${isUnread ? "font-semibold text-ink" : "text-ink-muted"}`}>
                      {c.lastMessage ? c.lastMessage.body : "No messages yet. Say hello!"}
                    </p>
                    {(c.requestStatus === REQUEST_STATUS.COMPLETED ||
                      c.requestStatus === REQUEST_STATUS.CANCELLED) && (
                      <p className="mt-0.5 text-xs text-ink-faint">
                        This request has {c.requestStatus === REQUEST_STATUS.COMPLETED ? "been completed" : "ended"}
                      </p>
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
