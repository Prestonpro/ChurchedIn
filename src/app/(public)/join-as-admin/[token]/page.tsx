import Link from "next/link";
import { XCircle, HandHeart } from "@phosphor-icons/react/dist/ssr";
import { checkCoAdminInvite } from "@/lib/actions/churchInvites";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { AcceptInviteForm } from "./AcceptInviteForm";
import { AcceptExistingButton } from "./AcceptExistingButton";

export default async function JoinAsAdminPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const check = await checkCoAdminInvite(token);

  if (!check.valid) {
    return (
      <AuthPageLayout panelTitle="Invites expire after a while." panelBody="Ask whoever invited you to send a fresh one.">
        <span className="flex size-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <XCircle weight="fill" className="size-5.5" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">Invite not valid</h1>
        <p className="mt-2 text-sm text-ink-soft">{check.reason}</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Go to login
        </Link>
      </AuthPageLayout>
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email: check.email } });
  const currentUser = await getCurrentUser();

  return (
    <AuthPageLayout
      panelTitle={`Help lead ${check.churchName}.`}
      panelBody="You don't have to be a pastor — just someone who wants to help welcome international students."
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
        <HandHeart weight="fill" className="size-5.5" />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold text-ink">Join {check.churchName} as a co-leader</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Invited as {check.email}.</p>

      <div className="mt-8">
        {existingUser ? (
          currentUser?.email === check.email ? (
            <AcceptExistingButton token={token} />
          ) : (
            <div className="space-y-3 text-sm text-ink-soft">
              <p>
                An account already exists for {check.email}. Log in with that account, then revisit this
                link to accept.
              </p>
              <Link
                href="/login"
                className="inline-block font-semibold text-brand-600 hover:underline"
              >
                Log in
              </Link>
            </div>
          )
        ) : (
          <AcceptInviteForm token={token} />
        )}
      </div>
    </AuthPageLayout>
  );
}
