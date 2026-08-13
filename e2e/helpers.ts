import type { Page } from "@playwright/test";

/**
 * A fresh account's first authenticated page render auto-opens a
 * once-ever "here's what you can do" walkthrough modal (see
 * OnboardingAutoTrigger.tsx) and fires markOnboardingSeenAction() in the
 * background without waiting for it. If a test navigates away before that
 * write commits, the very next page can re-open the same modal — and its
 * backdrop then intercepts whatever the test tries to click next.
 * Dismissing it defensively (a no-op if it never appears) keeps every spec
 * below from depending on that timing.
 */
export async function dismissOnboardingIfPresent(page: Page): Promise<void> {
  const closeButton = page.getByRole("button", { name: "Close" });
  try {
    await closeButton.waitFor({ state: "visible", timeout: 1500 });
    // markOnboardingSeenAction() fires the moment the modal opens, not on
    // close (see OnboardingAutoTrigger.tsx) — but it's fire-and-forget, so
    // clicking Close doesn't mean that write has landed yet. Without
    // waiting here, navigating away immediately can outrun it, and the
    // very next page re-reads hasSeenOnboarding as still false and
    // re-opens the same modal — whose backdrop then eats the next click.
    // Exported so callers can also re-check it after their own subsequent
    // navigation (e.g. straight to /volunteer/profile after joining),
    // since that's the specific pattern where this race actually bites.
    await page.waitForLoadState("networkidle");
    await closeButton.click();
  } catch {
    // Never appeared — already seen, or the write raced ahead. Fine either way.
  }
}

export async function signupChurch(
  page: Page,
  opts: { name: string; email: string; password: string; churchName: string },
) {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(opts.name);
  await page.getByLabel("Email").fill(opts.email);
  // exact: true, not just getByLabel("Password") — PasswordField's
  // show/hide toggle button also carries an aria-label containing the word
  // "password" ("Show password"/"Hide password"), which getByLabel matches
  // as a substring by default. Exact matching is what actually
  // disambiguates the two now that PasswordField.tsx no longer lets that
  // button's aria-label pollute the input's own computed accessible name.
  await page.getByLabel("Password", { exact: true }).fill(opts.password);
  await page.getByLabel("Church name").fill(opts.churchName);
  await page.getByRole("button", { name: "Create your church" }).click();
  // Signup now lands on the "invite a co-leader" welcome page first, not
  // straight on the dashboard — see redesign_prompt.md Phase 9.
  await page.waitForURL("**/admin/welcome");
  await dismissOnboardingIfPresent(page);
}

export async function getJoinCode(page: Page): Promise<string> {
  await page.goto("/admin/dashboard");
  await dismissOnboardingIfPresent(page);
  const code = await page.locator("code").first().textContent();
  if (!code) throw new Error("Join code not found on admin dashboard");
  return code.trim();
}

export async function joinChurch(
  page: Page,
  opts: {
    joinCode: string;
    role: "VOLUNTEER" | "STUDENT";
    name: string;
    email: string;
    password: string;
  },
) {
  await page.goto(`/join/${opts.joinCode}`);
  // The role radios are visually replaced by icon cards (the actual <input>
  // is sr-only), so clicking the label's visible text — which triggers the
  // browser's native label-click-forwards-to-control behavior — is more
  // reliable here than targeting the hidden input directly (Playwright's
  // actionability check can flag the icon sitting on top of the collapsed
  // input as "intercepting" the click, even though real users clicking
  // anywhere on the label are unaffected).
  await page
    .getByText(opts.role === "VOLUNTEER" ? "Volunteer" : "International student", { exact: true })
    .click();
  await page.getByLabel("Your name").fill(opts.name);
  await page.getByLabel("Email").fill(opts.email);
  // exact: true, not just getByLabel("Password") — PasswordField's
  // show/hide toggle button also carries an aria-label containing the word
  // "password" ("Show password"/"Hide password"), which getByLabel matches
  // as a substring by default. Exact matching is what actually
  // disambiguates the two now that PasswordField.tsx no longer lets that
  // button's aria-label pollute the input's own computed accessible name.
  await page.getByLabel("Password", { exact: true }).fill(opts.password);
  await page.getByRole("button", { name: "Join" }).click();
  await page.waitForURL(opts.role === "VOLUNTEER" ? "**/volunteer/dashboard" : "**/student/dashboard");
  await dismissOnboardingIfPresent(page);
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

export function uniqueEmail(label: string): string {
  return `${label}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}
