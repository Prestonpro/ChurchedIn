import { test, expect } from "@playwright/test";
import { signupChurch, joinChurch, getJoinCode, uniqueEmail } from "./helpers";
import { toLocalInputValue } from "./time";

test("a capped event waitlists the second helper and promotes them when the first cancels", async ({ browser }) => {
  const adminEmail = uniqueEmail("admin-rsvp");
  const churchName = `RSVP Test Church ${Date.now()}`;

  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "Admin",
    email: adminEmail,
    password: "password123",
    churchName,
  });
  const joinCode = await getJoinCode(adminPage);

  await adminPage.goto("/volunteer/events/new");
  await adminPage.getByLabel("Title").fill("Capacity Test Event");
  await adminPage.getByLabel("Description").fill("Testing waitlist promotion end to end.");
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  await adminPage.getByLabel("Starts").fill(toLocalInputValue(start));
  await adminPage.getByLabel("Ends").fill(toLocalInputValue(end));
  await adminPage.getByLabel("Location").fill("Room A");
  await adminPage.getByLabel("Volunteer capacity").fill("1");
  await adminPage.getByRole("button", { name: "Publish event" }).click();
  // Anchored to the exact "/events/<id>" shape — a loose /\/events\/.+/
  // regex also matches "/volunteer/events/new" (the form page we're already
  // on), resolving before the actual publish-redirect ever happens.
  await adminPage.waitForURL((url) => /^\/events\/[^/]+$/.test(url.pathname));
  const eventUrl = adminPage.url();

  // First helper RSVPs — the single spot is open, so they're confirmed.
  const vol1Email = uniqueEmail("vol1");
  const vol1Page = await (await browser.newContext()).newPage();
  await joinChurch(vol1Page, {
    joinCode,
    role: "VOLUNTEER",
    name: "Volunteer One",
    email: vol1Email,
    password: "password123",
  });
  await vol1Page.goto(eventUrl);
  await vol1Page.getByRole("button", { name: "I'm in to help!" }).click();
  await expect(vol1Page.getByText(/confirmed as a helper/i)).toBeVisible();

  // Second helper RSVPs — the spot is taken, so they're waitlisted, not confirmed.
  const vol2Email = uniqueEmail("vol2");
  const vol2Page = await (await browser.newContext()).newPage();
  await joinChurch(vol2Page, {
    joinCode,
    role: "VOLUNTEER",
    name: "Volunteer Two",
    email: vol2Email,
    password: "password123",
  });
  await vol2Page.goto(eventUrl);
  await vol2Page.getByRole("button", { name: "I'm in to help!" }).click();
  await expect(vol2Page.getByText(/waitlist/i)).toBeVisible();

  // First helper cancels — the second helper should be auto-promoted.
  await vol1Page.getByRole("button", { name: "Cancel my RSVP" }).click();
  await expect(vol1Page.getByRole("button", { name: "I'm in to help!" })).toBeVisible();

  await vol2Page.reload();
  await expect(vol2Page.getByText(/confirmed as a helper/i)).toBeVisible();
});
