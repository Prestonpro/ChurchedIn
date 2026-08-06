import Link from "next/link";
import type { Metadata } from "next";
import { Star, Buildings, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { MembershipsCard } from "@/components/MembershipsCard";
import { ROLES } from "@/lib/constants";

/** A church admin has no role-specific profile fields the way volunteers
 * (mentor profile) and students (student profile) do — this is just the
 * account info card, giving the header's avatar/name link somewhere to go
 * for every role. */
export const metadata: Metadata = { title: "Edit Profile" };

export default async function AdminProfilePage() {
  const user = await requireRole(ROLES.CHURCH_ADMIN);
  const churchId = user.activeMembership!.churchId;

  return (
    <AuthShell user={user}>
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <h1 className="text-xl font-extrabold text-ink">{user.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <EnvelopeSimple weight="bold" className="size-3.5" /> {user.email}
            </p>
          </div>
        </Card>
        <MembershipsCard memberships={user.memberships} />
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Star weight="fill" className="size-5" />
            </span>
            <div>
              <h2 className="font-bold text-ink">Church leader</h2>
              <p className="text-sm text-ink-muted">Your role at {user.activeMembership?.church.name}.</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-line p-3">
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <Buildings weight="bold" className="size-4 text-ink-faint" />
              {user.activeMembership?.church.name}
            </span>
            <Badge tone="brand">Church leader</Badge>
          </div>
          <Link
            href={`/churches/${churchId}/settings`}
            className="mt-3 inline-flex items-center text-sm font-semibold text-brand-600 transition-brand hover:underline"
          >
            Manage church settings →
          </Link>
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
