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
  await mentorPage.getByLabel("I'm open to being matched as a mentor").check();
  await mentorPage.getByRole("button", { name: "Save mentor profile" }).click();

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
  await studentPage.getByTitle("Block this person").click();

  await expect(studentPage.getByText("Blockable Mentor")).not.toBeVisible();
});
