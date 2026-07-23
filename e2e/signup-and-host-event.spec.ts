import { test, expect } from "@playwright/test";
import { signupChurch, uniqueEmail } from "./helpers";
import { toLocalInputValue } from "./time";

test("church admin can sign up and host an event that appears in the feed", async ({ page }) => {
  const email = uniqueEmail("admin");
  const churchName = `Test Church ${Date.now()}`;

  await signupChurch(page, {
    name: "Admin Test",
    email,
    password: "password123",
    churchName,
  });
  await expect(page.getByRole("heading", { name: churchName })).toBeVisible();

  await page.goto("/volunteer/events/new");
  await page.getByRole("button", { name: "Dinner" }).click();
  await page.getByLabel("Title").fill("Welcome Dinner");
  await page.getByLabel("Description").fill("A dinner for new international students.");

  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  await page.getByLabel("Starts").fill(toLocalInputValue(start));
  await page.getByLabel("Ends").fill(toLocalInputValue(end));
  await page.getByLabel("Location").fill("Fellowship Hall");

  await page.getByRole("button", { name: "Publish event" }).click();
  // Anchored to the exact "/events/<id>" shape — a loose /\/events\/.+/
  // regex also matches "/volunteer/events/new" (the form page we're already
  // on), resolving before the actual publish-redirect ever happens.
  await page.waitForURL((url) => /^\/events\/[^/]+$/.test(url.pathname));
  await expect(page.getByRole("heading", { name: "Welcome Dinner" })).toBeVisible();

  await page.goto("/events");
  await expect(page.getByText("Welcome Dinner")).toBeVisible();
});
