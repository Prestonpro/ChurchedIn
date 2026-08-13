import Link from "next/link";
import type { Metadata } from "next";
import {
  UsersThree,
  UserPlus,
  Translate,
  Star,
  Heart,
  Clock,
  Prohibit,
  ChatCircleDots,
  ListChecks,
} from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listOpenMentorshipVolunteers, listRequestsForRequester, listBlockedUsers } from "@/lib/queries";
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
import { RequestActionButton } from "@/components/RequestActionButton";
import { MeetingPlanEditor } from "@/components/MeetingPlanEditor";
import { cancelRequestAction, completeRequestAction } from "@/lib/actions/requests";
import { RequestMentorForm } from "./RequestMentorForm";
import { NewRequestForm } from "./NewRequestForm";
import {
  REQUEST_STATUS,
  REQUEST_CATEGORY,
  REQUEST_CATEGORY_LABELS,
  ROLES,
  roleLabel,
  type Role,
} from "@/lib/constants";

function sharedTags(a: string[], b: string[]): Set<string> {
  const bLower = new Set(b.map((t) => t.toLowerCase()));
  return new Set(a.filter((t) => bLower.has(t.toLowerCase())));
}

type Volunteer = Awaited<ReturnType<typeof listOpenMentorshipVolunteers>>[number];
type MyRequest = Awaited<ReturnType<typeof listRequestsForRequester>>[number];

function MentorCard({
  mentor: m,
  shared,
  request,
  delayMs,
  isConnected,
}: {
  mentor: Volunteer;
  shared: Set<string>;
  request: MyRequest | undefined;
  delayMs: number;
  isConnected: boolean;
}) {
  return (
    // data-testid, not a role/text-based selector — the directory can
    // legitimately list more than one person (e.g. a church admin who
    // hasn't opted out shows up alongside an explicitly opted-in
    // volunteer), so e2e specs need a reliable way to scope an interaction
    // to one specific person's card rather than a page-wide getByLabel/
    // getByRole that assumes there's only one request form on the page.
    <Card
      data-testid="mentor-card"
      interactive
      className={`flex h-full animate-fade-up flex-col ${
        isConnected ? "border-l-4 border-l-success bg-success-soft/30" : ""
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
        {(!request || request.status === REQUEST_STATUS.CANCELLED) && <RequestMentorForm claimerId={m.userId} />}
        {request?.status === REQUEST_STATUS.PENDING && (
          <div className="space-y-2">
            <Badge tone="warning">Request pending</Badge>
            <RequestActionButton
              requestId={request.id}
              action={cancelRequestAction}
              label="Cancel request"
              pendingLabel="Cancelling…"
              variant="ghost"
              confirmMessage="Cancel this request?"
            />
          </div>
        )}
        {request?.status === REQUEST_STATUS.CLAIMED && (
          <div className="space-y-2.5">
            <Badge tone="success">Connected</Badge>
            {request.claimer?.email && <ContactEmail email={request.claimer.email} size="sm" />}
            <LinkButton href={`/messages/${request.id}`} variant="secondary" size="sm">
              <ChatCircleDots weight="bold" className="size-4" /> Message
            </LinkButton>
            <MeetingPlanEditor requestId={request.id} plan={request.meetingPlan} />
            <RequestActionButton
              requestId={request.id}
              action={cancelRequestAction}
              label="End connection"
              pendingLabel="Ending…"
              variant="ghost"
              confirmMessage="End this connection?"
            />
          </div>
        )}
        {request?.status === REQUEST_STATUS.DECLINED && (
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">
              This mentor wasn&apos;t able to connect last time. You can try again.
            </p>
            <RequestMentorForm claimerId={m.userId} />
          </div>
        )}
        {request?.status === REQUEST_STATUS.COMPLETED && (
          <div className="space-y-2">
            <p className="text-sm text-ink-muted">This connection has ended.</p>
            <LinkButton href={`/messages/${request.id}`} variant="ghost" size="sm">
              <ChatCircleDots weight="bold" className="size-4" /> View past messages
            </LinkButton>
          </div>
        )}
      </div>
    </Card>
  );
}

const STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  OPEN: "neutral",
  CLAIMED: "success",
  DECLINED: "danger",
  COMPLETED: "neutral",
  CANCELLED: "neutral",
};

/** Every one of the student's own requests, any category or status —
 * including targeted Mentorship picks (which also show as state on their
 * MentorCard under the Browse mentors tab). Showing them here too, not
 * just there, is what keeps this tab's count matching what it actually
 * lists — a pending pick used to be invisible from the one tab literally
 * called "My requests." */
function MyRequestRow({ request: r }: { request: MyRequest }) {
  return (
    <div className="space-y-2.5 rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{r.title}</p>
          <p className="text-xs text-ink-faint">{REQUEST_CATEGORY_LABELS[r.category]}</p>
        </div>
        <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
      </div>
      {r.description && <p className="text-sm text-ink-soft">{r.description}</p>}

      {r.claimer && (r.status === REQUEST_STATUS.CLAIMED || r.status === REQUEST_STATUS.COMPLETED) && (
        <div className="flex flex-wrap items-center gap-2.5 rounded-lg bg-paper p-2.5">
          <Avatar name={r.claimer.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{r.claimer.name}</p>
            {r.claimer.email && <ContactEmail email={r.claimer.email} size="sm" />}
          </div>
          <LinkButton href={`/messages/${r.id}`} variant="secondary" size="sm">
            <ChatCircleDots weight="bold" className="size-4" /> Message
          </LinkButton>
        </div>
      )}

      {/* A targeted pick awaiting the claimer's response — no contact info
          yet (see the safety rule in requestState.ts), just who it's
          waiting on. */}
      {r.status === REQUEST_STATUS.PENDING && r.claimer && (
        <div className="flex items-center gap-2.5 rounded-lg bg-paper p-2.5">
          <Avatar name={r.claimer.name} size="sm" />
          <p className="text-sm text-ink-muted">Waiting for {r.claimer.name} to respond</p>
        </div>
      )}

      {(r.status === REQUEST_STATUS.OPEN ||
        r.status === REQUEST_STATUS.CLAIMED ||
        r.status === REQUEST_STATUS.PENDING) && (
        <div className="flex gap-2">
          {r.status === REQUEST_STATUS.CLAIMED && (
            <RequestActionButton
              requestId={r.id}
              action={completeRequestAction}
              label="Mark completed"
              pendingLabel="Saving…"
            />
          )}
          <RequestActionButton
            requestId={r.id}
            action={cancelRequestAction}
            label="Cancel"
            pendingLabel="Cancelling…"
            variant="ghost"
            confirmMessage="Cancel this request?"
          />
        </div>
      )}
    </div>
  );
}

export const metadata: Metadata = { title: "Requests" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const activeTab = rawTab === "mine" ? "mine" : "browse";
  const user = await requireRole(ROLES.STUDENT);
  if (!user.activeMembership) {
    return (
      <AuthShell user={user}>
        <EmptyState
          icon={UsersThree}
          title="Join a church to request help"
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

  const [volunteers, myRequests, blockedUsers, studentProfile] = await Promise.all([
    listOpenMentorshipVolunteers(user.activeMembership.churchId, user.id),
    listRequestsForRequester(user.id),
    listBlockedUsers(user.id),
    prisma.studentProfile.findUnique({ where: { userId: user.id }, select: { languages: true } }),
  ]);

  // Most recent Mentorship request per targeted volunteer — a re-request
  // creates a new row instead of reviving an old one (see
  // requestState.ts), so among several rows for the same pair the newest
  // is the one that reflects the current relationship.
  const mentorshipRequests = myRequests.filter((r) => r.category === REQUEST_CATEGORY.MENTORSHIP && r.claimerId);
  const requestByClaimer = new Map<string, MyRequest>();
  for (const r of mentorshipRequests) {
    const existing = requestByClaimer.get(r.claimerId!);
    if (!existing || r.createdAt > existing.createdAt) {
      requestByClaimer.set(r.claimerId!, r);
    }
  }
  // Shared-language mentors surface first.
  const myLanguages = studentProfile?.languages ? tags(studentProfile.languages) : [];
  const rankedMentors = volunteers
    .map((m) => ({ mentor: m, shared: sharedTags(m.languages ? tags(m.languages) : [], myLanguages) }))
    .sort((a, b) => {
      if (a.shared.size !== b.shared.size) return b.shared.size - a.shared.size;
      return 0;
    });

  const currentMentors = rankedMentors.filter(
    ({ mentor: m }) => requestByClaimer.get(m.userId)?.status === REQUEST_STATUS.CLAIMED,
  );
  const findMentors = rankedMentors.filter(
    ({ mentor: m }) => requestByClaimer.get(m.userId)?.status !== REQUEST_STATUS.CLAIMED,
  );

  return (
    <AuthShell user={user}>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ink">Requests</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ask your church for help, or find a mentor at {user.activeMembership.church.name}.
        </p>
      </div>

      <div role="tablist" aria-label="Requests" className="mb-6 inline-flex gap-1 rounded-full border border-line bg-paper p-1">
        <Link
          href="?tab=browse"
          role="tab"
          aria-selected={activeTab === "browse"}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-brand active:scale-[0.97] ${
            activeTab === "browse" ? "bg-white text-brand-700 shadow-card" : "text-ink-muted hover:text-ink"
          }`}
        >
          <UserPlus weight="bold" className="size-4" /> Browse mentors ({findMentors.length})
        </Link>
        <Link
          href="?tab=mine"
          role="tab"
          aria-selected={activeTab === "mine"}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-brand active:scale-[0.97] ${
            activeTab === "mine" ? "bg-white text-brand-700 shadow-card" : "text-ink-muted hover:text-ink"
          }`}
        >
          <ListChecks weight="bold" className="size-4" /> My requests ({myRequests.length})
        </Link>
      </div>

      {activeTab === "mine" && (
        <div className="mb-6">
          <NewRequestForm />
        </div>
      )}

      {activeTab === "browse" ? (
        volunteers.length === 0 ? (
          <EmptyState
            icon={UsersThree}
            title="No mentors listed yet"
            body="Check back soon. Church members haven't signed up to be a mentor yet."
          />
        ) : (
          <>
            {currentMentors.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-faint">Your mentors</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {currentMentors.map(({ mentor: m, shared }, i) => (
                    <MentorCard
                      key={m.userId}
                      mentor={m}
                      shared={shared}
                      request={requestByClaimer.get(m.userId)}
                      delayMs={Math.min(i * 50, 300)}
                      isConnected
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              {currentMentors.length > 0 && (
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-faint">Find a mentor</h2>
              )}
              {findMentors.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line p-4 text-sm text-ink-muted">
                  You&apos;re already connected with everyone here!
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {findMentors.map(({ mentor: m, shared }, i) => (
                    <MentorCard
                      key={m.userId}
                      mentor={m}
                      shared={shared}
                      request={requestByClaimer.get(m.userId)}
                      delayMs={Math.min(i * 50, 300)}
                      isConnected={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )
      ) : myRequests.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No requests yet"
          body="Post a request for furniture, food, housing, or anything else you need help with, using the New request button above."
        />
      ) : (
        <div className="space-y-3">
          {myRequests.map((r) => (
            <MyRequestRow key={r.id} request={r} />
          ))}
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
