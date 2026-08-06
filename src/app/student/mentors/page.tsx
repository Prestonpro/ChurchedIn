import Link from "next/link";
import type { Metadata } from "next";
import { UsersThree, UserPlus, Translate, Star, Heart, Clock, Prohibit, ChatCircleDots } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listMentorsForChurch, listConnectionsAsStudent, listBlockedUsers } from "@/lib/queries";
import { formatTenure } from "@/lib/tenure";
import { tags } from "@/lib/tags";
import { LinkButton } from "@/components/ui/Button";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SocialIconLink } from "@/components/ui/SocialIconLink";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ContactEmail } from "@/components/ui/ContactEmail";
import { EmptyState } from "@/components/ui/EmptyState";
import { UnblockButton } from "@/components/UnblockButton";
import { EndConnectionButton, CancelRequestButton } from "@/components/ConnectionActions";
import { MeetingPlanEditor } from "@/components/MeetingPlanEditor";
import { ConnectionRequestForm } from "./ConnectionRequestForm";
import { CONNECTION_STATUS, ROLES, roleLabel, type Role } from "@/lib/constants";

function sharedTags(a: string[], b: string[]): Set<string> {
  const bLower = new Set(b.map((t) => t.toLowerCase()));
  return new Set(a.filter((t) => bLower.has(t.toLowerCase())));
}

type RankedMentor = {
  mentor: Awaited<ReturnType<typeof listMentorsForChurch>>[number];
  shared: Set<string>;
};
type Connection = Awaited<ReturnType<typeof listConnectionsAsStudent>>[number];

function MentorCard({
  mentor: m,
  shared,
  connection,
  delayMs,
  isFriend,
}: {
  mentor: RankedMentor["mentor"];
  shared: Set<string>;
  connection: Connection | undefined;
  delayMs: number;
  /** A tester couldn't tell the "Your friends" and "Add friends" sections
   * apart by their section headers alone — the cards themselves looked
   * identical. A soft brand-tinted left border + background on confirmed
   * friends only is the fix, not a heavier treatment: this still has to
   * read as "the same kind of card, just yours" rather than two visually
   * unrelated components. */
  isFriend: boolean;
}) {
  return (
    <Card
      interactive
      className={`flex h-full animate-fade-up flex-col ${
        isFriend ? "border-l-4 border-l-success bg-success-soft/30" : ""
      }`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <Link href={`/profile/${m.userId}`} className="flex items-center gap-3 hover:opacity-80">
        <Avatar name={m.user.name} src={m.user.photoUrl} />
        <div>
          <h2 className="flex items-center gap-1 font-bold text-ink hover:text-brand-700 hover:underline">
            {m.user.name}
            {m.user.verified && <VerifiedBadge />}
          </h2>
          <Badge tone={m.role === ROLES.CHURCH_ADMIN ? "brand" : "neutral"} className="mt-0.5">
            {roleLabel(m.role as Role)}
          </Badge>
          {shared.size > 0 && (
            <p className="flex items-center gap-1 text-xs font-medium text-brand-600">
              <Translate weight="bold" className="size-3" /> Speaks{" "}
              {Array.from(shared).join(", ")}, like you
            </p>
          )}
          <p className="flex items-center gap-1 text-xs text-ink-faint">
            <Clock weight="bold" className="size-3" /> {formatTenure(m.memberSince)}
          </p>
        </div>
      </Link>
      {m.user.bio && <p className="mt-3 text-sm text-ink-soft">{m.user.bio}</p>}

      {(m.jobTitle || m.company || m.industry) && (
        <p className="mt-2 text-sm text-ink-muted">
          {[m.jobTitle, m.company, m.industry].filter(Boolean).join(" • ")}
        </p>
      )}

      {(m.linkedinUrl || m.facebookUrl || m.instagramUrl) && (
        <div className="mt-2 flex items-center gap-2">
          {m.linkedinUrl && <SocialIconLink href={m.linkedinUrl} label="LinkedIn" brand="linkedin" />}
          {m.facebookUrl && <SocialIconLink href={m.facebookUrl} label="Facebook" brand="facebook" />}
          {m.instagramUrl && <SocialIconLink href={m.instagramUrl} label="Instagram" brand="instagram" />}
        </div>
      )}

      {(m.languages || m.interests || m.hobbies) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {m.languages &&
            tags(m.languages).map((t) => (
              <span
                key={`lang-${t}`}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  shared.has(t) ? "bg-brand-600 text-white ring-2 ring-brand-200" : "bg-brand-50 text-brand-700"
                }`}
              >
                <Translate weight="bold" className="size-3" /> {t}
              </span>
            ))}
          {m.interests &&
            tags(m.interests).map((t) => (
              <span
                key={`int-${t}`}
                className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-700"
              >
                <Star weight="bold" className="size-3" /> {t}
              </span>
            ))}
          {m.hobbies &&
            tags(m.hobbies).map((t) => (
              <span
                key={`hob-${t}`}
                className="inline-flex items-center gap-1 rounded-full bg-cat-coffee-soft px-2.5 py-1 text-xs font-medium text-cat-coffee"
              >
                <Heart weight="bold" className="size-3" /> {t}
              </span>
            ))}
        </div>
      )}

      <div className="mt-4 flex-1 border-t border-line pt-4">
        {!connection && <ConnectionRequestForm mentorId={m.userId} />}
        {connection?.status === CONNECTION_STATUS.PENDING && (
          <div className="space-y-2">
            <Badge tone="warning">Request pending</Badge>
            <CancelRequestButton connectionId={connection.id} />
          </div>
        )}
        {connection?.status === CONNECTION_STATUS.ACCEPTED && (
          <div className="space-y-2.5">
            <Badge tone="success">Connected</Badge>
            {connection.mentor.email && <ContactEmail email={connection.mentor.email} size="sm" />}
            <LinkButton href={`/messages/${connection.id}`} variant="secondary" size="sm">
              <ChatCircleDots weight="bold" className="size-4" /> Message
            </LinkButton>
            <MeetingPlanEditor connectionId={connection.id} plan={connection.meetingPlan} />
            <EndConnectionButton connectionId={connection.id} />
          </div>
        )}
        {connection?.status === CONNECTION_STATUS.DECLINED && (
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">
              This friend wasn&apos;t able to connect last time. You can try again.
            </p>
            <ConnectionRequestForm mentorId={m.userId} />
          </div>
        )}
        {connection?.status === CONNECTION_STATUS.ENDED && (
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">This connection has ended.</p>
            <LinkButton href={`/messages/${connection.id}`} variant="ghost" size="sm">
              <ChatCircleDots weight="bold" className="size-4" /> View past messages
            </LinkButton>
          </div>
        )}
      </div>
    </Card>
  );
}

export const metadata: Metadata = { title: "Friends" };

export default async function MentorDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const activeTab = rawTab === "add" ? "add" : "friends";
  const user = await requireRole(ROLES.STUDENT);
  if (!user.activeMembership) {
    return (
      <AuthShell user={user}>
        <EmptyState
          icon={UsersThree}
          title="Join a church to meet your friends"
          body="Enter a join code to get started."
          action={
            <LinkButton href="/join" size="sm">
              Enter a join code
            </LinkButton>
          }
        />
      </AuthShell>
    );
  }

  const [mentors, myConnections, blockedUsers, studentProfile] = await Promise.all([
    listMentorsForChurch(user.activeMembership.churchId, user.id),
    listConnectionsAsStudent(user.id),
    listBlockedUsers(user.id),
    prisma.studentProfile.findUnique({ where: { userId: user.id }, select: { languages: true } }),
  ]);
  const connectionByMentor = new Map(myConnections.map((c) => [c.mentorId, c]));

  // Shared-language mentors surface first — this was previously just
  // whatever order the query returned, with no way to tell at a glance
  // who you could actually talk to right away.
  const myLanguages = studentProfile?.languages ? tags(studentProfile.languages) : [];
  const rankedMentors = mentors
    .map((m) => ({ mentor: m, shared: sharedTags(m.languages ? tags(m.languages) : [], myLanguages) }))
    .sort((a, b) => {
      if (a.shared.size !== b.shared.size) return b.shared.size - a.shared.size;
      return 0;
    });

  // Split into "your friends" (an accepted connection) and everyone else
  // you could still add — these used to render mixed together in one grid,
  // making it hard to tell at a glance who you're actually friends with
  // yet vs. who's just available to reach out to.
  const currentFriends = rankedMentors.filter(
    ({ mentor: m }) => connectionByMentor.get(m.userId)?.status === CONNECTION_STATUS.ACCEPTED,
  );
  const addFriends = rankedMentors.filter(
    ({ mentor: m }) => connectionByMentor.get(m.userId)?.status !== CONNECTION_STATUS.ACCEPTED,
  );

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Friends</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Browse church members ready to be your friend at {user.activeMembership.church.name}.
        </p>
      </div>

      {mentors.length === 0 ? (
        <EmptyState
          icon={UsersThree}
          title="No friends listed yet"
          body="Check back soon. Church members haven't signed up to be a friend yet."
        />
      ) : (
        <>
          {/* Real tabs, not two stacked sections — a tester couldn't tell
              "Your friends" and "Add friends" apart when both rendered on
              screen at once. Plain links + a query param (not client-side
              state) so switching tabs works without JavaScript too, same
              as the rest of this app's server-rendered navigation. */}
          <div role="tablist" aria-label="Friends" className="mb-6 inline-flex gap-1 rounded-full border border-line bg-paper p-1">
            <Link
              href="?tab=friends"
              role="tab"
              aria-selected={activeTab === "friends"}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-brand ${
                activeTab === "friends" ? "bg-white text-brand-700 shadow-card" : "text-ink-muted hover:text-ink"
              }`}
            >
              <UsersThree weight="bold" className="size-4" /> Your friends ({currentFriends.length})
            </Link>
            <Link
              href="?tab=add"
              role="tab"
              aria-selected={activeTab === "add"}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-brand ${
                activeTab === "add" ? "bg-white text-brand-700 shadow-card" : "text-ink-muted hover:text-ink"
              }`}
            >
              <UserPlus weight="bold" className="size-4" /> Add friends ({addFriends.length})
            </Link>
          </div>

          {activeTab === "friends" ? (
            currentFriends.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">
                You haven&apos;t connected with anyone yet. Switch to the Add friends tab to send a request.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {currentFriends.map(({ mentor: m, shared }, i) => (
                  <MentorCard
                    key={m.id}
                    mentor={m}
                    shared={shared}
                    connection={connectionByMentor.get(m.userId)}
                    delayMs={Math.min(i * 50, 300)}
                    isFriend
                  />
                ))}
              </div>
            )
          ) : addFriends.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">
              You&apos;re already friends with everyone here!
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {addFriends.map(({ mentor: m, shared }, i) => (
                <MentorCard
                  key={m.id}
                  mentor={m}
                  shared={shared}
                  connection={connectionByMentor.get(m.userId)}
                  delayMs={Math.min(i * 50, 300)}
                  isFriend={false}
                />
              ))}
            </div>
          )}
        </>
      )}

      {blockedUsers.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-ink-faint">
            <Prohibit weight="bold" className="size-4" /> Blocked
          </h2>
          <div className="space-y-2">
            {blockedUsers.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={b.blocked.name} size="sm" />
                  <p className="text-sm font-semibold text-ink">{b.blocked.name}</p>
                </div>
                <UnblockButton userId={b.blockedId} />
              </div>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
