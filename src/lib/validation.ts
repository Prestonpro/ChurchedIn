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

export const joinChurchSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["VOLUNTEER", "STUDENT"]),
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
  languages: z.string().trim().max(300).optional().or(z.literal("")),
  interests: z.string().trim().max(500).optional().or(z.literal("")),
  openToMentor: z.boolean().default(true),
});

export const studentProfileSchema = z.object({
  countryOfOrigin: z.string().trim().max(100).optional().or(z.literal("")),
  school: z.string().trim().max(150).optional().or(z.literal("")),
  languages: z.string().trim().max(300).optional().or(z.literal("")),
  interests: z.string().trim().max(500).optional().or(z.literal("")),
});

export const connectionRequestSchema = z.object({
  mentorId: z.string().min(1),
  message: z.string().trim().max(500).optional().or(z.literal("")),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(1, "Enter a reason").max(200),
  details: z.string().trim().max(1000).optional().or(z.literal("")),
  reportedUserId: z.string().optional(),
  eventId: z.string().optional(),
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
