import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/Card";

/**
 * Summary card for the top of a dashboard — "3 upcoming events", "2 friend
 * requests waiting", etc. The left-border accent is a faint color cue per
 * card type (separate from the icon chip's own tone), so a row of these
 * reads as distinct at a glance rather than a wall of identical cards.
 */
export function StatCard({
  icon: IconComponent,
  label,
  value,
  sublabel,
  tone,
  accent,
  href,
}: {
  icon: Icon;
  label: string;
  value: number | string;
  /** e.g. the next event's title, shown smaller under the count. */
  sublabel?: string;
  /** Icon chip background + text classes, e.g. "bg-brand-50 text-brand-600". */
  tone: string;
  /** Left-border accent color class, e.g. "border-l-brand-500". */
  accent: string;
  href?: string;
}) {
  const card = (
    <Card interactive={!!href} className={`border-l-4 ${accent}`}>
      <div className="flex items-center gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-brand ${tone}`}>
          <IconComponent weight="fill" className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-muted">{label}</p>
          <p className="text-2xl font-extrabold text-ink">{value}</p>
          {sublabel && <p className="truncate text-xs text-ink-faint">{sublabel}</p>}
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}
