// The generated Prisma client (sqlite + the new `prisma-client` generator)
// does not emit TS enum types for schema enums, so these are hand-defined
// and used as plain strings against the underlying TEXT columns.

export const ROLES = {
  CHURCH_ADMIN: "CHURCH_ADMIN",
  VOLUNTEER: "VOLUNTEER",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const EVENT_CATEGORIES = {
  DINNER: "DINNER",
  MENTORSHIP: "MENTORSHIP",
  COFFEE_CHAT: "COFFEE_CHAT",
  STUDY_GROUP: "STUDY_GROUP",
  CULTURAL_OUTING: "CULTURAL_OUTING",
  AIRPORT_PICKUP: "AIRPORT_PICKUP",
  HOLIDAY_CELEBRATION: "HOLIDAY_CELEBRATION",
  OTHER: "OTHER",
} as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  DINNER: "Dinner",
  MENTORSHIP: "Friend chat",
  COFFEE_CHAT: "Coffee chat",
  STUDY_GROUP: "Study group",
  CULTURAL_OUTING: "Cultural outing",
  AIRPORT_PICKUP: "Airport pickup",
  HOLIDAY_CELEBRATION: "Holiday celebration",
  OTHER: "Other",
};

export const EVENT_STATUS = {
  PUBLISHED: "PUBLISHED",
  CANCELLED: "CANCELLED",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const RSVP_ROLE = {
  HELPER: "HELPER",
  ATTENDEE: "ATTENDEE",
} as const;

export type RsvpRole = (typeof RSVP_ROLE)[keyof typeof RSVP_ROLE];

export const RSVP_STATUS = {
  CONFIRMED: "CONFIRMED",
  WAITLISTED: "WAITLISTED",
  CANCELLED: "CANCELLED",
} as const;

export type RsvpStatus = (typeof RSVP_STATUS)[keyof typeof RSVP_STATUS];

export const CONNECTION_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  ENDED: "ENDED",
} as const;

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

export const REPORT_STATUS = {
  OPEN: "OPEN",
  REVIEWED: "REVIEWED",
  DISMISSED: "DISMISSED",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case ROLES.CHURCH_ADMIN:
      return "/admin/dashboard";
    case ROLES.VOLUNTEER:
      return "/volunteer/dashboard";
    case ROLES.STUDENT:
      return "/student/dashboard";
  }
}

// A student can send at most this many mentor connection requests (new
// requests or re-requests after a decline) in a rolling 24h window. This is
// the actual anti-harassment control referenced in the safety rule — it is
// enforced in src/lib/actions/connections.ts by counting recent
// MentorConnection.lastRequestedAt values, not by an external rate limiter.
export const MAX_CONNECTION_REQUESTS_PER_DAY = 5;

// Caps "new event" notification emails per church per rolling 24h window,
// so one eager volunteer creating a string of events doesn't spam every
// member's inbox. Enforced in src/lib/actions/events.ts by counting recent
// Event.createdAt values for the church, not an external rate limiter.
export const MAX_EVENT_NOTIFICATIONS_PER_DAY = 3;
