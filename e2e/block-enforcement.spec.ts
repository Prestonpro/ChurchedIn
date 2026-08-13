import { test, expect } from "@playwright/test";
import { signupChurch, joinChurch, getJoinCode, uniqueEmail, dismissOnboardingIfPresent } from "./helpers";

test("blocking a mentor removes them from the student's directory (and any future request path)", async ({
  browser,
}) => {
  const adminEmail = uniqueEmail("admin-block");
  const churchName = `Block Test Church ${Date.now()}`;

  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "Admin",
    email: adminEmail,
    password: "password123",
    churchName,
  });
  const joinCode = await getJoinCode(adminPage);

  const mentorEmail = uniqueEmail("mentor-block");
  const mentorPage = await (await browser.newContext()).newPage();
  await joinChurch(mentorPage, {
    joinCode,
    role: "VOLUNTEER",
    name: "Blockable Mentor",
    email: mentorEmail,
    password: "password123",
  });
  await mentorPage.goto("/volunteer/profile");
  await dismissOnboardingIfPresent(mentorPage);
  await mentorPage.getByLabel("I'm open to mentoring a student").check();
  await mentorPage.getByRole("button", { name: "Save my profile" }).click();

  const studentEmail = uniqueEmail("student-block");
  const studentPage = await (await browser.newContext()).newPage();
  await joinChurch(studentPage, {
    joinCode,
    role: "STUDENT",
    name: "Blocking Student",
    email: studentEmail,
    password: "password123",
  });

  await studentPage.goto("/student/requests");
  await expect(studentPage.getByText("Blockable Mentor")).toBeVisible();

  // Blocking now happens from the target's own profile page, not from a
  // control on the directory card itself — see BlockButton.tsx.
  await studentPage.getByRole("heading", { name: "Blockable Mentor" }).click();
  studentPage.once("dialog", (dialog) => dialog.accept());
  await studentPage.getByRole("button", { name: "Block Blockable" }).click();
  await expect(studentPage.getByText("You've blocked Blockable.")).toBeVisible();

  // Removed from the mentor directory itself (rendered as an h2 there) —
  // but it now legitimately reappears in the "Blocked" list at the bottom
  // of the page (a plain row, not an h2), since blocking got an undo.
  await studentPage.goto("/student/requests");
  await expect(studentPage.getByRole("heading", { name: "Blockable Mentor" })).not.toBeVisible();
  await expect(studentPage.getByText("Blockable Mentor")).toBeVisible();
  await expect(studentPage.getByRole("button", { name: "Unblock" })).toBeVisible();
});

/**
 * The rides board used to ignore blocks entirely, which mattered more here than
 * on the friend directory: claiming a ride emails the student and the volunteer
 * each other's real address, so a blocked pair could be put straight into
 * contact. That crossed both safety rule 1 (contact info) and rule 2 (blocks) in
 * one action, hence a dedicated regression test.
 */
test("a blocked volunteer never sees the blocking student's ride request", async ({ browser }) => {
  const churchName = `Ride Block Church ${Date.now()}`;
  const password = "password123";

  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "Admin",
    email: uniqueEmail("admin-rideblock"),
    password,
    churchName,
  });
  const joinCode = await getJoinCode(adminPage);

  // The volunteer has to be listable as a mentor for the student to reach
  // their profile page, where the block control lives — /student/requests'
  // directory tab is the only surface that links there.
  const volunteerPage = await (await browser.newContext()).newPage();
  await joinChurch(volunteerPage, {
    joinCode,
    role: "VOLUNTEER",
    name: "Blocked Driver",
    email: uniqueEmail("vol-rideblock"),
    password,
  });
  await volunteerPage.goto("/volunteer/profile");
  await dismissOnboardingIfPresent(volunteerPage);
  await volunteerPage.getByLabel("I'm open to mentoring a student").check();
  await volunteerPage.getByRole("button", { name: "Save my profile" }).click();

  const studentPage = await (await browser.newContext()).newPage();
  await joinChurch(studentPage, {
    joinCode,
    role: "STUDENT",
    name: "Blocking Rider",
    email: uniqueEmail("student-rideblock"),
    password,
  });

  await studentPage.goto("/student/requests");
  await studentPage.getByRole("heading", { name: "Blocked Driver" }).click();
  studentPage.once("dialog", (dialog) => dialog.accept());
  await studentPage.getByRole("button", { name: "Block Blocked" }).click();
  await expect(studentPage.getByText("You've blocked Blocked.")).toBeVisible();

  // Now the blocking student asks for a ride at the same church.
  await studentPage.goto("/student/rides");
  await studentPage.getByLabel("Where do you need to go?").fill("Airport terminal C");
  await studentPage.getByLabel("Date").fill("2027-03-14");
  await studentPage.getByLabel("Time").fill("9:00 AM");
  await studentPage.getByRole("button", { name: "Request a ride" }).click();
  await expect(studentPage.getByText("Airport terminal C")).toBeVisible();

  // The blocked volunteer must not be offered it, so there is no claim to make
  // and no contact exchange to trigger.
  await volunteerPage.goto("/volunteer/rides");
  await expect(volunteerPage.getByText("Airport terminal C")).not.toBeVisible();
  await expect(volunteerPage.getByText("Blocking Rider")).not.toBeVisible();

  // Control: an unrelated volunteer at the same church still sees it, so the
  // filter is scoped to the blocked pair rather than hiding the row outright.
  const otherVolunteerPage = await (await browser.newContext()).newPage();
  await joinChurch(otherVolunteerPage, {
    joinCode,
    role: "VOLUNTEER",
    name: "Unrelated Driver",
    email: uniqueEmail("vol2-rideblock"),
    password,
  });
  await otherVolunteerPage.goto("/volunteer/rides");
  await expect(otherVolunteerPage.getByText("Airport terminal C")).toBeVisible();
});
