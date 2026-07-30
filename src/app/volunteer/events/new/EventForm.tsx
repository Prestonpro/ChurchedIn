"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, HandHeart, GraduationCap, ArrowLeft, PlusCircle } from "@phosphor-icons/react/dist/ssr";
import { createEventAction } from "@/lib/actions/events";
import { Field, TextAreaField, CheckboxField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { LocationPicker } from "@/components/LocationPicker";
import type { EventCategory } from "@/lib/constants";

/** Presets shown as tappable cards before the full form — a blank category
 * grid plus a dozen date/location fields is a cold start for a first-time
 * host. Each preset just pre-fills category + a starting title; every field
 * stays fully editable afterward. "Create your own" is the escape hatch for
 * anything that doesn't fit one of these, mapped to the OTHER category. */
const PRESETS: { category: EventCategory; label: string; title: string; description: string }[] = [
  { category: "DINNER", label: "Host a dinner", title: "Friday night welcome dinner", description: "Share a meal and good conversation." },
  { category: "COFFEE_CHAT", label: "Coffee chat", title: "Coffee chat", description: "A relaxed one-on-one or small group chat." },
  { category: "STUDY_GROUP", label: "Study group", title: "Study group", description: "Get together to study or do homework." },
  { category: "AIRPORT_PICKUP", label: "Airport pickup", title: "Airport pickup", description: "Help a student get settled when they arrive." },
  { category: "CULTURAL_OUTING", label: "Cultural outing", title: "Cultural outing", description: "Explore something new together as a group." },
  { category: "HOLIDAY_CELEBRATION", label: "Holiday celebration", title: "Holiday celebration", description: "Celebrate a holiday together, away from home." },
  { category: "MENTORSHIP", label: "Friend chat", title: "Friend chat", description: "One-on-one time to get to know each other." },
];

type Prefill = {
  category: EventCategory;
  title: string;
  description: string;
  location: string;
  isVirtual: boolean;
  atChurch: boolean;
  volunteerCap: number | null;
  studentCap: number | null;
  address: string | null;
  locationLat: number | null;
  locationLng: number | null;
};

export function EventForm({ churchName, prefill }: { churchName: string; prefill?: Prefill }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createEventAction, undefined);
  // Prefill (from "Run this again") skips the picker entirely — it already
  // implies a category and title, just missing new date/time.
  const [picked, setPicked] = useState<{ category: EventCategory; title: string } | null>(
    prefill ? { category: prefill.category, title: prefill.title } : null,
  );
  const [atChurch, setAtChurch] = useState(prefill?.atChurch ?? false);
  const [location, setLocation] = useState(prefill?.location ?? "");

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      router.push(`/events/${state.eventId}`);
    }
  }, [state, router]);

  if (!picked) {
    return (
      <div>
        <span className="text-sm font-semibold text-ink-soft">What are you planning?</span>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PRESETS.map((preset, i) => {
            const style = categoryStyle(preset.category);
            const Icon = style.icon;
            return (
              <button
                key={preset.category}
                type="button"
                onClick={() => setPicked({ category: preset.category, title: preset.title })}
                className="flex animate-fade-up flex-col items-center gap-2 rounded-xl border border-line-strong p-4 text-center transition-brand hover:border-brand-300 hover:bg-paper"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className={`flex size-11 items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
                  <Icon weight="fill" className="size-5.5" />
                </span>
                <span className="text-sm font-bold text-ink">{preset.label}</span>
                <span className="text-xs leading-snug text-ink-muted">{preset.description}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setPicked({ category: "OTHER", title: "" })}
            className="flex animate-fade-up flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong p-4 text-center transition-brand hover:border-brand-300 hover:bg-paper"
            style={{ animationDelay: `${PRESETS.length * 40}ms` }}
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-paper text-ink-faint">
              <PlusCircle weight="bold" className="size-5.5" />
            </span>
            <span className="text-sm font-bold text-ink">Create your own</span>
            <span className="text-xs leading-snug text-ink-muted">Something else? Set it up your way.</span>
          </button>
        </div>
      </div>
    );
  }

  const pickedStyle = categoryStyle(picked.category);

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state && "error" in state ? state.error : undefined} />

      <button
        type="button"
        onClick={() => setPicked(null)}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink-muted transition-brand hover:text-ink"
      >
        <ArrowLeft weight="bold" className="size-3.5" /> Change type
      </button>

      <input type="hidden" name="category" value={picked.category} />
      <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${pickedStyle.bg} ${pickedStyle.text}`}>
        <pickedStyle.icon weight="fill" className="size-4.5" />
        {pickedStyle.label}
      </div>

      <Field
        key={picked.category}
        label="Title"
        name="title"
        required
        defaultValue={picked.title}
        placeholder="Friday night welcome dinner"
      />
      <TextAreaField
        label="Description"
        name="description"
        required
        defaultValue={prefill?.description}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Starts" name="startsAt" type="datetime-local" required />
        <Field label="Ends" name="endsAt" type="datetime-local" required />
      </div>

      <Field
        label="Location"
        name="location"
        icon={MapPin}
        required
        placeholder="Church fellowship hall, or a video link"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <CheckboxField
        label="Host this at our church building"
        name="atChurch"
        checked={atChurch}
        onChange={(e) => {
          setAtChurch(e.target.checked);
          if (e.target.checked) setLocation(churchName);
        }}
      />
      <CheckboxField label="This is a virtual gathering" name="isVirtual" defaultChecked={prefill?.isVirtual} />

      <LocationPicker
        title="Add to the event map (optional)"
        helpText="Shows this gathering as a pin on the event map so people can find it visually."
        defaultAddress={prefill?.address ?? undefined}
        defaultLat={prefill?.locationLat}
        defaultLng={prefill?.locationLng}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Volunteer capacity"
          name="volunteerCap"
          type="number"
          min={0}
          icon={HandHeart}
          hint="0 = no helpers needed. Leave blank for no limit."
          defaultValue={prefill?.volunteerCap ?? undefined}
        />
        <Field
          label="Student capacity"
          name="studentCap"
          type="number"
          min={0}
          icon={GraduationCap}
          hint="0 = no attendees needed. Leave blank for no limit."
          defaultValue={prefill?.studentCap ?? undefined}
        />
      </div>

      <SubmitButton pendingText="Creating…" className="w-full">
        Publish gathering
      </SubmitButton>
    </form>
  );
}
