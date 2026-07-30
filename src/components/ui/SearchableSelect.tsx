"use client";

import { useState } from "react";
import Select from "react-select";
import type { Icon } from "@phosphor-icons/react";

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
      return selectOptions.filter((opt) => vals.includes(opt.value));
    }
    return selectOptions.find((opt) => opt.value === defaultValue) || null;
  };

  const [selected, setSelected] = useState<any>(parseDefaultValue());

  // Derive the string value to insert into the hidden input
  const hiddenValue = isMulti
    ? (selected as { value: string }[])?.map((s) => s.value).join(", ") || ""
    : (selected as { value: string })?.value || "";

  return (
    <Wrapper label={label} hint={hint}>
      <div className="relative">
        {IconComponent && (
          <IconComponent
            weight="bold"
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-faint"
          />
        )}
        <Select
          isMulti={isMulti}
          options={selectOptions}
          value={selected}
          onChange={setSelected}
          placeholder={placeholder}
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
