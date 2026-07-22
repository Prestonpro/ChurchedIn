import Link from "next/link";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthPageLayout
      panelTitle="Welcome back."
      panelBody="Log in to see what's coming up at your church — events, RSVPs, and any mentor requests waiting on you."
    >
      <h1 className="text-2xl font-extrabold text-ink">Log in</h1>
      <p className="mt-1.5 text-sm text-ink-muted">Good to see you again.</p>
      <div className="mt-8">
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
