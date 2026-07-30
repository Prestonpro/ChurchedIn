import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .email("Enter a valid email address");

export const passwordSchema = z.string().min(8, "Use at least 8 characters");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter your name")
  .max(100, "That name is too long");

export const createChurchSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  churchName: z.string().trim().min(1, "Enter your church's name").max(150),
  churchCity: z.string().trim().max(150).optional().or(z.literal("")),
});

/** For /churches/new — an already-logged-in user adding a new church
 * profile, distinct from createChurchSchema (which also creates the
 * account itself, at signup). */
export const churchProfileSchema = z.object({
  name: z.string().trim().min(1, "Enter the church's name").max(150),
  denomination: z.string().trim().max(150).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  serviceTimes: z.string().trim().max(300).optional().or(z.literal("")),
  languages: z.string().trim().max(300).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  locationLat: z.number().min(-90).max(90).optional().nullable(),
  locationLng: z.number().min(-180).max(180).optional().nullable(),
});

export const joinChurchSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["VOLUNTEER", "STUDENT"]),
});

/** For /browse — an account with no church yet, so someone can look around
 * /discover before committing to one. Just the account fields, no role or
 * church — those come later, at joinDiscoveredChurchAction time. */
export const browseSignupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const eventSchema = z.object({
  title: z.string().trim().min(1, "Enter a title").max(150),
  description: z.string().trim().min(1, "Enter a description").max(2000),
  category: z.enum([
    "DINNER",
    "MENTORSHIP",
    "COFFEE_CHAT",
    "STUDY_GROUP",
    "CULTURAL_OUTING",
    "AIRPORT_PICKUP",
    "HOLIDAY_CELEBRATION",
    "OTHER",
  ]),
  startsAt: z.string().min(1, "Choose a start time"),
  endsAt: z.string().min(1, "Choose an end time"),
  location: z.string().trim().min(1, "Enter a location").max(300),
  isVirtual: z.boolean().default(false),
  atChurch: z.boolean().default(false),
  // 0 is valid — "this event needs no helpers/attendees of this kind" —
  // distinct from leaving it blank, which means uncapped.
  volunteerCap: z.number().int().nonnegative().optional().nullable(),
  studentCap: z.number().int().nonnegative().optional().nullable(),
  // Optional map pin — distinct from the required `location` text above.
  // All three come from the LocationPicker together (or not at all).
  address: z.string().trim().max(300).optional().or(z.literal("")),
  locationLat: z.number().min(-90).max(90).optional().nullable(),
  locationLng: z.number().min(-180).max(180).optional().nullable(),
});

export const mentorProfileSchema = z.object({
  jobTitle: z.string().trim().max(100).optional().or(z.literal("")),
  company: z.string().trim().max(100).optional().or(z.literal("")),
  industry: z.string().trim().max(100).optional().or(z.literal("")),
  languages: z.string().trim().max(300).optional().or(z.literal("")),
  hobbies: z.string().trim().max(300).optional().or(z.literal("")),
  interests: z.string().trim().max(500).optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  openToMentor: z.boolean().default(true),
});

export const studentProfileSchema = z.object({
  countryOfOrigin: z.string().trim().max(100).optional().or(z.literal("")),
  school: z.string().trim().max(150).optional().or(z.literal("")),
  major: z.string().trim().max(100).optional().or(z.literal("")),
  graduationYear: z.string().trim().max(4).optional().or(z.literal("")),
  languages: z.string().trim().max(300).optional().or(z.literal("")),
  hobbies: z.string().trim().max(300).optional().or(z.literal("")),
  interests: z.string().trim().max(500).optional().or(z.literal("")),
  careerGoals: z.string().trim().max(500).optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
});

export const connectionRequestSchema = z.object({
  mentorId: z.string().min(1),
  message: z.string().trim().max(500).optional().or(z.literal("")),
});

export const meetingPlanSchema = z.object({
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
  // Free-text here on purpose — parsed to a 0-6 day index (or left unset)
  // in the action, since a bare number field would coerce an empty
  // "no preference" selection to 0 (Sunday) instead of null.
  dayOfWeek: z.string().trim().max(2).optional().or(z.literal("")),
  time: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const rideRequestSchema = z.object({
  destination: z.string().trim().min(1, "Enter where you need to go").max(300),
  date: z.string().min(1, "Choose a date"),
  time: z.string().trim().min(1, "Enter a time").max(100),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

/** Formats the first Zod issue as a single plain-language string for form errors. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}
