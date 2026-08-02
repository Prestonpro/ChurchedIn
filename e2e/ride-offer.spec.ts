import { test, expect } from "@playwright/test";
import { signupChurch, joinChurch, getJoinCode, uniqueEmail } from "./helpers";

test("a capped ride offer waitlists the second rider and promotes them when the first leaves", async ({ browser }) => {
  const churchName = `Ride Offer Test Church ${Date.now()}`;
  const password = "password123";

  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "Admin",
    email: uniqueEmail("admin-rideoffer"),
    password,
    churchName,
  });
  const joinCode = await getJoinCode(adminPage);

  const volunteerPage = await (await browser.newContext()).newPage();
  await joinChurch(volunteerPage, {
    joinCode,
    role: "VOLUNTEER",
    name: "Offering Driver",
    email: uniqueEmail("vol-rideoffer"),
    password,
  });
  await volunteerPage.goto("/volunteer/rides");
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await volunteerPage.getByLabel("Date").fill(date);
  await volunteerPage.getByLabel("Time").fill("9:00 AM");
  await volunteerPage.getByLabel("Seats available").fill("1");
  await volunteerPage.getByRole("button", { name: "Offer a ride" }).click();
  await expect(volunteerPage.getByText("0/1 seats")).toBeVisible();

  // First rider joins — the single seat is open, so they're confirmed.
  const rider1Page = await (await browser.newContext()).newPage();
  await joinChurch(rider1Page, {
    joinCode,
    role: "STUDENT",
    name: "Rider One",
    email: uniqueEmail("rider1"),
    password,
  });
  await rider1Page.goto("/student/rides");
  await rider1Page.getByRole("button", { name: "Join this ride" }).click();
  await expect(rider1Page.getByText("You're in")).toBeVisible();

  // Second rider joins — the seat is taken, so they're waitlisted.
  const rider2Page = await (await browser.newContext()).newPage();
  await joinChurch(rider2Page, {
    joinCode,
    role: "STUDENT",
    name: "Rider Two",
    email: uniqueEmail("rider2"),
    password,
  });
  await rider2Page.goto("/student/rides");
  await rider2Page.getByRole("button", { name: "Join waitlist" }).click();
  await expect(rider2Page.getByText("You're on the waitlist")).toBeVisible();

  // First rider leaves — the second rider should be auto-promoted, which
  // immediately refills the single seat. So rider1 (now claim-less) sees
  // "Join waitlist", not "Join this ride" — the ride is full again the
  // instant rider2 is promoted into it.
  rider1Page.once("dialog", (dialog) => dialog.accept());
  await rider1Page.getByRole("button", { name: "Leave this ride" }).click();
  await expect(rider1Page.getByRole("button", { name: "Join waitlist" })).toBeVisible();

  await rider2Page.reload();
  await expect(rider2Page.getByText("You're in")).toBeVisible();

  // The volunteer's own view reflects the same confirmed rider.
  await volunteerPage.reload();
  await expect(volunteerPage.getByText("Rider Two")).toBeVisible();
});

/**
 * Same safety-critical concern as the ride-request block test in
 * block-enforcement.spec.ts: a blocked pair must never be able to reach
 * each other through the ride-offer board either.
 */
test("a blocked volunteer's ride offer never appears to the student who blocked them", async ({ browser }) => {
  const churchName = `Ride Offer Block Church ${Date.now()}`;
  const password = "password123";

  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "Admin",
    email: uniqueEmail("admin-rideofferblock"),
    password,
    churchName,
  });
  const joinCode = await getJoinCode(adminPage);

  const volunteerPage = await (await browser.newContext()).newPage();
  await joinChurch(volunteerPage, {
    joinCode,
    role: "VOLUNTEER",
    name: "Blocked Offerer",
    email: uniqueEmail("vol-rideofferblock"),
    password,
  });
  await volunteerPage.goto("/volunteer/profile");
  await volunteerPage.getByLabel("I'm open to being a friend to a student").check();
  await volunteerPage.getByRole("button", { name: "Save my profile" }).click();

  const studentPage = await (await browser.newContext()).newPage();
  await joinChurch(studentPage, {
    joinCode,
    role: "STUDENT",
    name: "Blocking Rider",
    email: uniqueEmail("student-rideofferblock"),
    password,
  });

  await studentPage.goto("/student/mentors");
  studentPage.once("dialog", (dialog) => dialog.accept());
  await studentPage.getByTitle("Block Blocked Offerer").click();
  await expect(studentPage.getByRole("button", { name: "Unblock" })).toBeVisible();

  await volunteerPage.goto("/volunteer/rides");
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await volunteerPage.getByLabel("Date").fill(date);
  await volunteerPage.getByLabel("Time").fill("10:00 AM");
  await volunteerPage.getByLabel("Seats available").fill("3");
  await volunteerPage.getByRole("button", { name: "Offer a ride" }).click();
  await expect(volunteerPage.getByText("0/3 seats")).toBeVisible();

  await studentPage.goto("/student/rides");
  await expect(studentPage.getByText("Blocked Offerer")).not.toBeVisible();
});
