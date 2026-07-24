const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Little month/day box — the classic event-listing date treatment,
 * scannable at a glance without reading a full date string. */
export function DateBadge({ date, className = "" }: { date: Date; className?: string }) {
  return (
    <div
      className={`flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-xl border border-line bg-surface shadow-soft ${className}`}
    >
      <div className="w-full bg-brand-600 py-0.5 text-center text-[10px] font-bold tracking-wide text-white">
        {MONTHS[date.getMonth()]}
      </div>
      <div className="py-1 text-xl font-extrabold text-ink">{date.getDate()}</div>
    </div>
  );
}
