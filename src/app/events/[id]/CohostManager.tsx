"use client";

import { useState, useTransition } from "react";
import { MagnifyingGlass, UserPlus, X } from "@phosphor-icons/react/dist/ssr";
import { inviteCohostAction, removeCohostAction } from "@/lib/actions/events";
import { Avatar } from "@/components/ui/Avatar";

type Person = { id: string; name: string };

/** Creator-only co-host management: current co-hosts with a remove button,
 * plus a simple name-filter over the pre-fetched candidate list with an add
 * button — no live search request, no invite/accept step (MVP scope). */
export function CohostManager({
  eventId,
  cohosts,
  candidates,
}: {
  eventId: string;
  cohosts: Person[];
  candidates: Person[];
}) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = query.trim()
    ? candidates.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
    : candidates;

  function add(userId: string) {
    setPendingId(userId);
    startTransition(async () => {
      await inviteCohostAction(eventId, userId);
      setPendingId(null);
      setQuery("");
    });
  }

  function remove(userId: string) {
    setPendingId(userId);
    startTransition(async () => {
      await removeCohostAction(eventId, userId);
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-3">
      {cohosts.length > 0 && (
        <ul className="space-y-2">
          {cohosts.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
              <div className="flex items-center gap-2.5">
                <Avatar name={c.name} size="xs" />
                <span className="text-sm font-medium text-ink">{c.name}</span>
              </div>
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={pending && pendingId === c.id}
                title="Remove co-host"
                className="flex size-7 items-center justify-center rounded-lg text-ink-faint transition-brand hover:bg-danger-soft hover:text-danger disabled:opacity-50"
              >
                <X weight="bold" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {candidates.length === 0 ? (
        <p className="text-xs text-ink-faint">No other volunteers at your church to invite yet.</p>
      ) : (
        <div>
          <div className="relative">
            <MagnifyingGlass
              weight="bold"
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search volunteers to invite…"
              className="w-full rounded-lg border border-line-strong bg-white py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
          {query && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {filtered.length === 0 && <li className="text-xs text-ink-faint">No matches.</li>}
              {filtered.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-paper">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} size="xs" />
                    <span className="text-sm text-ink">{c.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => add(c.id)}
                    disabled={pending && pendingId === c.id}
                    className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 transition-brand hover:bg-brand-100 disabled:opacity-50"
                  >
                    <UserPlus weight="bold" className="size-3" /> Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
