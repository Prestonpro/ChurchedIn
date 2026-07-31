"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X, SignOut, Question } from "@phosphor-icons/react/dist/ssr";
import { logoutAction } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui/Avatar";
import { HelpGuideModal } from "@/components/HelpGuideButton";
import { NAV_ICONS, type NavLink } from "./NavLinks";
import { ChurchSwitcher } from "./ChurchSwitcher";
import type { Role } from "@/lib/constants";

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
  role,
}: {
  links: NavLink[];
  userName: string;
  churchName?: string;
  memberships: { churchId: string; church: { name: string } }[];
  activeChurchId?: string;
  profilePath: string;
  role: Role;
}) {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const pathname = usePathname();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    // The drawer claims aria-modal="true", but until now it never actually
    // trapped focus or moved it anywhere — Tab walked straight past the
    // drawer into the still-visible page behind it, and closing never
    // returned focus to the button that opened it. ui/Modal.tsx already gets
    // this right; this mirrors it.
    // Captured now rather than read from the ref in the cleanup below — by
    // the time cleanup runs, openButtonRef.current could point at a
    // different (or unmounted) node.
    const restoreFocusTo = (document.activeElement as HTMLElement | null) ?? openButtonRef.current;
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      restoreFocusTo?.focus();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={openButtonRef}
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
          {/* A plain div, not a second button — the real close button below
            already has the "Close menu" label; a focusable, identically-
            labeled backdrop just duplicated it for screen-reader users. */}
          <div aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-ink/40" />
          <div
            ref={drawerRef}
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
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setHelpOpen(true);
                  }}
                  title="Help"
                  aria-label="Help"
                  className="flex size-11 items-center justify-center rounded-lg text-ink-faint hover:bg-paper"
                >
                  <Question weight="bold" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex size-11 items-center justify-center rounded-lg text-ink-faint hover:bg-paper"
                >
                  <X weight="bold" className="size-5" />
                </button>
              </div>
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
      <HelpGuideModal role={role} churchId={activeChurchId ?? ""} open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
