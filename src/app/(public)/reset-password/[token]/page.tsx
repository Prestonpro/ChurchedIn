import Link from "next/link";
import { XCircle } from "@phosphor-icons/react/dist/ssr";
import { checkResetToken } from "@/lib/actions/passwordReset";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const check = await checkResetToken(token);

  if (!check.valid) {
    return (
      <AuthPageLayout
        panelTitle="Let's get you a fresh link."
        panelBody="Reset links expire after an hour and only work once, for your security."
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <XCircle weight="fill" className="size-5.5" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-ink">This link doesn&apos;t work</h1>
        <p className="mt-2 text-sm text-ink-soft">{check.reason}</p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline"
        >
          Request a new link
        </Link>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout
      panelTitle="Almost there."
      panelBody="Set a new password to get back into your account."
    >
      <h1 className="text-2xl font-extrabold text-ink">Set a new password</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Choose something you haven&apos;t used before.</p>
      <div className="mt-8">
        <ResetPasswordForm token={token} />
      </div>
    </AuthPageLayout>
  );
}
