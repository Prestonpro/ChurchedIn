"use client";

import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import type { MultiValue, SingleValue } from "react-select";
import type { Icon } from "@phosphor-icons/react";

type Option = { value: string; label: string };

function Wrapper({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  /** Points at react-select's real text input (see `inputId` below), so the
   * combobox has a programmatic accessible name and not just a visual one. */
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
    </label>
  );
}

export function SearchableSelect({
  label,
  hint,
  name,
  icon: IconComponent,
  options,
  isMulti = false,
  defaultValue = "",
  placeholder = "Select...",
}: {
  label: string;
  hint?: string;
  name: string;
  icon?: Icon;
  options: string[];
  isMulti?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  const selectOptions = options.map((opt) => ({ value: opt, label: opt }));

  const parseDefaultValue = () => {
    if (!defaultValue) return isMulti ? [] : null;
    if (isMulti) {
      const vals = defaultValue.split(",").map((v) => v.trim()).filter(Boolean);
      return vals.map(val => {
        const found = selectOptions.find((opt) => opt.value === val);
        return found || { value: val, label: val };
      });
    }
    const found = selectOptions.find((opt) => opt.value === defaultValue);
    return found || { value: defaultValue, label: defaultValue };
  };

  const [selected, setSelected] = useState<Option | Option[] | null>(parseDefaultValue());

  // Renders the open menu into a portal on <body> instead of inline — inline,
  // it's just an absolutely-positioned child of this field's own wrapper, so
  // a tall menu visually overlapping a neighboring field's icon (which has
  // its own z-index) doesn't reliably stay on top of everything below it.
  // Portaling escapes that entirely. `mounted` guards the document.body
  // reference, which doesn't exist during server rendering.
  //
  // The flag is set from a timeout rather than straight from the effect body on
  // purpose: `react-hooks/set-state-in-effect` is an ESLint *error* here, not a
  // warning, and ESLint errors fail the Vercel build. Deferring by a tick keeps
  // the setState out of the effect body and satisfies the rule.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  // Derive the string value to insert into the hidden input
  const hiddenValue = isMulti
    ? (selected as Option[])?.map((s) => s.value).join(", ") || ""
    : (selected as Option)?.value || "";

  // react-select's onChange passes a readonly MultiValue array (isMulti) or
  // a single Option-or-null (SingleValue) — spread the array so it matches
  // the plain mutable Option[] the rest of this component works with.
  function handleChange(newValue: MultiValue<Option> | SingleValue<Option>) {
    setSelected(isMulti ? [...(newValue as MultiValue<Option>)] : (newValue as SingleValue<Option>));
  }

  // Field names are unique within a form, so this is stable across the server
  // and client renders — which matters for `instanceId` below.
  const inputId = `select-${name}`;

  return (
    <Wrapper label={label} hint={hint} htmlFor={inputId}>
      <div className="relative">
        {IconComponent && (
          <IconComponent
            weight="bold"
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint"
          />
        )}
        <CreatableSelect
          isMulti={isMulti}
          options={selectOptions}
          value={selected}
          onChange={handleChange}
          placeholder={placeholder}
          formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
          inputId={inputId}
          // Without an explicit instanceId, react-select derives element ids
          // from a module-level counter, which advances in a different order on
          // the server than in the browser — so every one of these rendered
          // `react-select-10-input` server-side and `react-select-7-input`
          // client-side, and React reported a hydration mismatch and threw away
          // the server HTML for the subtree. A stable id per field removes it.
          instanceId={inputId}
          menuPortalTarget={mounted ? document.body : undefined}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 60 }) }}
          classNames={{
            control: (state) =>
              `min-h-11 rounded-lg border bg-surface transition-brand ${
                state.isFocused
                  ? "border-brand-400 outline-none ring-4 ring-brand-100"
                  : "border-line-strong hover:border-ink-faint"
              } ${IconComponent ? "pl-8" : "pl-1"}`,
            valueContainer: () => "py-1.5 text-sm text-ink",
            placeholder: () => "text-ink-faint",
            input: () => "text-ink",
            singleValue: () => "text-ink",
            multiValue: () => "bg-brand-50 rounded-md border border-brand-200 m-1 text-brand-700",
            multiValueLabel: () => "px-2 py-0.5 text-sm font-medium",
            multiValueRemove: () => "hover:bg-brand-100 hover:text-brand-900 rounded-r-md px-1 transition-colors",
            menu: () => "z-50 mt-1 rounded-lg border border-line-strong bg-surface shadow-card",
            option: (state) =>
              `cursor-pointer px-3.5 py-2.5 text-sm ${
                state.isFocused ? "bg-brand-50 text-brand-900" : "text-ink"
              } ${state.isSelected ? "font-semibold text-brand-700" : ""}`,
          }}
          unstyled
        />
        <input type="hidden" name={name} value={hiddenValue} />
      </div>
    </Wrapper>
  );
}
