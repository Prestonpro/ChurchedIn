import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Briefcase,
  Globe,
  Translate,
  Star,
  GraduationCap,
  EnvelopeSimple,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/queries";
import { tags } from "@/lib/tags";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { SocialIconLink } from "@/components/ui/SocialIconLink";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { ProfileRequestButton } from "@/components/ProfileRequestButton";
import { ReportButton } from "@/components/ReportButton";
import { BlockButton } from "@/components/BlockButton";
import { BackLink } from "@/components/ui/BackLink";
import { ROLES, REQUEST_CATEGORY, roleLabel, type Role, type RequestStatus } from "@/lib/constants";
import { requestContactVisible } from "@/lib/requestState";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params;
  const target = await getUserProfile(userId);
  return { title: target?.name ?? "Profile" };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [viewer, target] = await Promise.all([requireUser(), getUserProfile(userId)]);

  if (!target) notFound();

  // Viewer must share a church with this person (or be viewing themselves)
  const targetChurchIds = new Set(target.memberships.map((m) => m.churchId));
  const sharesChurch =
    viewer.id === target.id ||
    viewer.memberships.some((m) => targetChurchIds.has(m.churchId));
  if (!sharesChurch) notFound();

  const isSelf = viewer.id === target.id;
  const viewerRole = viewer.activeMembership?.role;
  const isViewerStudent = viewerRole === ROLES.STUDENT;
  // A student's dedicated profile takes priority; otherwise the volunteer
  // fields on `target` itself apply (carried forward from the deleted
  // MentorProfile) — see schema.prisma's User model doc comment.
  const profile = target.studentProfile ?? target;
  const isMentor = !target.studentProfile;

  // Load the most recent Mentorship HelpRequest between viewer and target,
  // if viewer is a student viewing a mentor. There can be several over
  // time — a re-request creates a new row instead of reviving an old one
  // (see requestState.ts) — so the most recent is the relevant one to show.
  let request: { id: string; status: RequestStatus; hasConversation: boolean } | null = null;
  let requestEmail: string | null = null;

  if (isViewerStudent && isMentor && !isSelf) {
    const rawRequest = await prisma.helpRequest.findFirst({
      where: { requesterId: viewer.id, claimerId: target.id, category: REQUEST_CATEGORY.MENTORSHIP },
      orderBy: { createdAt: "desc" },
      include: { conversation: { select: { id: true } } },
    });
    if (rawRequest) {
      request = {
        id: rawRequest.id,
        status: rawRequest.status,
        hasConversation: !!rawRequest.conversation,
      };
      if (requestContactVisible(rawRequest.status, rawRequest.respondedAt)) {
        requestEmail = (await prisma.user.findUnique({ where: { id: target.id }, select: { email: true } }))?.email ?? null;
      }
    }
  }

  const joinedDate = new Date(target.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const primaryChurch = target.memberships[0];
  const primaryRole = primaryChurch?.role as Role | undefined;

  return (
    <AuthShell user={viewer}>
      <div className="mx-auto max-w-xl space-y-4">
        {/* Header card */}
        <Card className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <Avatar name={target.name} src={target.photoUrl} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-1.5 text-xl font-extrabold text-ink">
                {target.name}
                {target.verified && <VerifiedBadge />}
              </h1>
              {primaryRole && (
                <Badge tone={primaryRole === ROLES.CHURCH_ADMIN ? "brand" : "neutral"} className="mt-1">
                  {roleLabel(primaryRole)}
                  {primaryChurch && ` · ${primaryChurch.church.name}`}
                </Badge>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
                <CalendarBlank className="size-3.5" />
                Joined {joinedDate}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {target.bio && <p className="text-sm text-ink-soft">{target.bio}</p>}

            {/* Job info */}
            {isMentor && (target.jobTitle || target.company) && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Briefcase className="size-4 shrink-0 text-ink-faint" />
                {[target.jobTitle, target.company].filter(Boolean).join(" · ")}
              </p>
            )}

            {/* Student school info */}
            {!isMentor && target.studentProfile?.school && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <GraduationCap className="size-4 shrink-0 text-ink-faint" />
                {[target.studentProfile.major, target.studentProfile.school].filter(Boolean).join(" · ")}
                {target.studentProfile.graduationYear && ` · Class of ${target.studentProfile.graduationYear}`}
              </p>
            )}

            {/* Country of origin */}
            {!isMentor && target.studentProfile?.countryOfOrigin && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Globe className="size-4 shrink-0 text-ink-faint" />
                From {target.studentProfile.countryOfOrigin}
              </p>
            )}

            {/* Career goals (student only) */}
            {!isMentor && target.studentProfile?.careerGoals && (
              <div className="pt-2">
                <h2 className="mb-2 text-sm font-bold text-ink-soft uppercase tracking-wide">Career goals</h2>
                <p className="text-sm text-ink-soft">{target.studentProfile.careerGoals}</p>
              </div>
            )}
          </div>

          {/* Social links */}
          {(profile?.linkedinUrl || profile?.facebookUrl || profile?.instagramUrl) && (
            <div className="flex items-center gap-2 pt-2">
              {profile.linkedinUrl && (
                <SocialIconLink href={profile.linkedinUrl} label="LinkedIn" brand="linkedin" />
              )}
              {profile.facebookUrl && (
                <SocialIconLink href={profile.facebookUrl} label="Facebook" brand="facebook" />
              )}
              {profile.instagramUrl && (
                <SocialIconLink href={profile.instagramUrl} label="Instagram" brand="instagram" />
              )}
            </div>
          )}

          {/* Tags: languages, interests, hobbies */}
          {(profile?.languages || profile?.interests || profile?.hobbies) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tags(profile?.languages).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                  <Translate weight="bold" className="size-3" /> {t}
                </span>
              ))}
              {tags(profile?.interests).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-700">
                  <Star weight="bold" className="size-3" /> {t}
                </span>
              ))}
              {tags(profile?.hobbies).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-cat-coffee-soft px-2.5 py-1 text-xs font-medium text-cat-coffee">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Mentorship request actions — only for students viewing mentors */}
          {isViewerStudent && isMentor && !isSelf && (
            <div className="mt-2">
              {requestEmail && (
                <p className="mb-3 flex items-center gap-1.5 text-sm text-ink-muted">
                  <EnvelopeSimple weight="bold" className="size-4 shrink-0 text-ink-faint" />
                  {requestEmail}
                </p>
              )}
              <ProfileRequestButton
                claimerId={target.id}
                isOpenToMentorship={target.openToMentorship}
                request={request}
                email={requestEmail}
              />
            </div>
          )}
        </Card>

        {/* Block/report — never shown to self, and only here now (not on
            every friend-directory card) — most social apps only expose
            these from the full profile, not from every list card. */}
        {!isSelf && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <ReportButton reportedUserId={target.id} name={target.name} />
            <span className="text-ink-faint">·</span>
            <BlockButton userId={target.id} name={target.name} />
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <BackLink />
        </div>
      </div>
    </AuthShell>
  );
}
