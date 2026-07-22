import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { verifyEmailAction } from "@/lib/actions/auth";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { LinkButton } from "@/components/ui/Button";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailAction(token);

  return (
    <AuthPageLayout
      panelTitle={result.error ? "Links expire after 24 hours." : "You're all set."}
      panelBody={
        result.error
          ? "Log back in and we'll send you a fresh verification email."
          : "You can now RSVP to events and send or receive mentor connection requests."
      }
    >
      {result.error ? (
        <>
          <span className="flex size-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <XCircle weight="fill" className="size-5.5" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">Link expired</h1>
          <p className="mt-2 text-sm text-ink-soft">{result.error}</p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline"
          >
            Back to login
          </Link>
        </>
      ) : (
        <>
          <span className="flex size-11 items-center justify-center rounded-xl bg-success-soft text-success">
            <CheckCircle weight="fill" className="size-5.5" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">Email verified</h1>
          <p className="mt-2 text-sm text-ink-soft">
            You can now RSVP to events and message mentors.
          </p>
          <LinkButton href="/events" className="mt-6">
            Go to events <ArrowRight weight="bold" className="size-4" />
          </LinkButton>
        </>
      )}
    </AuthPageLayout>
  );
}
