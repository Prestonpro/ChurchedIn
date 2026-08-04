import type { Icon } from "@phosphor-icons/react";
import {
  SquaresFour,
  Buildings,
  UsersFour,
  UsersThree,
  CalendarBlank,
  HandsClapping,
  Car,
  UserCircle,
  HandHeart,
  CalendarCheck,
  Compass,
  MapTrifold,
  Crown,
} from "@phosphor-icons/react/dist/ssr";
import { ROLES, type Role } from "@/lib/constants";

export type HelpStep = {
  icon: Icon;
  title: string;
  body: string;
  linkHref?: string;
  linkLabel?: string;
};

export const HELP_GUIDE_TITLE: Record<Role, string> = {
  CHURCH_ADMIN: "What you can do as a church leader",
  VOLUNTEER: "What you can do as a volunteer",
  STUDENT: "What you can do as a student",
};

export function getHelpSteps(role: Role, churchId: string): HelpStep[] {
  if (role === ROLES.CHURCH_ADMIN) {
    return [
      {
        icon: SquaresFour,
        title: "Your dashboard",
        body: "See your member count, upcoming gatherings, and quick links to everything else, all in one place.",
        linkHref: "/admin/dashboard",
        linkLabel: "Go to dashboard",
      },
      {
        icon: Crown,
        title: "If your church is already listed",
        body: "Some churches (like the ones from our initial Bryan/College Station map listings) already show up on the discover map before anyone from them has an account here. If that's yours, join it like normal from its church page, then look for a “Claim as church leader” button. The first member to claim an unclaimed listing becomes its leader. If your church isn't listed at all yet, just create it during sign-up and you're automatically its leader, no claiming needed.",
        linkHref: "/discover",
        linkLabel: "Find your church",
      },
      {
        icon: UsersFour,
        title: "Invite people in",
        body: "Share your church's join code so volunteers and students can join on their own. You can regenerate it anytime if it ever gets shared somewhere it shouldn't.",
        linkHref: `/churches/${churchId}/settings`,
        linkLabel: "Go to church settings",
      },
      {
        icon: Buildings,
        title: "Keep your church profile current",
        body: "Add service times, denomination, a short bio, and your location so your church shows up well to students browsing the discover map.",
        linkHref: `/churches/${churchId}/settings`,
        linkLabel: "Edit church profile",
      },
      {
        icon: UsersThree,
        title: "Manage your team",
        body: "Promote a trusted member to co-admin, or step someone back down, right from the member list in church settings.",
        linkHref: `/churches/${churchId}/settings`,
        linkLabel: "Manage members",
      },
      {
        icon: CalendarBlank,
        title: "Host gatherings",
        body: "Plan dinners, coffee chats, study groups, and more. Invite other volunteers as co-hosts so it doesn't all fall on you.",
        linkHref: "/events",
        linkLabel: "See gatherings",
      },
      {
        icon: MapTrifold,
        title: "See gatherings your way",
        body: "Switch between a map view (see where everything is happening) and a calendar view (see what's coming up week by week) from the top of the events page.",
        linkHref: "/events/map",
        linkLabel: "Open map view",
      },
      {
        icon: HandsClapping,
        title: "Partner with other churches",
        body: "Send a partnership request to another church, right from your dashboard, so members on both sides can see each other's public events alongside their own.",
        linkHref: "/admin/dashboard",
        linkLabel: "Go to dashboard",
      },
      {
        icon: Car,
        title: "Keep an eye on rides",
        body: "See every ride request at your church: open, claimed, or completed. Volunteers do the actual claiming from their own rides board.",
        linkHref: "/admin/rides",
        linkLabel: "See rides",
      },
      {
        icon: Compass,
        title: "Browse the discover map",
        body: "See every church on the platform on a map, filterable by denomination, size, and language spoken, which is useful for finding partner churches or just seeing who else is out there.",
        linkHref: "/discover",
        linkLabel: "Open discover",
      },
    ];
  }

  if (role === ROLES.VOLUNTEER) {
    return [
      {
        icon: SquaresFour,
        title: "Your dashboard",
        body: "See friend requests waiting on you, your active friends, and any gatherings you're hosting or helping with.",
        linkHref: "/volunteer/dashboard",
        linkLabel: "Go to dashboard",
      },
      {
        icon: UserCircle,
        title: "Set up your friend profile",
        body: "Add the languages you speak, your interests, and a short bio so students know what you're about. Toggle “open to being a friend” whenever you have room for someone new.",
        linkHref: "/volunteer/profile",
        linkLabel: "Edit your profile",
      },
      {
        icon: HandHeart,
        title: "Respond to requests",
        body: "When a student reaches out, accept or decline the request right from your dashboard. Their contact info only shows up once you accept.",
        linkHref: "/volunteer/dashboard",
      },
      {
        icon: CalendarCheck,
        title: "Set up a recurring meeting",
        body: "Once you're connected with a student, set a standing cadence (weekly, every other week, or monthly) right on the connection card.",
        linkHref: "/volunteer/dashboard",
      },
      {
        icon: CalendarBlank,
        title: "Host a gathering",
        body: "Plan a dinner, coffee chat, or study group. For anything bigger, invite other volunteers as co-hosts.",
        linkHref: "/volunteer/events/new",
        linkLabel: "Plan a gathering",
      },
      {
        icon: MapTrifold,
        title: "See gatherings your way",
        body: "Switch between a map view and a calendar view from the top of the events page, including any events from partner churches your church has connected with.",
        linkHref: "/events/map",
        linkLabel: "Open map view",
      },
      {
        icon: Car,
        title: "Give someone a ride",
        body: "Claim an open ride request so a student never has to ask twice.",
        linkHref: "/volunteer/rides",
        linkLabel: "See ride requests",
      },
      {
        icon: Compass,
        title: "Explore other churches",
        body: "Browse the discover map to see other churches nearby, filterable by denomination, size, and language spoken.",
        linkHref: "/discover",
        linkLabel: "Open discover",
      },
    ];
  }

  return [
    {
      icon: SquaresFour,
      title: "Your dashboard",
      body: "See your upcoming events, your friend connections, and your ride requests at a glance.",
      linkHref: "/student/dashboard",
      linkLabel: "Go to dashboard",
    },
    {
      icon: UsersFour,
      title: "Find a friend",
      body: "Browse volunteers by the languages they speak and their interests, and send a request with a short note about yourself.",
      linkHref: "/student/mentors",
      linkLabel: "Browse friends",
    },
    {
      icon: HandHeart,
      title: "Once you're connected",
      body: "You'll be able to see their contact info, and either of you can set up a recurring meeting time: weekly, every other week, or monthly.",
      linkHref: "/student/mentors",
    },
    {
      icon: CalendarBlank,
      title: "Join gatherings",
      body: "RSVP to dinners, coffee chats, study groups, and more happening at your church, including anything from a partner church, if yours has connected with one.",
      linkHref: "/events",
      linkLabel: "See events",
    },
    {
      icon: MapTrifold,
      title: "See gatherings your way",
      body: "Switch between a map view (see where everything is) and a calendar view (see what's coming up) from the top of the events page.",
      linkHref: "/events/map",
      linkLabel: "Open map view",
    },
    {
      icon: Car,
      title: "Need a ride?",
      body: "Ask for a lift to something on the calendar, or for a first ride to visit a church you found on the map.",
      linkHref: "/student/rides",
      linkLabel: "Request a ride",
    },
    {
      icon: Compass,
      title: "Explore other churches",
      body: "Browse every church on the platform on a map, filterable by denomination, size, and language spoken. Hover a pin to preview a church, click for directions or to visit its page. If a church hasn't been claimed by a leader yet, you can claim it once you join.",
      linkHref: "/discover",
      linkLabel: "Open discover",
    },
  ];
}
