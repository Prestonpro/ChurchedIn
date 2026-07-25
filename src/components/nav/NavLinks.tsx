"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, CalendarBlank, Flag, UserCircle, UsersThree } from "@phosphor-icons/react/dist/ssr";

// Server Components can't pass component/function references (like a Phosphor
// icon) as props to Client Components — only plain serializable data crosses
// that boundary. So the icon lookup lives here, keyed by a plain string that
// AuthShell (a server component) can safely pass in.
export const NAV_ICONS = {
  dashboard: SquaresFour,
  events: CalendarBlank,
  reports: Flag,
  profile: UserCircle,
  mentors: UsersThree,
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;
export type NavLink = { href: string; label: string; iconKey: NavIconKey; hasBadge?: boolean };

export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
        const Icon = NAV_ICONS[link.iconKey];
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-brand ${
              active
                ? "bg-brand-50 text-brand-700"
                : "text-ink-soft hover:bg-paper hover:text-ink"
            }`}
          >
            <span className="relative flex">
              <Icon weight={active ? "fill" : "regular"} className="size-4" />
              {link.hasBadge && (
                <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-accent-500" />
              )}
            </span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
