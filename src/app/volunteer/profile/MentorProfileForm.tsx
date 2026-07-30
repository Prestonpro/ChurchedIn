"use client";

import { useActionState } from "react";
import { Briefcase, Building, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { updateMentorProfileAction } from "@/lib/actions/mentors";
import { Field, TextAreaField, CheckboxField, FormError } from "@/components/ui/Field";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { LANGUAGES, INDUSTRIES } from "@/lib/constants";

export function MentorProfileForm({
  initial,
}: {
  initial: { 
    languages: string; 
    interests: string; 
    openToMentor: boolean;
    jobTitle: string;
    company: string;
    industry: string;
    hobbies: string;
    linkedinUrl: string;
  };
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Job title (optional)"
          name="jobTitle"
          icon={Briefcase}
          defaultValue={initial.jobTitle}
          placeholder="Software Engineer, Teacher..."
        />
        <Field
          label="Company (optional)"
          name="company"
          icon={Building}
          defaultValue={initial.company}
          placeholder="Acme Corp"
        />
        <SearchableSelect
          label="Industry (optional)"
          name="industry"
          defaultValue={initial.industry}
          options={INDUSTRIES}
          placeholder="Technology, Healthcare..."
        />
        <Field
          label="LinkedIn profile (optional)"
          name="linkedinUrl"
          icon={LinkedinLogo}
          defaultValue={initial.linkedinUrl}
          placeholder="https://linkedin.com/in/..."
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SearchableSelect
          label="Languages you speak"
          name="languages"
          defaultValue={initial.languages}
          placeholder="English, Mandarin, Spanish…"
          options={LANGUAGES}
          isMulti
        />
        <SearchableSelect
          label="Hobbies (optional)"
          name="hobbies"
          defaultValue={initial.hobbies}
          placeholder="Reading, hiking, cooking..."
          options={["Reading", "Hiking", "Cooking", "Photography", "Traveling", "Gaming", "Music", "Art", "Sports"]}
          isMulti
        />
      </div>
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
