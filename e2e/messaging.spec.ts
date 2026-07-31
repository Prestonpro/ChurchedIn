import { test, expect } from "@playwright/test";
import { signupChurch, joinChurch, getJoinCode, uniqueEmail } from "./helpers";

test("accepted connections can message each other, mark unread, and file a report an admin can review", async ({
  browser,
}) => {
  // This walks the full lifecycle (request, accept, message both ways, unread
  // badge, report, admin review) in one sequential flow — meaningfully more
  // steps than any other spec, so it needs more than Playwright's 30s default
  // per-test timeout to finish under normal dev-server load.
  test.setTimeout(60_000);

  const adminEmail = uniqueEmail("admin-msg");
  const churchName = `Messaging Test Church ${Date.now()}`;

  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "Admin",
    email: adminEmail,
    password: "password123",
    churchName,
  });
  const joinCode = await getJoinCode(adminPage);

  const mentorEmail = uniqueEmail("mentor-msg");
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

  const studentEmail = uniqueEmail("student-msg");
  const studentPage = await (await browser.newContext()).newPage();
  await joinChurch(studentPage, {
    joinCode,
    role: "STUDENT",
    name: "Student Person",
    email: studentEmail,
    password: "password123",
  });
  await studentPage.goto("/student/mentors");
  await studentPage.getByRole("button", { name: "Say hi" }).click();
  await expect(studentPage.getByText("Request pending")).toBeVisible();

  await mentorPage.goto("/volunteer/dashboard");
  await mentorPage.getByRole("button", { name: "Accept" }).click();
  // Sync on the revealed student email, not the "Message" link — the nav bar
  // already has a persistent "Messages" link, so waiting on any locator that
  // matches "message" as a substring resolves against that immediately and
  // never actually confirms the accept round-trip landed.
  await expect(mentorPage.getByText(studentEmail)).toBeVisible();

  await studentPage.goto("/student/mentors");
  await expect(studentPage.getByText("Connected")).toBeVisible();
  await studentPage.getByRole("link", { name: "Message", exact: true }).click();
  await studentPage.waitForURL(/\/messages\/.+/);

  await studentPage.getByLabel("Write a message").fill("Hi! Excited to connect.");
  await studentPage.getByRole("button", { name: "Send" }).click();
  await expect(studentPage.getByText("Hi! Excited to connect.")).toBeVisible();

  // The mentor should see an unread badge on the Messages nav link before
  // opening the thread. Scoped to <nav> specifically: /volunteer/dashboard
  // also has a per-connection "Message" link in the page body, and the
  // badge's own count text gets folded into the nav link's accessible name
  // too (so an anchored "^Messages$" match breaks once the badge renders).
  const navMessagesLink = () => mentorPage.locator("nav").getByRole("link", { name: /messages/i });
  await mentorPage.goto("/volunteer/dashboard");
  await expect(navMessagesLink().getByText("1")).toBeVisible();

  await navMessagesLink().click();
  await mentorPage.waitForURL("**/messages");
  await expect(mentorPage.getByText("Hi! Excited to connect.")).toBeVisible();
  await mentorPage.getByText("Student Person").click();
  await mentorPage.waitForURL(/\/messages\/.+/);
  await expect(mentorPage.getByText("Hi! Excited to connect.")).toBeVisible();

  // Opening the thread marks it read — the nav badge should clear.
  await mentorPage.goto("/volunteer/dashboard");
  await expect(navMessagesLink().getByText("1")).not.toBeVisible();

  await navMessagesLink().click();
  await mentorPage.getByText("Student Person").click();
  await mentorPage.getByLabel("Write a message").fill("Great to meet you too!");
  await mentorPage.getByRole("button", { name: "Send" }).click();
  await expect(mentorPage.getByText("Great to meet you too!")).toBeVisible();

  // The student reports the conversation.
  await studentPage.goto(mentorPage.url());
  await studentPage.getByRole("button", { name: "Report" }).click();
  await studentPage.getByLabel("What's going on?").selectOption("Made me uncomfortable");
  await studentPage.getByRole("button", { name: "Send report" }).click();
  await expect(studentPage.getByText(/report has been sent/i)).toBeVisible();

  // The church admin sees it in their moderation queue, with the message
  // content for context, and can resolve it.
  await adminPage.goto("/admin/reports");
  await expect(adminPage.getByText("Made me uncomfortable")).toBeVisible();
  await expect(adminPage.getByText("Hi! Excited to connect.")).toBeVisible();
  await adminPage.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(adminPage.getByText("Reviewed")).toBeVisible();
});

test("a connection that has ended keeps message history read-only", async ({ browser }) => {
  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "Admin",
    email: uniqueEmail("admin-ended-msg"),
    password: "password123",
    churchName: `Ended Msg Church ${Date.now()}`,
  });
  const joinCode = await getJoinCode(adminPage);

  const mentorPage = await (await browser.newContext()).newPage();
  await joinChurch(mentorPage, {
    joinCode,
    role: "VOLUNTEER",
    name: "Ending Mentor",
    email: uniqueEmail("mentor-ended-msg"),
    password: "password123",
  });
  await mentorPage.goto("/volunteer/profile");
  await mentorPage.getByLabel("I'm open to being a friend to a student").check();
  await mentorPage.getByRole("button", { name: "Save my profile" }).click();

  const studentEmail = uniqueEmail("student-ended-msg");
  const studentPage = await (await browser.newContext()).newPage();
  await joinChurch(studentPage, {
    joinCode,
    role: "STUDENT",
    name: "Ending Student",
    email: studentEmail,
    password: "password123",
  });
  await studentPage.goto("/student/mentors");
  await studentPage.getByRole("button", { name: "Say hi" }).click();
  await expect(studentPage.getByText("Request pending")).toBeVisible();

  await mentorPage.goto("/volunteer/dashboard");
  await mentorPage.getByRole("button", { name: "Accept" }).click();
  await expect(mentorPage.getByText(studentEmail)).toBeVisible();

  await mentorPage.getByRole("link", { name: "Message", exact: true }).click();
  await mentorPage.waitForURL(/\/messages\/.+/);
  await mentorPage.getByLabel("Write a message").fill("Before we end this.");
  await mentorPage.getByRole("button", { name: "Send" }).click();
  await expect(mentorPage.getByText("Before we end this.")).toBeVisible();
  const threadUrl = mentorPage.url();

  await mentorPage.goto("/volunteer/dashboard");
  mentorPage.once("dialog", (dialog) => dialog.accept());
  await mentorPage.getByRole("button", { name: "End connection" }).click();
  // The dashboard's "Your friends" list only shows ACCEPTED connections, so
  // ending it removes the card entirely — the ready signal that the server
  // action's revalidatePath took effect before moving on.
  await expect(mentorPage.getByRole("button", { name: "End connection" })).not.toBeVisible();

  // History is still visible, but sending is no longer offered.
  await mentorPage.goto(threadUrl);
  await expect(mentorPage.getByText("Before we end this.")).toBeVisible();
  await expect(mentorPage.getByLabel("Write a message")).not.toBeVisible();
  await expect(mentorPage.getByText(/you can't send new/i)).toBeVisible();
});
