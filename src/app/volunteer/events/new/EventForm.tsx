"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, HandHeart, GraduationCap } from "@phosphor-icons/react/dist/ssr";
import { createEventAction } from "@/lib/actions/events";
import { Field, TextAreaField, CheckboxField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { categoryStyle, ALL_CATEGORIES } from "@/lib/eventCategoryStyle";
import type { EventCategory } from "@/lib/constants";

export function EventForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createEventAction, undefined);
  const [category, setCategory] = useState<EventCategory>("DINNER");

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      router.push(`/events/${state.eventId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state && "error" in state ? state.error : undefined} />

      <div>
        <span className="text-sm font-semibold text-ink-soft">Category</span>
        <input type="hidden" name="category" value={category} />
        <div className="mt-2 grid grid-cols-4 gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const style = categoryStyle(cat);
            const Icon = style.icon;
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-brand ${
                  active
                    ? `border-transparent ${style.bg} ${style.text}`
                    : "border-line-strong text-ink-muted hover:border-brand-300"
                }`}
              >
                <Icon weight={active ? "fill" : "regular"} className="size-5" />
                <span className="text-[11px] font-semibold leading-tight">{style.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Title" name="title" required placeholder="Friday night welcome dinner" />
      <TextAreaField label="Description" name="description" required />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts" name="startsAt" type="datetime-local" required />
        <Field label="Ends" name="endsAt" type="datetime-local" required />
      </div>

      <Field
        label="Location"
        name="location"
        icon={MapPin}
        required
        placeholder="Church fellowship hall, or a video link"
      />
      <CheckboxField label="This is a virtual event" name="isVirtual" />

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Volunteer capacity"
          name="volunteerCap"
          type="number"
          min={0}
          icon={HandHeart}
          hint="0 = no helpers needed. Leave blank for no limit."
        />
        <Field
          label="Student capacity"
          name="studentCap"
          type="number"
          min={0}
          icon={GraduationCap}
          hint="0 = no attendees needed. Leave blank for no limit."
        />
      </div>

      <SubmitButton pendingText="Creating…" className="w-full">
        Publish event
      </SubmitButton>
    </form>
  );
}
