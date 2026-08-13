"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { createRequestAction } from "@/lib/actions/requests";
import { SelectField, Field, TextAreaField, FormError } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";
import { REQUEST_CATEGORY_LABELS } from "@/lib/constants";

/**
 * Posts a blind, untargeted request — any eligible church member can claim
 * it later (Furniture/Food/Housing/Other, and Mentorship too if you'd
 * rather not browse and pick a specific person — see the directory tab for
 * that targeted flow instead).
 */
export function NewRequestForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(createRequestAction, undefined);

  useEffect(() => {
    if (state && "ok" in state) {
      setTimeout(() => setOpen(false), 0);
    }
  }, [state]);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus weight="bold" className="size-4" /> New request
      </Button>
    );
  }

  return (
    <form action={formAction} className="max-w-md space-y-3 rounded-xl border border-line-strong bg-white p-4">
      <FormError message={state && "error" in state ? state.error : undefined} />
      <SelectField label="Category" name="category" defaultValue="OTHER">
        {Object.entries(REQUEST_CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <Field label="Title" name="title" placeholder="What do you need?" required maxLength={150} />
      <TextAreaField
        label="Details (optional)"
        name="description"
        placeholder="Any details that would help someone decide to help."
      />
      <div className="flex items-center gap-2">
        <SubmitButton size="sm" pendingText="Posting…">
          Post request
        </SubmitButton>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
