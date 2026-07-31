"use client";

import { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import type { MultiValue, SingleValue } from "react-select";
import type { Icon } from "@phosphor-icons/react";

type Option = { value: string; label: string };

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

  return (
    <Wrapper label={label} hint={hint}>
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
          menuPortalTarget={mounted ? document.body : undefined}
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 60 }) }}
          classNames={{
            control: (state) =>
              `min-h-11 rounded-lg border bg-white transition-brand ${
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
            menu: () => "z-50 mt-1 rounded-lg border border-line-strong bg-white shadow-lg",
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
