"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import {
  mentorProfileSchema,
  studentProfileSchema,
  firstIssueMessage,
} from "@/lib/validation";

export type ActionResult = { error: string } | void;

export async function updateMentorProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (
    user.activeMembership?.role !== ROLES.VOLUNTEER &&
    user.activeMembership?.role !== ROLES.CHURCH_ADMIN
  ) {
    return { error: "Only volunteers can set up a friend profile." };
  }

  const parsed = mentorProfileSchema.safeParse({
    bio: formData.get("bio"),
    jobTitle: formData.get("jobTitle"),
    company: formData.get("company"),
    industry: formData.get("industry"),
    languages: formData.get("languages"),
    hobbies: formData.get("hobbies"),
    interests: formData.get("interests"),
    linkedinUrl: formData.get("linkedinUrl"),
    facebookUrl: formData.get("facebookUrl"),
    instagramUrl: formData.get("instagramUrl"),
    openToMentor: formData.get("openToMentor") === "on",
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  // bio lives on User (shown identically on the Friends card and the public
  // profile page), not on MentorProfile — two separate writes, same request.
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { bio: data.bio || null } }),
    prisma.mentorProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        jobTitle: data.jobTitle || null,
        company: data.company || null,
        industry: data.industry || null,
        languages: data.languages || null,
        hobbies: data.hobbies || null,
        interests: data.interests || null,
        linkedinUrl: data.linkedinUrl || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
        openToMentor: data.openToMentor,
      },
      update: {
        jobTitle: data.jobTitle || null,
        company: data.company || null,
        industry: data.industry || null,
        languages: data.languages || null,
        hobbies: data.hobbies || null,
        interests: data.interests || null,
        linkedinUrl: data.linkedinUrl || null,
        facebookUrl: data.facebookUrl || null,
        instagramUrl: data.instagramUrl || null,
        openToMentor: data.openToMentor,
      },
    }),
  ]);

  revalidatePath("/volunteer/profile");
  revalidatePath("/student/mentors");
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
    prisma.user.update({ where: { id: user.id }, data: { bio: data.bio || null } }),
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
}
