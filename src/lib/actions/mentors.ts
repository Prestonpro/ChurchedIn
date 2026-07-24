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
    languages: formData.get("languages"),
    interests: formData.get("interests"),
    openToMentor: formData.get("openToMentor") === "on",
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const { languages, interests, openToMentor } = parsed.data;

  await prisma.mentorProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, languages: languages || null, interests: interests || null, openToMentor },
    update: { languages: languages || null, interests: interests || null, openToMentor },
  });

  revalidatePath("/volunteer/profile");
  revalidatePath("/student/mentors");
}

export async function updateStudentProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (user.activeMembership?.role !== ROLES.STUDENT) {
    return { error: "Only students have this profile type." };
  }

  const parsed = studentProfileSchema.safeParse({
    countryOfOrigin: formData.get("countryOfOrigin"),
    school: formData.get("school"),
    languages: formData.get("languages"),
    interests: formData.get("interests"),
  });
  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }
  const data = parsed.data;

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      countryOfOrigin: data.countryOfOrigin || null,
      school: data.school || null,
      languages: data.languages || null,
      interests: data.interests || null,
    },
    update: {
      countryOfOrigin: data.countryOfOrigin || null,
      school: data.school || null,
      languages: data.languages || null,
      interests: data.interests || null,
    },
  });

  revalidatePath("/student/profile");
}
