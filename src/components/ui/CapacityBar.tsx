export function CapacityBar({
  label,
  count,
  cap,
}: {
  label: string;
  count: number;
  cap: number | null;
}) {
  const pct = cap ? Math.min(100, Math.round((count / cap) * 100)) : 0;
  const full = cap !== null && count >= cap;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
        <span>{label}</span>
        <span className={full ? "font-semibold text-warning" : ""}>
          {count}
          {cap ? ` / ${cap}` : ""}
        </span>
      </div>
      {cap !== null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full transition-brand ${full ? "bg-warning" : "bg-brand-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
