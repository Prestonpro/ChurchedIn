import { test, expect } from "@playwright/test";
import { signupChurch, joinChurch, getJoinCode, uniqueEmail } from "./helpers";

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
  await mentorPage.getByLabel("I'm open to being a friend to a student").check();
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

  await studentPage.goto("/student/mentors");
  await expect(studentPage.getByText("Blockable Mentor")).toBeVisible();

  studentPage.once("dialog", (dialog) => dialog.accept());
  await studentPage.getByTitle("Block Blockable Mentor").click();

  // Removed from the friend directory itself (rendered as an h2 there) —
  // but it now legitimately reappears in the "Blocked" list at the bottom
  // of the page (a plain row, not an h2), since blocking got an undo.
  await expect(studentPage.getByRole("heading", { name: "Blockable Mentor" })).not.toBeVisible();
  await expect(studentPage.getByText("Blockable Mentor")).toBeVisible();
  await expect(studentPage.getByRole("button", { name: "Unblock" })).toBeVisible();
});
