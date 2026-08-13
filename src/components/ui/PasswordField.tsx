"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeSlash, LockSimple } from "@phosphor-icons/react/dist/ssr";
import { INPUT_CLASSES, FieldWrapper } from "@/components/ui/Field";

/**
 * A password input with a show/hide toggle. Testers couldn't tell whether
 * they'd mistyped a password on a phone keyboard, and the only recourse was
 * to clear the field and start over — especially punishing on the signup
 * forms, where a typo isn't caught by anything until the "passwords don't
 * match" error two fields later.
 *
 * Deliberately a separate component rather than a `revealable` prop on
 * Field: this needs `useState` (so, a Client Component), and Field is
 * imported by server components. Keeping the client boundary here means
 * Field stays server-renderable everywhere it already is.
 *
 * The toggle is `type="button"` — without that it defaults to `submit`
 * inside a <form> and revealing your password would post the form.
 */
export function PasswordField({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const [revealed, setRevealed] = useState(false);
  // Ties the button's description to this specific field, so a screen
  // reader on a two-password form (reset-password has "New" + "Confirm")
  // announces which one is being toggled.
  const inputId = useId();

  return (
    <FieldWrapper label={label} hint={hint}>
      <div className="relative">
        <LockSimple
          weight="bold"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
        />
        <input
          id={inputId}
          type={revealed ? "text" : "password"}
          // pr-11 keeps long passwords from running under the toggle button.
          className={`${INPUT_CLASSES} pl-10 pr-11 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={revealed}
          aria-controls={inputId}
          title={revealed ? "Hide password" : "Show password"}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-ink-faint transition-brand hover:bg-paper hover:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        >
          {revealed ? <EyeSlash weight="bold" className="size-4" /> : <Eye weight="bold" className="size-4" />}
        </button>
      </div>
    </FieldWrapper>
  );
}
