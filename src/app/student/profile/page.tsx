import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { MembershipsCard } from "@/components/MembershipsCard";
import { StudentProfileForm } from "./StudentProfileForm";
import { ROLES } from "@/lib/constants";

export default async function StudentProfilePage() {
  const user = await requireRole(ROLES.STUDENT);
  const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });

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
          <h2 className="mb-4 font-bold text-ink">Your profile</h2>
          <StudentProfileForm
            initial={{
              countryOfOrigin: studentProfile?.countryOfOrigin ?? "",
              school: studentProfile?.school ?? "",
              languages: studentProfile?.languages ?? "",
              interests: studentProfile?.interests ?? "",
            }}
          />
        </Card>
      </div>
    </AuthShell>
  );
}
