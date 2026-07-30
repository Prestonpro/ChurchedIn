import Link from "next/link";
import { UsersThree, SignOut } from "@phosphor-icons/react/dist/ssr";
import type { CurrentUser } from "@/lib/auth";
import { ROLES, profilePathForRole, type Role } from "@/lib/constants";
import { logoutAction } from "@/lib/actions/auth";
import { hasUnseenEvents } from "@/lib/queries";
import { Avatar } from "@/components/ui/Avatar";
import { HelpGuideButton } from "@/components/HelpGuideButton";
import { NavLinks, type NavLink } from "./NavLinks";
import { ChurchSwitcher } from "./ChurchSwitcher";
import { MobileMenu } from "./MobileMenu";

function navLinksForRole(role: Role, unseenEvents: boolean, churchId: string): NavLink[] {
  const events: NavLink = { href: "/events", label: "Events", iconKey: "events", hasBadge: unseenEvents };
  const discover: NavLink = { href: "/discover", label: "Discover", iconKey: "discover" };
  if (role === ROLES.CHURCH_ADMIN) {
    return [
      { href: "/admin/dashboard", label: "Dashboard", iconKey: "dashboard" },
      events,
      discover,
      { href: "/admin/rides", label: "Rides", iconKey: "rides" },
      { href: `/churches/${churchId}/settings`, label: "Church settings", iconKey: "settings" },
    ];
  }
  if (role === ROLES.VOLUNTEER) {
    return [
      { href: "/volunteer/dashboard", label: "Dashboard", iconKey: "dashboard" },
      events,
      discover,
      { href: "/volunteer/rides", label: "Rides", iconKey: "rides" },
    ];
  }
  return [
    { href: "/student/dashboard", label: "Dashboard", iconKey: "dashboard" },
    events,
    discover,
    { href: "/student/mentors", label: "Friends", iconKey: "mentors" },
    { href: "/student/rides", label: "Rides", iconKey: "rides" },
  ];
}

export async function AuthShell({
  user,
  children,
  fullBleed = false,
}: {
  user: CurrentUser;
  children: React.ReactNode;
  /** Skips the usual centered max-w-6xl/padding wrapper so content can fill
   * the full viewport edge-to-edge below the header — for the event map,
   * which needs to feel like its own full-screen surface, not a section
   * inside the normal page shell. */
  fullBleed?: boolean;
}) {
  const role = (user.activeMembership?.role ?? ROLES.STUDENT) as Role;
  const unseenEvents = user.activeMembership
    ? await hasUnseenEvents(user.activeMembership.churchId, user.activeMembership.lastSeenEventsAt)
    : false;
  const links = navLinksForRole(role, unseenEvents, user.activeMembership?.churchId ?? "");

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/home" className="flex items-center gap-2 text-base font-bold text-brand-700">
              <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-white">
                <UsersThree weight="fill" className="size-4.5" />
              </span>
              <span className="hidden lg:inline">ChurchedIn</span>
            </Link>
            <div className="hidden lg:block">
              <NavLinks links={links} />
            </div>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            {user.activeMembership && (
              <ChurchSwitcher
                memberships={user.memberships}
                activeChurchId={user.activeMembership.churchId}
              />
            )}
            <Link
              href={profilePathForRole(role)}
              className="flex items-center gap-2 rounded-lg transition-brand hover:text-brand-600"
            >
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-sm font-medium text-ink-soft transition-brand hover:text-brand-600 lg:inline">
                {user.name}
              </span>
            </Link>
            <HelpGuideButton role={role} churchId={user.activeMembership?.churchId ?? ""} />
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
          <MobileMenu
            links={links}
            userName={user.name}
            churchName={user.activeMembership?.church.name}
            memberships={user.memberships}
            activeChurchId={user.activeMembership?.churchId}
            profilePath={profilePathForRole(role)}
            role={role}
          />
        </div>
      </header>
      {fullBleed ? (
        <main className="h-[calc(100dvh-65px)] animate-fade-in overflow-hidden">{children}</main>
      ) : (
        <main className="mx-auto max-w-6xl animate-fade-in px-6 py-8">{children}</main>
      )}
    </div>
  );
}
