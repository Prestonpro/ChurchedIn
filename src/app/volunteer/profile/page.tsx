import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { MembershipsCard } from "@/components/MembershipsCard";
import { MentorProfileForm } from "./MentorProfileForm";
import { ROLES } from "@/lib/constants";

export default async function VolunteerProfilePage() {
  const user = await requireRole(ROLES.VOLUNTEER);
  const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: user.id } });

  return (
    <AuthShell user={user}>
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <h1 className="text-xl font-extrabold text-ink">{user.name}</h1>
            <p className="text-sm text-ink-muted">{user.email}</p>
          </div>
        </Card>
        <MembershipsCard memberships={user.memberships} />
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <UsersThree weight="fill" className="size-5" />
            </span>
            <div>
              <h2 className="font-bold text-ink">Friend profile</h2>
              <p className="text-sm text-ink-muted">
                Appear in the friend directory for international students.
              </p>
            </div>
          </div>
          <MentorProfileForm
            initial={{
              languages: mentorProfile?.languages ?? "",
              interests: mentorProfile?.interests ?? "",
              openToMentor: mentorProfile?.openToMentor ?? false,
              jobTitle: mentorProfile?.jobTitle ?? "",
              company: mentorProfile?.company ?? "",
              industry: mentorProfile?.industry ?? "",
              hobbies: mentorProfile?.hobbies ?? "",
              linkedinUrl: mentorProfile?.linkedinUrl ?? "",
            }}
          />
        </Card>
      </div>
    </AuthShell>
  );
}
