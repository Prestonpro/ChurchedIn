import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Ticket } from "@phosphor-icons/react/dist/ssr";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const metadata: Metadata = {
  title: "Join a church",
};

async function goToCode(formData: FormData) {
  "use server";
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (code) {
    redirect(`/join/${code}`);
  }
}

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
      <form action={goToCode} className="mt-8 space-y-4">
        <Field
          label="Join code"
          name="code"
          required
          maxLength={6}
          icon={Ticket}
          className="text-center text-lg font-bold uppercase tracking-[0.3em]"
          placeholder="ABC123"
        />
        <SubmitButton pendingText="Continuing…" className="w-full">
          Continue
        </SubmitButton>
      </form>
    </AuthPageLayout>
  );
}
