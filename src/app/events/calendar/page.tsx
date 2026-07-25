import Link from "next/link";
import {
  CalendarBlank,
  Rows,
  ArrowLeft,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth";
import { listEventsForChurch } from "@/lib/queries";
import { categoryStyle } from "@/lib/eventCategoryStyle";
import { AuthShell } from "@/components/nav/AuthShell";
import { Card } from "@/components/ui/Card";
import { StyledBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { EVENT_CATEGORY_LABELS, type EventCategory } from "@/lib/constants";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseMonthParam(month?: string): { year: number; monthIndex: number } {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    if (!Number.isNaN(y) && m >= 1 && m <= 12) {
      return { year: y, monthIndex: m - 1 };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

function monthParam(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function EventsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; category?: string; mine?: string; day?: string }>;
}) {
  const user = await requireUser();
  if (!user.activeMembership) {
    return (
      <AuthShell user={user}>
        <EmptyState
          icon={CalendarBlank}
          title="Join a church to see its calendar"
          body="Enter a join code to get started."
          action={
            <LinkButton href="/join" size="sm">
              Enter a join code
            </LinkButton>
          }
        />
      </AuthShell>
    );
  }

  const { month, category, mine, day } = await searchParams;
  const { year, monthIndex } = parseMonthParam(month);

  const events = await listEventsForChurch(user.activeMembership.churchId);
  const filtered = events.filter((e) => {
    if (category && e.category !== category) return false;
    if (mine === "1" && !e.rsvps.some((r) => r.userId === user.id)) return false;
    return true;
  });

  const eventsByDay = new Map<string, typeof filtered>();
  for (const e of filtered) {
    const key = dayKey(e.startsAt);
    const list = eventsByDay.get(key) ?? [];
    list.push(e);
    eventsByDay.set(key, list);
  }

  const firstOfMonth = new Date(year, monthIndex, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const date = new Date(year, monthIndex, i - startOffset + 1);
    return { date, inMonth: date.getMonth() === monthIndex };
  });

  const prevMonth = monthIndex === 0 ? { year: year - 1, monthIndex: 11 } : { year, monthIndex: monthIndex - 1 };
  const nextMonth = monthIndex === 11 ? { year: year + 1, monthIndex: 0 } : { year, monthIndex: monthIndex + 1 };
  const currentMonthParam = monthParam(year, monthIndex);
  const todayKey = dayKey(new Date());

  function hrefFor(overrides: { month?: string; day?: string }): string {
    const params = new URLSearchParams();
    const merged = { month: currentMonthParam, category, mine, day, ...overrides };
    if (merged.month) params.set("month", merged.month);
    if (merged.category) params.set("category", merged.category);
    if (merged.mine) params.set("mine", merged.mine);
    if (merged.day) params.set("day", merged.day);
    return `/events/calendar?${params.toString()}`;
  }

  const selectedDayEvents = day ? eventsByDay.get(day) ?? [] : [];

  return (
    <AuthShell user={user}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Calendar</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {user.activeMembership.church.name}&apos;s gatherings, by month.
          </p>
        </div>
        <Link
          href="/events"
          className="flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-sm font-medium text-ink-soft transition-brand hover:border-brand-300 hover:bg-paper"
        >
          <Rows weight="bold" className="size-4" /> List view
        </Link>
      </div>

      <Card className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="month" value={currentMonthParam} />
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-ink-soft">Category</span>
            <select
              name="category"
              defaultValue={category ?? ""}
              className="min-h-11 rounded-lg border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink transition-brand hover:border-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            >
              <option value="">All categories</option>
              {Object.entries(EVENT_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium text-ink-soft">
            <input
              type="checkbox"
              name="mine"
              value="1"
              defaultChecked={mine === "1"}
              className="size-4.5 rounded border-line-strong text-brand-600 focus:ring-2 focus:ring-brand-200"
            />
            My RSVP&apos;d events only
          </label>
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-brand hover:bg-brand-700"
          >
            Apply
          </button>
        </form>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <Link
          href={hrefFor({ month: monthParam(prevMonth.year, prevMonth.monthIndex), day: undefined })}
          className="flex size-9 items-center justify-center rounded-lg border border-line-strong text-ink-soft transition-brand hover:bg-paper"
        >
          <ArrowLeft weight="bold" className="size-4" />
        </Link>
        <h2 className="text-lg font-bold text-ink">
          {firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <Link
          href={hrefFor({ month: monthParam(nextMonth.year, nextMonth.monthIndex), day: undefined })}
          className="flex size-9 items-center justify-center rounded-lg border border-line-strong text-ink-soft transition-brand hover:bg-paper"
        >
          <ArrowRight weight="bold" className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-faint sm:gap-1.5">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map(({ date, inMonth }) => {
          const key = dayKey(date);
          const dayEvents = eventsByDay.get(key) ?? [];
          const isSelected = day === key;
          const isToday = key === todayKey;
          return (
            <Link
              key={key}
              href={hrefFor({ day: isSelected ? undefined : key })}
              className={`flex min-h-16 flex-col gap-1 rounded-lg border p-1.5 text-left transition-brand sm:min-h-24 ${
                isSelected ? "border-brand-400 bg-brand-50" : "border-line hover:bg-paper"
              } ${inMonth ? "" : "opacity-40"}`}
            >
              <span
                className={`text-xs font-semibold ${
                  isToday
                    ? "flex size-5 items-center justify-center rounded-full bg-brand-600 text-white"
                    : "text-ink-soft"
                }`}
              >
                {date.getDate()}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {dayEvents.slice(0, 3).map((e) => {
                    const style = categoryStyle(e.category as EventCategory);
                    return <span key={e.id} className={`size-1.5 rounded-full ${style.dot}`} />;
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] font-medium text-ink-faint">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {day && (
        <Card className="mt-6">
          <h2 className="mb-3 font-bold text-ink">
            {new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-ink-muted">Nothing on the calendar this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((e) => {
                const style = categoryStyle(e.category as EventCategory);
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="flex items-center justify-between rounded-xl border border-line p-3 transition-brand hover:border-brand-200 hover:bg-paper"
                  >
                    <div className="flex items-center gap-3">
                      <StyledBadge icon={style.icon} className={style.chipClass}>
                        {style.label}
                      </StyledBadge>
                      <span className="text-sm font-semibold text-ink">{e.title}</span>
                    </div>
                    <span className="text-xs text-ink-muted">
                      {e.startsAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </AuthShell>
  );
}
