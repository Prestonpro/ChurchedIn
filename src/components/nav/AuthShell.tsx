import Link from "next/link";
import { SquaresFour, CalendarBlank, Flag, UserCircle, UsersThree, SignOut } from "@phosphor-icons/react/dist/ssr";
import type { CurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { logoutAction } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui/Avatar";
import { NavLinks, type NavLink } from "./NavLinks";
import { ChurchSwitcher } from "./ChurchSwitcher";

function navLinksForRole(role: string): NavLink[] {
  const events = { href: "/events", label: "Events", icon: CalendarBlank };
  if (role === ROLES.CHURCH_ADMIN) {
    return [
      { href: "/admin/dashboard", label: "Dashboard", icon: SquaresFour },
      events,
      { href: "/admin/reports", label: "Reports", icon: Flag },
    ];
  }
  if (role === ROLES.VOLUNTEER) {
    return [
      { href: "/volunteer/dashboard", label: "Dashboard", icon: SquaresFour },
      events,
      { href: "/volunteer/profile", label: "My profile", icon: UserCircle },
    ];
  }
  return [
    { href: "/student/dashboard", label: "Dashboard", icon: SquaresFour },
    events,
    { href: "/student/mentors", label: "Mentors", icon: UsersThree },
    { href: "/student/profile", label: "My profile", icon: UserCircle },
  ];
}

export function AuthShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  const role = user.activeMembership?.role ?? ROLES.STUDENT;
  const links = navLinksForRole(role);

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-5">
            <Link href="/events" className="flex items-center gap-2 text-base font-bold text-brand-700">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <UsersThree weight="fill" className="size-4.5" />
              </span>
              <span className="hidden md:inline">Church LinkedIn</span>
            </Link>
            <NavLinks links={links} />
          </div>
          <div className="flex items-center gap-3">
            {user.activeMembership && (
              <ChurchSwitcher
                memberships={user.memberships}
                activeChurchId={user.activeMembership.churchId}
              />
            )}
            <div className="flex items-center gap-2">
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-sm font-medium text-ink-soft lg:inline">{user.name}</span>
            </div>
            <form action={logoutAction}>
              <button
                className="flex size-8 items-center justify-center rounded-lg text-ink-faint transition-brand hover:bg-danger-soft hover:text-danger"
                type="submit"
                title="Log out"
              >
                <SignOut className="size-4.5" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
