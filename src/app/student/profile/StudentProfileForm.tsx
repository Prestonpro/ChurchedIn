"use client";

import { useActionState } from "react";
import { Globe, GraduationCap } from "@phosphor-icons/react/dist/ssr";
import { updateStudentProfileAction } from "@/lib/actions/mentors";
import { Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { COUNTRIES, LANGUAGES, SCHOOLS } from "@/lib/constants";

export function StudentProfileForm({
  initial,
}: {
  initial: { countryOfOrigin: string; school: string; languages: string; interests: string };
}) {
  const [state, formAction] = useActionState(updateStudentProfileAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <SearchableSelect 
        label="Country of origin" 
        name="countryOfOrigin" 
        icon={Globe} 
        defaultValue={initial.countryOfOrigin} 
        options={COUNTRIES}
      />
      <SearchableSelect 
        label="School / program" 
        name="school" 
        icon={GraduationCap} 
        defaultValue={initial.school} 
        options={SCHOOLS}
      />
      <SearchableSelect 
        label="Languages you speak" 
        name="languages" 
        defaultValue={initial.languages} 
        options={LANGUAGES}
        isMulti
      />
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
