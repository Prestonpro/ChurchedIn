"use client";

import { useActionState } from "react";
import { Globe, GraduationCap } from "@phosphor-icons/react/dist/ssr";
import { updateStudentProfileAction } from "@/lib/actions/mentors";
import { Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function StudentProfileForm({
  initial,
}: {
  initial: { countryOfOrigin: string; school: string; languages: string; interests: string };
}) {
  const [state, formAction] = useActionState(updateStudentProfileAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <Field label="Country of origin" name="countryOfOrigin" icon={Globe} defaultValue={initial.countryOfOrigin} />
      <Field label="School / program" name="school" icon={GraduationCap} defaultValue={initial.school} />
      <Field label="Languages you speak" name="languages" defaultValue={initial.languages} />
      <TextAreaField
        label="Interests"
        name="interests"
        defaultValue={initial.interests}
        placeholder="What would you like help with, or enjoy doing?"
      />
      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
    </form>
  );
}
