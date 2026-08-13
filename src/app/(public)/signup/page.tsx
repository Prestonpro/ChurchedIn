import Link from "next/link";
import type { Metadata } from "next";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Register your church",
  description: "Create a free ChurchedIn space for your church to plan gatherings, coordinate rides, and connect students with volunteers.",
};

export default function SignupPage() {
  return (
    <AuthPageLayout
      panelTitle="Give your church a home base for hospitality."
      panelBody="You'll become its first church leader and get a join code to invite volunteers and international students in seconds."
    >
      <h1 className="text-2xl font-extrabold text-ink">Register your church</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Free to set up. Takes about a minute.</p>
      <div className="mt-8">
        <SignupForm />
      </div>
      <p className="mt-8 text-center text-sm text-ink-muted">
        Joining an existing church instead?{" "}
        <Link href="/join" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          Enter a join code
        </Link>
        , or{" "}
        <Link href="/browse" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          just look around first
        </Link>
        .
      </p>
    </AuthPageLayout>
  );
}
