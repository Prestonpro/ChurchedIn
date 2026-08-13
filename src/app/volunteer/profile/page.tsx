import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { MembershipsCard } from "@/components/MembershipsCard";
import { VolunteerProfileForm } from "./VolunteerProfileForm";
import { ROLES } from "@/lib/constants";

export const metadata: Metadata = { title: "Edit Profile" };

export default async function VolunteerProfilePage() {
  const user = await requireRole(ROLES.VOLUNTEER);

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
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
              <UsersThree weight="fill" className="size-5" />
            </span>
            <div>
              <h2 className="font-bold text-ink">Mentor profile</h2>
              <p className="text-sm text-ink-muted">
                Appear in the Mentorship directory for international students.
              </p>
            </div>
          </div>
          <VolunteerProfileForm
            initial={{
              bio: user.bio ?? "",
              photoUrl: user.photoUrl ?? "",
              languages: user.languages ?? "",
              interests: user.interests ?? "",
              openToMentorship: user.openToMentorship,
              jobTitle: user.jobTitle ?? "",
              company: user.company ?? "",
              industry: user.industry ?? "",
              hobbies: user.hobbies ?? "",
              linkedinUrl: user.linkedinUrl ?? "",
              facebookUrl: user.facebookUrl ?? "",
              instagramUrl: user.instagramUrl ?? "",
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
