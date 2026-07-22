import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { ROLES } from "@/lib/constants";
import { EventForm } from "./EventForm";

export default async function NewEventPage() {
  const user = await requireUser();
  if (!user.activeMembership || user.activeMembership.role === ROLES.STUDENT) {
    redirect("/events");
  }

  return (
    <AuthShell user={user}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-extrabold text-ink">Host an event</h1>
        <p className="mt-1 mb-6 text-sm text-ink-muted">
          Publish it and your church will see it on the events feed right away.
        </p>
        <Card>
          <EventForm />
        </Card>
      </div>
    </AuthShell>
  );
}
