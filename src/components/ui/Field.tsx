import { type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import type { Icon } from "@phosphor-icons/react";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";

/** Exported so PasswordField can reuse the exact same input styling —
 * it can't just render a <Field> because it needs to own the input's
 * `type` to toggle it, and it adds a trailing show/hide button. */
export const INPUT_CLASSES =
  "w-full min-h-11 rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-base text-ink placeholder:text-ink-faint transition-brand hover:border-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:text-sm";

export function FieldWrapper({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return <Wrapper label={label} hint={hint}>{children}</Wrapper>;
}

function Wrapper({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

export function Field({
  label,
  hint,
  className = "",
  icon: IconComponent,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; icon?: Icon }) {
  const inputEl = (
    <input className={`${INPUT_CLASSES} ${IconComponent ? 'pl-10 ' : ''}${className}`} {...props} />
  );

  return (
    <Wrapper label={label} hint={hint}>
      {IconComponent ? (
        <div className="relative">
          <IconComponent
            weight="bold"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
          />
          {inputEl}
        </div>
      ) : (
        inputEl
      )}
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  hint,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <Wrapper label={label} hint={hint}>
      <textarea className={`${INPUT_CLASSES} min-h-24 ${className}`} {...props} />
    </Wrapper>
  );
}

export function SelectField({
  label,
  hint,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  return (
    <Wrapper label={label} hint={hint}>
      <select className={`${INPUT_CLASSES} ${className}`} {...props}>
        {children}
      </select>
    </Wrapper>
  );
}

export function CheckboxField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
      <input
        type="checkbox"
        className="size-4.5 shrink-0 rounded border-line-strong text-brand-600 focus:ring-2 focus:ring-brand-200"
        {...props}
      />
      {label}
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="flex items-start gap-2 rounded-lg border border-danger-soft bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
      role="alert"
    >
      <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
