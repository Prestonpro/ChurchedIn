import { notFound } from "next/navigation";
import { Buildings, Ticket, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { getChurchProfile, listMembersForChurch } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { ROLES } from "@/lib/constants";
import { EditChurchProfileForm } from "./EditChurchProfileForm";
import { InviteCodeCard } from "./InviteCodeCard";
import { MembersList } from "./MembersList";

export default async function ChurchSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const membership = user.memberships.find((m) => m.churchId === id);
  const canManage = membership?.role === ROLES.CHURCH_ADMIN;
  if (!canManage) {
    notFound();
  }

  const church = await getChurchProfile(id);
  if (!church) {
    notFound();
  }

  const members = await listMembersForChurch(id);

  return (
    <AuthShell user={user}>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink">Church settings</h1>
        <p className="text-sm text-ink-muted">Manage {church.name}&apos;s profile, invite code, and leadership.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="mb-4 flex items-center gap-1.5 font-bold text-ink">
              <Buildings weight="bold" className="size-4.5 text-brand-600" /> Church profile
            </h2>
            <EditChurchProfileForm churchId={id} church={church} />
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-1.5 font-bold text-ink">
              <UsersThree weight="bold" className="size-4.5 text-brand-600" /> Members
            </h2>
            <MembersList
              churchId={id}
              members={members}
              viewerUserId={user.id}
              canManage={canManage}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink">
              <Ticket weight="bold" className="size-4 text-brand-600" /> Invite code
            </h2>
            <p className="mb-3 text-xs text-ink-muted">Share this code so people can join without waiting for an invite.</p>
            <InviteCodeCard churchId={id} joinCode={church.joinCode} />
          </Card>
        </div>
      </div>
    </AuthShell>
  );
}
