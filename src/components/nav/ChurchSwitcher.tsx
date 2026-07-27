"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CaretUpDown, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { switchChurchAction } from "@/lib/actions/auth";

export function ChurchSwitcher({
  memberships,
  activeChurchId,
}: {
  memberships: { churchId: string; church: { name: string } }[];
  activeChurchId: string;
}) {
  const [pending, startTransition] = useTransition();

  if (memberships.length <= 1) {
    return (
      <Link
        href={`/churches/${activeChurchId}`}
        className="hidden text-sm font-medium text-ink-muted transition-brand hover:text-brand-600 sm:inline"
      >
        {memberships[0]?.church.name}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="relative">
        <select
          value={activeChurchId}
          disabled={pending}
          onChange={(e) => startTransition(async () => { await switchChurchAction(e.target.value); })}
          className="cursor-pointer appearance-none rounded-lg border border-line-strong bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-ink transition-brand hover:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
        >
          {memberships.map((m) => (
            <option key={m.churchId} value={m.churchId}>
              {m.church.name}
            </option>
          ))}
        </select>
        <CaretUpDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
      </div>
      <Link
        href={`/churches/${activeChurchId}`}
        title="View church page"
        aria-label="View church page"
        className="flex size-8 items-center justify-center rounded-lg text-ink-faint transition-brand hover:bg-paper hover:text-ink"
      >
        <ArrowSquareOut weight="bold" className="size-4" />
      </Link>
    </div>
  );
}
