import Link from "next/link";
import Image from "next/image";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import type { CurrentUser } from "@/lib/auth";
import { ROLES, profilePathForRole, type Role } from "@/lib/constants";
import { logoutAction } from "@/lib/actions/auth";
import { hasUnseenEvents, countUnreadMessagesForUser } from "@/lib/queries";
import { Avatar } from "@/components/ui/Avatar";
import { HelpGuideButton } from "@/components/HelpGuideButton";
import { NavLinks, type NavLink } from "./NavLinks";
import { ChurchSwitcher } from "./ChurchSwitcher";
import { MobileMenu } from "./MobileMenu";
import { PageTransition } from "./PageTransition";
import { OnboardingAutoTrigger } from "./OnboardingAutoTrigger";

/** For a logged-in user with no church yet (see createBrowsingAccountAction)
 * — every other nav destination requires a membership and would just
 * bounce them to /join, so show only what actually works. */
const BROWSING_LINKS: NavLink[] = [
  { href: "/discover", label: "Discover", iconKey: "discover" },
  { href: "/join", label: "Join Church with Code", iconKey: "church" }
];

function navLinksForRole(role: Role, unseenEvents: boolean, churchId: string, unreadMessages: number): NavLink[] {
  const events: NavLink = { href: "/events", label: "Events", iconKey: "events", hasBadge: unseenEvents };
  const discover: NavLink = { href: "/discover", label: "Discover", iconKey: "discover" };
  const messages: NavLink = { href: "/messages", label: "Messages", iconKey: "messages", badgeCount: unreadMessages };
  if (role === ROLES.CHURCH_ADMIN) {
    return [
      { href: "/admin/dashboard", label: "Dashboard", iconKey: "dashboard" },
      { href: "/admin/rides", label: "Rides", iconKey: "rides" },
      messages,
      { href: "/admin/reports", label: "Reports", iconKey: "reports" },
      { href: `/churches/${churchId}/settings`, label: "Church settings", iconKey: "settings" },
      events,
      discover,
    ];
  }
  if (role === ROLES.VOLUNTEER) {
    return [
      { href: "/volunteer/dashboard", label: "Dashboard", iconKey: "dashboard" },
      { href: "/volunteer/rides", label: "Rides", iconKey: "rides" },
      messages,
      events,
      discover,
    ];
  }
  return [
    { href: "/student/dashboard", label: "Dashboard", iconKey: "dashboard" },
    { href: "/student/requests", label: "Requests", iconKey: "mentors" },
    { href: "/student/rides", label: "Rides", iconKey: "rides" },
    messages,
    events,
    discover,
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
  // Any role can now be a HelpRequest requester or claimer, so the only
  // real skip condition is having no church at all.
  const unreadMessages = user.activeMembership ? await countUnreadMessagesForUser(user.id) : 0;
  const links = user.activeMembership
    ? navLinksForRole(role, unseenEvents, user.activeMembership.churchId, unreadMessages)
    : BROWSING_LINKS;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <Link
              href={user.activeMembership ? (role === ROLES.CHURCH_ADMIN ? "/admin/dashboard" : `/${role.toLowerCase()}/dashboard`) : "/discover"}
              // The 32px icon alone falls short of the ~44x44 CSS-pixel
              // Apple HIG minimum touch target on mobile (where it's the
              // only logo shown). Padding expands the tappable box; the
              // matching negative margin keeps the icon's visual position
              // unchanged, so nothing else in the header shifts. Reset to
              // nothing at lg, where the wider full-logo image (not this
              // small square icon) is what's shown and clicked instead.
              className="-m-1.5 flex items-center p-1.5 text-base font-bold text-brand-700 lg:m-0 lg:p-0"
            >
              <Image src="/icon-192.png" alt="ChurchedIn" width={32} height={32} priority className="size-8 rounded-full lg:hidden" />
              <Image src="/logo-full.svg" alt="ChurchedIn" width={161} height={43} priority className="hidden h-8 w-auto lg:block" />
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
              <Avatar name={user.name} src={user.photoUrl} size="sm" />
              <span className="hidden text-sm font-medium text-ink-soft transition-brand hover:text-brand-600 lg:inline">
                {user.name}
              </span>
            </Link>
            <HelpGuideButton role={role} churchId={user.activeMembership?.churchId ?? ""} />
            <form action={logoutAction}>
              <button
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-faint transition-brand hover:bg-danger-soft hover:text-danger"
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
            userPhotoUrl={user.photoUrl}
            churchName={user.activeMembership?.church.name}
            memberships={user.memberships}
            activeChurchId={user.activeMembership?.churchId}
            profilePath={profilePathForRole(role)}
            role={role}
          />
        </div>
      </header>
      {/* Gated on activeMembership: the walkthrough's content is role- and
          church-specific, so there's nothing coherent to show a church-less
          "just browsing" account yet — better to wait until they actually
          join one than mark this seen against content they can't use. */}
      {user.activeMembership && (
        <OnboardingAutoTrigger
          role={role}
          churchId={user.activeMembership.churchId}
          hasSeenOnboarding={user.hasSeenOnboarding}
        />
      )}
      {fullBleed ? (
        <main className="h-[calc(100dvh-65px)] overflow-hidden">
          <PageTransition className="h-full">{children}</PageTransition>
        </main>
      ) : (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <PageTransition>{children}</PageTransition>
        </main>
      )}
    </div>
  );
}
