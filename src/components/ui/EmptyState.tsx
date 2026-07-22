import type { Icon } from "@phosphor-icons/react";

export function EmptyState({
  icon: IconComponent,
  title,
  body,
  action,
}: {
  icon: Icon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-paper text-ink-faint">
        <IconComponent weight="duotone" className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
