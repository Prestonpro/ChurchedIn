import Link from "next/link";
import { UsersThree, Translate, Sparkle, Heart, Clock, EnvelopeSimple, Prohibit, ChatCircleDots, LinkedinLogo, FacebookLogo, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listMentorsForChurch, listConnectionsAsStudent, listBlockedUsers } from "@/lib/queries";
import { formatTenure } from "@/lib/tenure";
import { LinkButton } from "@/components/ui/Button";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { BlockButton } from "@/components/BlockButton";
import { UnblockButton } from "@/components/UnblockButton";
import { EndConnectionButton, CancelRequestButton } from "@/components/ConnectionActions";
import { MeetingPlanEditor } from "@/components/MeetingPlanEditor";
import { ConnectionRequestForm } from "./ConnectionRequestForm";
import { CONNECTION_STATUS, ROLES } from "@/lib/constants";

function tags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function sharedTags(a: string[], b: string[]): Set<string> {
  const bLower = new Set(b.map((t) => t.toLowerCase()));
  return new Set(a.filter((t) => bLower.has(t.toLowerCase())));
}

export default async function MentorDirectoryPage() {
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
          body="Check back soon — church members haven't signed up to be a friend yet."
        />
      ) : (
        <div className="grid items-start gap-4 sm:grid-cols-2">
          {rankedMentors.map(({ mentor: m, shared }, i) => {
            const connection = connectionByMentor.get(m.userId);
            return (
              <Card
                key={m.id}
                interactive
                className="flex animate-fade-up flex-col"
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/profile/${m.userId}`} className="flex items-center gap-3 hover:opacity-80">
                    <Avatar name={m.user.name} />
                    <div>
                      <h2 className="font-bold text-ink hover:text-brand-700 hover:underline">{m.user.name}</h2>
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
                  <BlockButton userId={m.userId} name={m.user.name} />
                </div>
                {m.user.bio && <p className="mt-3 text-sm text-ink-soft">{m.user.bio}</p>}
                
                {(m.jobTitle || m.company || m.industry) && (
                  <p className="mt-2 text-sm text-ink-muted">
                    {[m.jobTitle, m.company, m.industry].filter(Boolean).join(" • ")}
                  </p>
                )}

                {m.linkedinUrl && (
                  <a
                    href={m.linkedinUrl.startsWith('http') ? m.linkedinUrl : `https://${m.linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    <LinkedinLogo className="size-4" /> LinkedIn
                  </a>
                )}
                {m.facebookUrl && (
                  <a
                    href={m.facebookUrl.startsWith('http') ? m.facebookUrl : `https://${m.facebookUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
                  >
                    <FacebookLogo className="size-4" /> Facebook
                  </a>
                )}
                {m.instagramUrl && (
                  <a
                    href={m.instagramUrl.startsWith('http') ? m.instagramUrl : `https://${m.instagramUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-pink-600 hover:underline"
                  >
                    <InstagramLogo className="size-4" /> Instagram
                  </a>
                )}

                {(m.languages || m.interests || m.hobbies) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.languages &&
                      tags(m.languages).map((t) => (
                        <span
                          key={`lang-${t}`}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            shared.has(t)
                              ? "bg-brand-600 text-white ring-2 ring-brand-200"
                              : "bg-brand-50 text-brand-700"
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
                          <Sparkle weight="bold" className="size-3" /> {t}
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
                      <p className="flex items-center gap-1.5 text-sm text-ink-soft">
                        <EnvelopeSimple weight="bold" className="size-4 shrink-0 text-ink-faint" />
                        {connection.mentor.email}
                      </p>
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
          })}
        </div>
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
