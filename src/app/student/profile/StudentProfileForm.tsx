"use client";

import { useActionState } from "react";
import { Globe, GraduationCap, LinkedinLogo, FacebookLogo, InstagramLogo, CalendarBlank, BookOpenText } from "@phosphor-icons/react/dist/ssr";
import { updateStudentProfileAction } from "@/lib/actions/mentors";
import { Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { COUNTRIES, LANGUAGES, SCHOOLS, MAJORS } from "@/lib/constants";

export function StudentProfileForm({
  initial,
}: {
  initial: {
    bio: string;
    countryOfOrigin: string;
    school: string;
    major: string;
    graduationYear: string;
    languages: string;
    hobbies: string;
    interests: string;
    careerGoals: string;
    linkedinUrl: string;
    facebookUrl: string;
    instagramUrl: string;
  };
}) {
  const [state, formAction] = useActionState(updateStudentProfileAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state && "error" in state ? state.error : undefined} />

      <TextAreaField
        label="Bio / about me"
        name="bio"
        defaultValue={initial.bio}
        placeholder="A sentence or two about yourself. This shows up as-is on your profile and your Friends card."
        hint="Shown as a plain description, not split into tags. Write it like you'd introduce yourself."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SearchableSelect
          label="Country of origin"
          name="countryOfOrigin"
          icon={Globe}
          defaultValue={initial.countryOfOrigin}
          options={COUNTRIES}
        />
        <Field
          label="LinkedIn profile (optional)"
          name="linkedinUrl"
          icon={LinkedinLogo}
          defaultValue={initial.linkedinUrl}
          placeholder="https://linkedin.com/in/..."
        />
        <Field
          label="Facebook profile (optional)"
          name="facebookUrl"
          icon={FacebookLogo}
          defaultValue={initial.facebookUrl}
          placeholder="https://facebook.com/..."
        />
        <Field
          label="Instagram profile (optional)"
          name="instagramUrl"
          icon={InstagramLogo}
          defaultValue={initial.instagramUrl}
          placeholder="https://instagram.com/..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SearchableSelect 
          label="School / program" 
          name="school" 
          icon={GraduationCap} 
          defaultValue={initial.school} 
          options={SCHOOLS}
        />
        <SearchableSelect 
          label="Major" 
          name="major" 
          icon={BookOpenText} 
          defaultValue={initial.major} 
          options={MAJORS}
        />
        <Field
          label="Grad Year"
          name="graduationYear"
          icon={CalendarBlank}
          defaultValue={initial.graduationYear}
          placeholder="2027"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SearchableSelect 
          label="Languages you speak" 
          name="languages" 
          defaultValue={initial.languages} 
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
        label="Career goals (optional)"
        name="careerGoals"
        defaultValue={initial.careerGoals}
        placeholder="What kind of job are you looking for?"
      />
      <TextAreaField
        label="Interests"
        name="interests"
        defaultValue={initial.interests}
        placeholder="What would you like help with, or enjoy doing?"
        hint="Separate each one with a comma. These show up as individual tags, not as a paragraph."
      />
      <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
    </form>
  );
}
