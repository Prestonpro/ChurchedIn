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

export const MEETING_FREQUENCY = {
  WEEKLY: "WEEKLY",
  BIWEEKLY: "BIWEEKLY",
  MONTHLY: "MONTHLY",
} as const;

export type MeetingFrequency = (typeof MEETING_FREQUENCY)[keyof typeof MEETING_FREQUENCY];

export const MEETING_FREQUENCY_LABELS: Record<MeetingFrequency, string> = {
  WEEKLY: "Every week",
  BIWEEKLY: "Every other week",
  MONTHLY: "Every month",
};

export const DAY_OF_WEEK_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const REPORT_STATUS = {
  OPEN: "OPEN",
  REVIEWED: "REVIEWED",
  DISMISSED: "DISMISSED",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const PARTNERSHIP_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
} as const;

export type PartnershipStatus = (typeof PARTNERSHIP_STATUS)[keyof typeof PARTNERSHIP_STATUS];

export const RIDE_STATUS = {
  OPEN: "OPEN",
  CLAIMED: "CLAIMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type RideStatus = (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS];

export const RIDE_REQUEST_TYPE = {
  GENERAL: "GENERAL",
  FIRST_VISIT: "FIRST_VISIT",
} as const;

export type RideRequestType = (typeof RIDE_REQUEST_TYPE)[keyof typeof RIDE_REQUEST_TYPE];

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

export function profilePathForRole(role: Role): string {
  switch (role) {
    case ROLES.CHURCH_ADMIN:
      return "/admin/profile";
    case ROLES.VOLUNTEER:
      return "/volunteer/profile";
    case ROLES.STUDENT:
      return "/student/profile";
  }
}

export function roleLabel(role: Role): string {
  switch (role) {
    case ROLES.CHURCH_ADMIN:
      return "Church leader";
    case ROLES.VOLUNTEER:
      return "Volunteer";
    case ROLES.STUDENT:
      return "International student";
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

export const COUNTRIES = [
  "United States", "China", "India", "Brazil", "Mexico",
  "Canada", "United Kingdom", "Germany", "France", "Japan",
  "South Korea", "Taiwan", "Vietnam", "Philippines", "Nigeria",
  "Australia", "Spain", "Italy", "Colombia", "Argentina",
  "Russia", "South Africa", "Indonesia", "Malaysia", "Thailand",
].sort();

export const LANGUAGES = [
  "English", "Mandarin", "Spanish", "Hindi", "Arabic",
  "Portuguese", "Bengali", "Russian", "Japanese", "Punjabi",
  "German", "Javanese", "Wu", "Malay", "Telugu",
  "Vietnamese", "Korean", "French", "Marathi", "Tamil",
  "Urdu", "Turkish", "Italian", "Yue (Cantonese)", "Thai",
  "Gujarati", "Jin", "Southern Min", "Persian", "Polish",
].sort();

export const SCHOOLS = [
  "University of Texas at Austin",
  "Texas A&M University",
  "University of Houston",
  "Texas Tech University",
  "University of North Texas",
  "University of Texas at Dallas",
  "University of Texas at Arlington",
  "Baylor University",
  "Rice University",
  "Southern Methodist University",
  "Texas Christian University",
  "University of Texas at San Antonio",
  "Texas State University",
  "Stanford University",
  "Massachusetts Institute of Technology (MIT)",
  "Harvard University",
  "University of California, Berkeley",
  "University of California, Los Angeles",
  "University of Southern California",
  "New York University",
  "Columbia University",
  "University of Michigan",
  "University of Pennsylvania",
  "Cornell University",
  "University of Washington",
].sort();

