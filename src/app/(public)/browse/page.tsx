import Link from "next/link";
import type { Metadata } from "next";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { BrowseSignupForm } from "./BrowseSignupForm";

export const metadata: Metadata = {
  title: "Browse churches",
};

export default function BrowsePage() {
  return (
    <AuthPageLayout
      panelTitle="Not ready to commit to a church yet?"
      panelBody="Create an account, look through the churches on ChurchedIn, and join one whenever you find the right fit."
    >
      <h1 className="text-2xl font-extrabold text-ink">Just browsing</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        No church required. You can join one later, whenever you&apos;re ready.
      </p>
      <div className="mt-8">
        <BrowseSignupForm />
      </div>
      <p className="mt-8 text-center text-sm text-ink-muted">
        Already know your church?{" "}
        <Link href="/join" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          Enter a join code
        </Link>
        .
      </p>
    </AuthPageLayout>
  );
}
