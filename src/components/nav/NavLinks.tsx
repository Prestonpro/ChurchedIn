"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, SquaresFour, CalendarBlank, Compass, GearSix, UsersThree, Car, Buildings, ChatCircleDots, Flag } from "@phosphor-icons/react/dist/ssr";

// Server Components can't pass component/function references (like a Phosphor
// icon) as props to Client Components — only plain serializable data crosses
// that boundary. So the icon lookup lives here, keyed by a plain string that
// AuthShell (a server component) can safely pass in.
export const NAV_ICONS = {
  home: House,
  dashboard: SquaresFour,
  events: CalendarBlank,
  discover: Compass,
  settings: GearSix,
  mentors: UsersThree,
  rides: Car,
  church: Buildings,
  messages: ChatCircleDots,
  reports: Flag,
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;
export type NavLink = {
  href: string;
  label: string;
  iconKey: NavIconKey;
  hasBadge?: boolean;
  /** An unread count (Messages) rather than a plain dot (Events' "something's
   * new") — a number communicates real information a dot can't. Renders as
   * "9+" once it's too wide to read at a glance. */
  badgeCount?: number;
};

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
              {!!link.badgeCount && (
                <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold leading-none text-white">
                  {link.badgeCount > 9 ? "9+" : link.badgeCount}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
