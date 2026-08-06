import { requireUser } from "@/lib/auth";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { MembershipsCard } from "@/components/MembershipsCard";
import { StudentProfileForm } from "./StudentProfileForm";
import { ROLES, profilePathForRole } from "@/lib/constants";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function StudentProfilePage() {
  const user = await requireUser();
  
  if (user.activeMembership && user.activeMembership.role !== ROLES.STUDENT) {
    redirect(profilePathForRole(user.activeMembership.role));
  }

  const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });

  return (
    <AuthShell user={user}>
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="flex items-center gap-4">
          <Avatar name={user.name} src={user.photoUrl} size="lg" />
          <div>
            <h1 className="text-xl font-extrabold text-ink">{user.name}</h1>
            <p className="text-sm text-ink-muted">{user.email}</p>
          </div>
        </Card>
        <MembershipsCard memberships={user.memberships} />
        <Card>
          <h2 className="mb-4 font-bold text-ink">Your profile</h2>
          <StudentProfileForm
            initial={{
              bio: user.bio ?? "",
              photoUrl: user.photoUrl ?? "",
              countryOfOrigin: studentProfile?.countryOfOrigin ?? "",
              school: studentProfile?.school ?? "",
              major: studentProfile?.major ?? "",
              graduationYear: studentProfile?.graduationYear ?? "",
              languages: studentProfile?.languages ?? "",
              hobbies: studentProfile?.hobbies ?? "",
              interests: studentProfile?.interests ?? "",
              careerGoals: studentProfile?.careerGoals ?? "",
              linkedinUrl: studentProfile?.linkedinUrl ?? "",
              facebookUrl: studentProfile?.facebookUrl ?? "",
              instagramUrl: studentProfile?.instagramUrl ?? "",
            }}
          />
        </Card>
        <div className="pt-4 text-center">
          <Link href="/privacy" className="text-sm text-ink-muted hover:text-ink hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
