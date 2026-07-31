import Link from "next/link";
import type { Metadata } from "next";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { JoinCodeForm } from "./JoinCodeForm";

export const metadata: Metadata = {
  title: "Join a church",
};

export default function JoinEntryPage() {
  return (
    <AuthPageLayout
      panelTitle="Every church runs its own space."
      panelBody="A join code keeps your church's events, roster, and friend directory separate from every other church on the platform."
    >
      <h1 className="text-2xl font-extrabold text-ink">Join a church</h1>
      <p className="mt-1.5 text-sm text-ink-muted">
        Enter the 6-character code your church shared with you.
      </p>
      <JoinCodeForm />
      <p className="mt-8 text-center text-sm text-ink-muted">
        Don&apos;t have a code yet?{" "}
        <Link href="/browse" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
          Just look around first
        </Link>
        .
      </p>
    </AuthPageLayout>
  );
}
