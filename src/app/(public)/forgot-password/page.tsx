import Link from "next/link";
import type { Metadata } from "next";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a password reset link for your ChurchedIn account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPageLayout
      panelTitle="Forgot your password?"
      panelBody="No problem. We'll send you a link to set a new one."
    >
      <h1 className="text-2xl font-extrabold text-ink">Reset your password</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Enter the email on your account and we&apos;ll send you a reset link.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-8 text-center text-sm text-ink-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          Log in
        </Link>
        .
      </p>
    </AuthPageLayout>
  );
}
