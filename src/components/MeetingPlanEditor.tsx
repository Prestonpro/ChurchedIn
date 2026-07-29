"use client";

import { useEffect, useState, useTransition, useActionState } from "react";
import { CalendarCheck, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { setMeetingPlanAction, clearMeetingPlanAction } from "@/lib/actions/connections";
import { Button } from "@/components/ui/Button";
import { SelectField, Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { MEETING_FREQUENCY_LABELS, DAY_OF_WEEK_LABELS } from "@/lib/constants";

type Plan = {
  frequency: string;
  dayOfWeek: number | null;
  time: string | null;
  notes: string | null;
} | null;

function summarize(plan: NonNullable<Plan>): string {
  const label = MEETING_FREQUENCY_LABELS[plan.frequency as keyof typeof MEETING_FREQUENCY_LABELS] ?? plan.frequency;
  const parts = [label];
  if (plan.dayOfWeek !== null) parts.push(`on ${DAY_OF_WEEK_LABELS[plan.dayOfWeek]}s`);
  if (plan.time) parts.push(`around ${plan.time}`);
  return parts.join(" ");
}

/** A private recurring-meeting note on an ACCEPTED connection — see
 * MentorMeetingPlan's doc comment in schema.prisma. Shown on both the
 * student's Friends page and the mentor's dashboard. */
export function MeetingPlanEditor({ connectionId, plan }: { connectionId: string; plan: Plan }) {
  const [editing, setEditing] = useState(false);
  const action = setMeetingPlanAction.bind(null, connectionId);
  const [state, formAction] = useActionState(action, undefined);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state && "ok" in state) {
      setTimeout(() => setEditing(false), 0);
    }
  }, [state]);

  function handleClear() {
    if (!confirm("Remove this recurring meeting plan?")) return;
    startTransition(async () => {
      await clearMeetingPlanAction(connectionId);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-line bg-paper px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="flex items-start gap-1.5 text-sm text-ink-soft">
            <CalendarCheck weight="bold" className="mt-0.5 size-4 shrink-0 text-brand-600" />
            {plan ? (
              <span>
                {summarize(plan)}
                {plan.notes && <span className="block text-xs text-ink-muted">{plan.notes}</span>}
              </span>
            ) : (
              <span className="text-ink-muted">No recurring meeting set up yet.</span>
            )}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <PencilSimple weight="bold" className="size-3.5" /> {plan ? "Edit" : "Set up"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-line-strong bg-white p-3">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <SelectField label="How often" name="frequency" defaultValue={plan?.frequency ?? "BIWEEKLY"}>
        {Object.entries(MEETING_FREQUENCY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Day (optional)" name="dayOfWeek" defaultValue={plan?.dayOfWeek?.toString() ?? ""}>
          <option value="">No preference</option>
          {DAY_OF_WEEK_LABELS.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </SelectField>
        <Field label="Time (optional)" name="time" placeholder="3:00 PM" defaultValue={plan?.time ?? ""} />
      </div>
      <TextAreaField
        label="Notes (optional)"
        name="notes"
        placeholder="e.g. usually the campus coffee shop"
        defaultValue={plan?.notes ?? ""}
        rows={2}
      />
      <div className="flex items-center gap-2">
        <SubmitButton size="sm" pendingText="Saving…">
          Save
        </SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancel
        </Button>
        {plan && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto text-ink-muted hover:bg-danger-soft hover:text-danger"
            disabled={pending}
            onClick={handleClear}
          >
            Remove
          </Button>
        )}
      </div>
    </form>
  );
}
