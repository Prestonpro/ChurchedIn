import Link from "next/link";
import { UsersThree, HandHeart } from "@phosphor-icons/react/dist/ssr";
import { requireRole } from "@/lib/auth";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { ROLES } from "@/lib/constants";
import { InviteCoAdminForm } from "./InviteCoAdminForm";

export default async function AdminWelcomePage() {
  const user = await requireRole(ROLES.CHURCH_ADMIN);

  return (
    <AuthShell user={user}>
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <UsersThree weight="fill" className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">
            {user.activeMembership?.church.name} is live!
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            You don&apos;t have to do this alone.
          </p>
        </div>

        <Card>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
              <HandHeart weight="fill" className="size-5" />
            </span>
            <div>
              <h2 className="font-bold text-ink">Invite a co-leader</h2>
              <p className="text-sm text-ink-muted">
                Running this with a friend makes it easier, and means someone else can jump in when you&apos;re busy.
              </p>
            </div>
          </div>
          <InviteCoAdminForm />
        </Card>

        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/admin/dashboard" className="font-semibold text-brand-600 hover:underline">
            Skip for now
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
