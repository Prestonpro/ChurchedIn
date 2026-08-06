import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { BrowseSignupForm } from "./BrowseSignupForm";

export const metadata: Metadata = {
  title: "Browse churches",
  description: "Look around ChurchedIn without committing to a church yet — browse before you join.",
};

export default async function BrowsePage() {
  // Someone already signed in (Google or otherwise) doesn't need a new
  // account to "just look around" — they already have everything /discover
  // requires. Without this, they'd be shown a fresh signup form here even
  // though they're logged in.
  const user = await getCurrentUser();
  if (user) {
    redirect("/discover");
  }

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
