import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getEventById } from "@/lib/queries";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { ROLES, type EventCategory } from "@/lib/constants";
import { EventForm } from "./EventForm";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requireUser();
  if (!user.activeMembership || user.activeMembership.role === ROLES.STUDENT) {
    redirect("/events");
  }

  const { from } = await searchParams;
  let prefill;
  if (from) {
    const source = await getEventById(from);
    const isCreatorOrCohost =
      source &&
      source.churchId === user.activeMembership.churchId &&
      (source.createdById === user.id || source.cohosts.some((c) => c.userId === user.id));
    if (isCreatorOrCohost) {
      prefill = {
        category: source.category as EventCategory,
        title: source.title,
        description: source.description,
        location: source.location,
        isVirtual: source.isVirtual,
        atChurch: source.atChurch,
        volunteerCap: source.volunteerCap,
        studentCap: source.studentCap,
      };
    }
  }

  return (
    <AuthShell user={user}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold text-ink">Plan a gathering</h1>
        <p className="mt-1 mb-6 text-sm text-ink-muted">
          {prefill
            ? `Running it back — pick a new date and time for "${prefill.title}".`
            : "Share it and your church family will see it right away."}
        </p>
        <Card>
          <EventForm
            key={from ?? "blank"}
            churchName={user.activeMembership.church.name}
            prefill={prefill}
          />
        </Card>
      </div>
    </AuthShell>
  );
}
