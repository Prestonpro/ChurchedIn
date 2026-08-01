import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getChurchProfile, listMembersForChurch } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ROLES, roleLabel, type Role } from "@/lib/constants";

/** Read-only member roster — any member of the church can see who else
 * belongs, distinct from /churches/[id]/settings' MembersList (which adds
 * promote/demote controls and is admin-only). Gated on membership rather
 * than public, since names shouldn't be exposed to strangers browsing
 * /discover. */
export default async function ChurchMembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const isMember = user.memberships.some((m) => m.churchId === id);
  if (!isMember) {
    notFound();
  }

  const church = await getChurchProfile(id);
  if (!church) {
    notFound();
  }

  const members = await listMembersForChurch(id);

  return (
    <AuthShell user={user}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-ink">{church.name}&apos;s members</h1>
          <p className="text-sm text-ink-muted">
            {members.length} {members.length === 1 ? "person" : "people"} at this church.
          </p>
        </div>
        <Card>
          <div className="space-y-2">
            {members.map((m) => (
              <Link
                key={m.id}
                href={`/profile/${m.userId}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line p-3 transition-brand hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.user.name} size="sm" />
                  <p className="text-sm font-semibold text-ink">
                    {m.user.name}
                    {m.userId === user.id && (
                      <span className="ml-1.5 text-xs font-normal text-ink-faint">(you)</span>
                    )}
                  </p>
                </div>
                <Badge tone={m.role === ROLES.CHURCH_ADMIN ? "brand" : "neutral"}>
                  {roleLabel(m.role as Role)}
                </Badge>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </AuthShell>
  );
}
