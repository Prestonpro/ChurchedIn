import { test, expect } from "@playwright/test";
import { signupChurch, joinChurch, getJoinCode, uniqueEmail, dismissOnboardingIfPresent } from "./helpers";

test("student can request a mentor; contact info is revealed only after the mentor accepts", async ({
  browser,
}) => {
  const adminEmail = uniqueEmail("admin-mentor");
  const churchName = `Mentor Test Church ${Date.now()}`;

  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "Admin",
    email: adminEmail,
    password: "password123",
    churchName,
  });
  const joinCode = await getJoinCode(adminPage);

  const mentorEmail = uniqueEmail("mentor");
  const mentorPage = await (await browser.newContext()).newPage();
  await joinChurch(mentorPage, {
    joinCode,
    role: "VOLUNTEER",
    name: "Mentor Person",
    email: mentorEmail,
    password: "password123",
  });
  await mentorPage.goto("/volunteer/profile");
  await dismissOnboardingIfPresent(mentorPage);
  await mentorPage.getByLabel("I'm open to mentoring a student").check();
  await mentorPage.getByRole("button", { name: "Save my profile" }).click();
  await mentorPage.reload();
  await expect(mentorPage.getByLabel("I'm open to mentoring a student")).toBeChecked();

  const studentEmail = uniqueEmail("student");
  const studentPage = await (await browser.newContext()).newPage();
  await joinChurch(studentPage, {
    joinCode,
    role: "STUDENT",
    name: "Student Person",
    email: studentEmail,
    password: "password123",
  });
  await studentPage.goto("/student/requests");
  // Scoped to this specific person's card, not a page-wide getByLabel —
  // the church admin who created the church is also open to mentoring by
  // default, so more than one directory card (each with its own identical
  // "Message (optional)" form) can legitimately be on the page at once.
  const mentorCard = studentPage.getByTestId("mentor-card").filter({ hasText: "Mentor Person" });
  await expect(mentorCard).toBeVisible();

  await mentorCard.getByLabel("Message (optional)").fill("Would love to connect!");
  await mentorCard.getByRole("button", { name: "Send request" }).click();
  await expect(mentorCard.getByText("Request pending")).toBeVisible();

  // The core safety rule: no contact info before acceptance.
  await expect(studentPage.getByText(mentorEmail)).not.toBeVisible();

  await mentorPage.goto("/volunteer/dashboard");
  await expect(mentorPage.getByText("Student Person")).toBeVisible();
  await mentorPage.getByRole("button", { name: "Accept" }).click();
  // Wait for the mentor's own page to reflect the acceptance (the request
  // moves from "requests waiting on you" into "your requests", which only
  // renders once the server action's revalidated data confirms CLAIMED)
  // before touching the student's page — mirrors the same synchronization
  // pattern rsvp-waitlist.spec.ts uses.
  await expect(mentorPage.getByText(studentEmail)).toBeVisible();

  await studentPage.goto("/student/requests");
  await expect(studentPage.getByText("Connected")).toBeVisible();
  await expect(studentPage.getByText(mentorEmail)).toBeVisible();
});

/**
 * The blind-claim flow (Furniture/Food/Housing/Other, and untargeted
 * Mentorship) — distinct from the targeted directory pick above. Same
 * non-negotiable safety rule applies: no contact info before a claim.
 */
test("a blind request can be claimed by any eligible church member; contact info is revealed only after claim", async ({
  browser,
}) => {
  const churchName = `Help Request Test Church ${Date.now()}`;
  const password = "password123";

  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "Admin",
    email: uniqueEmail("admin-helprequest"),
    password,
    churchName,
  });
  const joinCode = await getJoinCode(adminPage);

  const studentEmail = uniqueEmail("student-helprequest");
  const studentPage = await (await browser.newContext()).newPage();
  await joinChurch(studentPage, {
    joinCode,
    role: "STUDENT",
    name: "Requesting Student",
    email: studentEmail,
    password,
  });

  await studentPage.goto("/student/requests?tab=mine");
  await studentPage.getByRole("button", { name: "New request" }).click();
  await studentPage.getByLabel("Category").selectOption("FURNITURE");
  await studentPage.getByLabel("Title").fill("Need a desk chair");
  await studentPage.getByLabel("Details (optional)").fill("Anything sturdy works!");
  await studentPage.getByRole("button", { name: "Post request" }).click();
  await expect(studentPage.getByText("Need a desk chair")).toBeVisible();

  const volunteerEmail = uniqueEmail("vol-helprequest");
  const volunteerPage = await (await browser.newContext()).newPage();
  await joinChurch(volunteerPage, {
    joinCode,
    role: "VOLUNTEER",
    name: "Claiming Volunteer",
    email: volunteerEmail,
    password,
  });

  await volunteerPage.goto("/volunteer/dashboard");
  await expect(volunteerPage.getByText("Need a desk chair")).toBeVisible();
  // The core safety rule: no contact info before a claim.
  await expect(volunteerPage.getByText(studentEmail)).not.toBeVisible();

  await volunteerPage.getByRole("button", { name: "Claim" }).click();
  await expect(volunteerPage.getByText(studentEmail)).toBeVisible();

  await studentPage.goto("/student/requests?tab=mine");
  await expect(studentPage.getByText("Claiming Volunteer")).toBeVisible();
  await expect(studentPage.getByText(volunteerEmail)).toBeVisible();
});
