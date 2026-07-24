import { test, expect } from "@playwright/test";
import { signupChurch, joinChurch, getJoinCode, uniqueEmail } from "./helpers";

test("student can request a mentor connection; contact info is revealed only after the mentor accepts", async ({
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
  await mentorPage.getByLabel("I'm open to being a friend to a student").check();
  await mentorPage.getByRole("button", { name: "Save my profile" }).click();
  await mentorPage.reload();
  await expect(mentorPage.getByLabel("I'm open to being a friend to a student")).toBeChecked();

  const studentEmail = uniqueEmail("student");
  const studentPage = await (await browser.newContext()).newPage();
  await joinChurch(studentPage, {
    joinCode,
    role: "STUDENT",
    name: "Student Person",
    email: studentEmail,
    password: "password123",
  });
  await studentPage.goto("/student/mentors");
  await expect(studentPage.getByText("Mentor Person")).toBeVisible();

  await studentPage.getByLabel("Message (optional)").fill("Would love to connect!");
  await studentPage.getByRole("button", { name: "Say hi" }).click();
  await expect(studentPage.getByText("Request pending")).toBeVisible();

  // The core safety rule: no contact info before acceptance.
  await expect(studentPage.getByText(mentorEmail)).not.toBeVisible();

  await mentorPage.goto("/volunteer/dashboard");
  await expect(mentorPage.getByText("Student Person")).toBeVisible();
  await mentorPage.getByRole("button", { name: "Accept" }).click();
  // Wait for the mentor's own page to reflect the acceptance (the student
  // moves from "requests waiting on you" into "active connections", which
  // only renders once the server action's revalidated data confirms
  // ACCEPTED) before touching the student's page — mirrors the same
  // synchronization pattern rsvp-waitlist.spec.ts uses.
  await expect(mentorPage.getByText(studentEmail)).toBeVisible();

  await studentPage.goto("/student/mentors");
  await expect(studentPage.getByText("Connected")).toBeVisible();
  await expect(studentPage.getByText(mentorEmail)).toBeVisible();
});
