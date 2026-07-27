"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X, SignOut } from "@phosphor-icons/react/dist/ssr";
import { logoutAction } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui/Avatar";
import { NAV_ICONS, type NavLink } from "./NavLinks";
import { ChurchSwitcher } from "./ChurchSwitcher";

/**
 * Replaces the desktop header's inline nav/church-switcher/avatar/logout row
 * below the md breakpoint — that row measurably overflows at 320-375px
 * (verified: every authenticated page overflowed horizontally there before
 * this existed, zero public pages did). A slide-out drawer has room for
 * full labels and real touch targets instead of squeezing icons together.
 */
export function MobileMenu({
  links,
  userName,
  churchName,
  memberships,
  activeChurchId,
  profilePath,
}: {
  links: NavLink[];
  userName: string;
  churchName?: string;
  memberships: { churchId: string; church: { name: string } }[];
  activeChurchId?: string;
  profilePath: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className="flex size-11 items-center justify-center rounded-lg text-ink-soft transition-brand hover:bg-paper"
      >
        <List weight="bold" className="size-6" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-ink/40"
          />
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-3">
                <Link href={profilePath} onClick={() => setOpen(false)}>
                  <Avatar name={userName} size="sm" />
                </Link>
                <div>
                  <Link
                    href={profilePath}
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-ink hover:underline"
                  >
                    {userName}
                  </Link>
                  {churchName && activeChurchId && (
                    <Link
                      href={`/churches/${activeChurchId}`}
                      onClick={() => setOpen(false)}
                      className="block text-xs text-ink-muted hover:underline"
                    >
                      {churchName}
                    </Link>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-paper"
              >
                <X weight="bold" className="size-5" />
              </button>
            </div>

            {memberships.length > 1 && activeChurchId && (
              <div className="border-b border-line px-5 py-3">
                <ChurchSwitcher memberships={memberships} activeChurchId={activeChurchId} />
              </div>
            )}

            <nav className="flex-1 overflow-y-auto px-3 py-3">
              {links.map((link) => {
                const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                const Icon = NAV_ICONS[link.iconKey];
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-base font-medium transition-brand ${
                      active ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <span className="relative flex">
                      <Icon weight={active ? "fill" : "regular"} className="size-5" />
                      {link.hasBadge && (
                        <span className="absolute -right-1 -top-1 size-1.5 rounded-full bg-accent-500" />
                      )}
                    </span>
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <form action={logoutAction} className="border-t border-line px-3 py-3">
              <button
                type="submit"
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-base font-medium text-danger transition-brand hover:bg-danger-soft"
              >
                <SignOut weight="bold" className="size-5" />
                Log out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
