import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { ChurchProfileForm } from "./ChurchProfileForm";

export default async function NewChurchPage() {
  const user = await requireUser();

  return (
    <AuthShell user={user}>
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Sparkle weight="fill" className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">Start a new church space</h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            You don&apos;t have to be a pastor — just someone who wants to help welcome international students.
          </p>
        </div>
        <Card>
          <ChurchProfileForm />
        </Card>
      </div>
    </AuthShell>
  );
}
