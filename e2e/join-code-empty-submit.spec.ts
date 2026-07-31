import { test, expect } from "@playwright/test";

/**
 * /join's code field used to be backed by a bare `<form action={serverFn}>`
 * with no useActionState — a whitespace-only submission passed the browser's
 * native `required` check (it has characters) but trimmed to empty server-
 * side, and the action just returned with no redirect and no error. The user
 * saw the same blank form with zero explanation. Now it's a useActionState
 * form that returns an inline error instead.
 */
test("submitting an empty/whitespace join code shows an inline error instead of silently doing nothing", async ({ page }) => {
  await page.goto("/join");
  await page.getByLabel("Join code").fill("   ");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/enter your church's join code/i)).toBeVisible();
  // Still on /join — no navigation happened.
  await expect(page).toHaveURL(/\/join$/);
});
