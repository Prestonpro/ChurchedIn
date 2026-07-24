import type { Page } from "@playwright/test";

export async function signupChurch(
  page: Page,
  opts: { name: string; email: string; password: string; churchName: string },
) {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(opts.name);
  await page.getByLabel("Email").fill(opts.email);
  await page.getByLabel("Password").fill(opts.password);
  await page.getByLabel("Church name").fill(opts.churchName);
  await page.getByRole("button", { name: "Create your church" }).click();
  // Signup now lands on the "invite a co-leader" welcome page first, not
  // straight on the dashboard — see redesign_prompt.md Phase 9.
  await page.waitForURL("**/admin/welcome");
}

export async function getJoinCode(page: Page): Promise<string> {
  await page.goto("/admin/dashboard");
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
  await page.getByLabel("Password").fill(opts.password);
  await page.getByRole("button", { name: "Join" }).click();
  await page.waitForURL(opts.role === "VOLUNTEER" ? "**/volunteer/dashboard" : "**/student/dashboard");
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

export function uniqueEmail(label: string): string {
  return `${label}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}
