import { notFound } from "next/navigation";
import Link from "next/link";
import {
  LinkedinLogo,
  FacebookLogo,
  InstagramLogo,
  Briefcase,
  Globe,
  Translate,
  Sparkle,
  GraduationCap,
  EnvelopeSimple,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/queries";
import { tags } from "@/lib/tags";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ProfileConnectionButton } from "@/components/ProfileConnectionButton";
import { ReportButton } from "@/components/ReportButton";
import { ROLES, roleLabel, type Role } from "@/lib/constants";
import { contactInfoVisible } from "@/lib/connectionState";

function SocialLink({
  href,
  icon: IconComponent,
  label,
}: {
  href: string;
  icon: Icon;
  label: string;
}) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition-brand hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
    >
      <IconComponent className="size-4" weight="bold" />
      {label}
    </a>
  );
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
  const profile = target.mentorProfile ?? target.studentProfile;
  const isMentor = !!target.mentorProfile;

  // Load existing connection if viewer is a student viewing a mentor
  let connection: {
    id: string;
    status: string;
    conversationId?: string | null;
  } | null = null;
  let connectionEmail: string | null = null;

  if (isViewerStudent && isMentor && !isSelf) {
    const rawConn = await prisma.mentorConnection.findFirst({
      where: { studentId: viewer.id, mentorId: target.id },
      include: { conversation: { select: { id: true } } },
    });
    if (rawConn) {
      connection = {
        id: rawConn.id,
        status: rawConn.status,
        conversationId: rawConn.conversation?.id ?? null,
      };
      if (contactInfoVisible(rawConn.status)) {
        connectionEmail = target.mentorProfile
          ? (await prisma.user.findUnique({ where: { id: target.id }, select: { email: true } }))?.email ?? null
          : null;
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
            <Avatar name={target.name} size="lg" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold text-ink">{target.name}</h1>
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
            {isMentor && (target.mentorProfile?.jobTitle || target.mentorProfile?.company) && (
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <Briefcase className="size-4 shrink-0 text-ink-faint" />
                {[target.mentorProfile.jobTitle, target.mentorProfile.company].filter(Boolean).join(" · ")}
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
            <div className="flex flex-wrap gap-2 pt-2">
              {profile.linkedinUrl && (
                <SocialLink href={profile.linkedinUrl} icon={LinkedinLogo} label="LinkedIn" />
              )}
              {profile.facebookUrl && (
                <SocialLink href={profile.facebookUrl} icon={FacebookLogo} label="Facebook" />
              )}
              {profile.instagramUrl && (
                <SocialLink href={profile.instagramUrl} icon={InstagramLogo} label="Instagram" />
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
                  <Sparkle weight="bold" className="size-3" /> {t}
                </span>
              ))}
              {tags(profile?.hobbies).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-cat-coffee-soft px-2.5 py-1 text-xs font-medium text-cat-coffee">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Friend request / connection actions — only for students viewing mentors */}
          {isViewerStudent && isMentor && !isSelf && (
            <div className="mt-2">
              {connectionEmail && (
                <p className="mb-3 flex items-center gap-1.5 text-sm text-ink-muted">
                  <EnvelopeSimple weight="bold" className="size-4 shrink-0 text-ink-faint" />
                  {connectionEmail}
                </p>
              )}
              <ProfileConnectionButton
                mentorId={target.id}
                mentorName={target.name}
                isOpenToMentor={target.mentorProfile?.openToMentor ?? false}
                connection={connection}
                email={connectionEmail}
              />
            </div>
          )}
        </Card>

        {/* Report button — never shown to self */}
        {!isSelf && (
          <div className="pt-2 text-center">
            <ReportButton reportedUserId={target.id} name={target.name} />
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <Link href="/" className="text-sm text-ink-faint hover:text-ink hover:underline">
            ← Back
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
