"use client";

import { useActionState } from "react";
import { updateMentorProfileAction } from "@/lib/actions/mentors";
import { Field, TextAreaField, CheckboxField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LANGUAGES } from "@/lib/constants";

export function MentorProfileForm({
  initial,
}: {
  initial: { languages: string; interests: string; openToMentor: boolean };
}) {
  const [state, formAction] = useActionState(updateMentorProfileAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <div className="rounded-xl border border-line bg-paper/60 p-3.5">
        <CheckboxField
          label="I'm open to being a friend to a student"
          name="openToMentor"
          defaultChecked={initial.openToMentor}
        />
      </div>
      <Field
        label="Languages you speak"
        name="languages"
        defaultValue={initial.languages}
        placeholder="English, Mandarin, Spanish…"
        datalist={LANGUAGES}
      />
      <TextAreaField
        label="Interests / how you can help"
        name="interests"
        defaultValue={initial.interests}
        placeholder="Career advice, homework help, just being a friend…"
      />
      <SubmitButton pendingText="Saving…">Save my profile</SubmitButton>
    </form>
  );
}
