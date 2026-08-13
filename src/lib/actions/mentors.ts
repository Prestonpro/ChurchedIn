"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import {
  volunteerProfileSchema,
  studentProfileSchema,
  firstIssueMessage,
} from "@/lib/validation";

export type ActionResult = { error: string } | { ok: true } | void;

/** Replaces updateMentorProfileAction — these fields now live directly on
 * User (carried forward from the deleted MentorProfile), so this is a
 * single update instead of a User write plus a separate profile upsert. */
export async function updateVolunteerProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (
    user.activeMembership?.role !== ROLES.VOLUNTEER &&
    user.activeMembership?.role !== ROLES.CHURCH_ADMIN
  ) {
    return { error: "Only volunteers can set up a profile." };
  }

  const parsed = volunteerProfileSchema.safeParse({
    bio: formData.get("bio"),
    photoUrl: formData.get("photoUrl"),
    jobTitle: formData.get("jobTitle"),
    company: formData.get("company"),
    industry: formData.get("industry"),
    languages: formData.get("languages"),
    hobbies: formData.get("hobbies"),
    interests: formData.get("interests"),
    linkedinUrl: formData.get("linkedinUrl"),
    facebookUrl: formData.get("facebookUrl"),
    instagramUrl: formData.get("instagramUrl"),
    openToMentorship: formData.get("openToMentorship") === "on",
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      bio: data.bio || null,
      photoUrl: data.photoUrl || null,
      jobTitle: data.jobTitle || null,
      company: data.company || null,
      industry: data.industry || null,
      languages: data.languages || null,
      hobbies: data.hobbies || null,
      interests: data.interests || null,
      linkedinUrl: data.linkedinUrl || null,
      facebookUrl: data.facebookUrl || null,
      instagramUrl: data.instagramUrl || null,
      openToMentorship: data.openToMentorship,
    },
  });

  revalidatePath("/volunteer/profile");
  revalidatePath("/student/requests");
  return { ok: true };
}

export async function updateStudentProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (user.activeMembership && user.activeMembership.role !== ROLES.STUDENT) {
    return { error: "Only students have this profile type." };
  }

  const parsed = studentProfileSchema.safeParse({
    bio: formData.get("bio"),
    photoUrl: formData.get("photoUrl"),
    countryOfOrigin: formData.get("countryOfOrigin"),
    school: formData.get("school"),
    major: formData.get("major"),
    graduationYear: formData.get("graduationYear"),
    languages: formData.get("languages"),
    hobbies: formData.get("hobbies"),
    interests: formData.get("interests"),
    careerGoals: formData.get("careerGoals"),
    linkedinUrl: formData.get("linkedinUrl"),
    facebookUrl: formData.get("facebookUrl"),
    instagramUrl: formData.get("instagramUrl"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { bio: data.bio || null, photoUrl: data.photoUrl || null } }),
    prisma.studentProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        countryOfOrigin: data.countryOfOrigin || null,
        school: data.school || null,
        major: data.major || null,
        graduationYear: data.graduationYear || null,
        languages: data.languages || null,
        hobbies: data.hobbies || null,
        interests: data.interests || null,
        careerGoals: data.careerGoals || null,
        linkedinUrl: data.linkedinUrl || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
      },
      update: {
        countryOfOrigin: data.countryOfOrigin || null,
        school: data.school || null,
        major: data.major || null,
        graduationYear: data.graduationYear || null,
        languages: data.languages || null,
        hobbies: data.hobbies || null,
        interests: data.interests || null,
        careerGoals: data.careerGoals || null,
        linkedinUrl: data.linkedinUrl || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
      },
    }),
  ]);

  revalidatePath("/student/profile");
  return { ok: true };
}
