import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { GoogleButton, OrDivider } from "@/components/ui/GoogleButton";
import { FormError } from "@/components/ui/Field";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;

  return (
    <AuthPageLayout
      panelTitle="Welcome back."
      panelBody="Log in to see what's coming up at your church — events, RSVPs, and any friend requests waiting on you."
    >
      <h1 className="text-2xl font-extrabold text-ink">Log in</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Good to see you again.</p>
      <div className="mt-8 space-y-4">
        {error === "google_oauth_failed" && (
          <FormError message="Google sign-in didn't go through. Please try again." />
        )}
        {reset === "success" && (
          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-paper px-4 py-3.5 text-sm text-ink-soft">
            <CheckCircle weight="fill" className="mt-0.5 size-5 shrink-0 text-brand-600" />
            <span>Your password has been reset. Log in with your new password.</span>
          </div>
        )}
        <GoogleButton href="/api/auth/google" />
        <OrDivider />
        <LoginForm />
      </div>
      <p className="mt-8 text-center text-sm text-ink-muted">
        New here?{" "}
        <Link href="/join" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          Join with a church code
        </Link>{" "}
        or{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          start your church&apos;s space
        </Link>
        .
      </p>
    </AuthPageLayout>
  );
}
