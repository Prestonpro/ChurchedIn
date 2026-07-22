import type { Icon } from "@phosphor-icons/react";

type Tone = "brand" | "accent" | "success" | "warning" | "danger" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  accent: "bg-accent-50 text-accent-700",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-paper text-ink-muted border border-line",
};

export function Badge({
  tone = "neutral",
  icon: IconComponent,
  className = "",
  children,
}: {
  tone?: Tone;
  icon?: Icon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {IconComponent && <IconComponent weight="bold" className="size-3.5" />}
      {children}
    </span>
  );
}

/** For category chips that carry their own bg/text classes (see eventCategoryStyle). */
export function StyledBadge({
  icon: IconComponent,
  className = "",
  children,
}: {
  icon?: Icon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {IconComponent && <IconComponent weight="bold" className="size-3.5" />}
      {children}
    </span>
  );
}
