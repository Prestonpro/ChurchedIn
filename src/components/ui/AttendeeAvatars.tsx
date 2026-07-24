import { Avatar } from "@/components/ui/Avatar";

/** Overlapping avatar circles + "and N more" — the social-proof glance
 * ("3 people going") Facebook-style event cards use instead of a bare count. */
export function AttendeeAvatars({
  names,
  totalCount,
  max = 4,
}: {
  names: string[];
  totalCount: number;
  max?: number;
}) {
  if (totalCount === 0) {
    return <p className="text-xs text-ink-faint">No one yet — be the first!</p>;
  }

  const shown = names.slice(0, max);
  const overflow = totalCount - shown.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((name, i) => (
          <Avatar key={i} name={name} size="xs" className="ring-2 ring-surface" />
        ))}
      </div>
      <p className="text-xs font-medium text-ink-muted">
        {overflow > 0 ? `${shown.length} + ${overflow} more going` : `${totalCount} going`}
      </p>
    </div>
  );
}
