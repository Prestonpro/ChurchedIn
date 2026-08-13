import { test, expect } from "@playwright/test";
import { signupChurch, getJoinCode, joinChurch, uniqueEmail } from "./helpers";

/**
 * Guards the no-JavaScript form-submission path for the auth forms, which are
 * the ones that demonstrably work without scripting today.
 *
 * Scope note, because it is not obvious: authenticated *content* routes do NOT
 * currently render without JavaScript. Next.js streams them (the markup ships
 * inside `<div hidden>` and is moved into place by an inline `$RC(...)` script),
 * so with scripting off the visitor is left on the Suspense fallback — a
 * spinner where a `loading.tsx` exists, a blank page where one doesn't. That
 * makes /events/[id]'s RSVP control unreachable without JS regardless of its
 * server action's signature, so there is deliberately no no-JS RSVP test here;
 * asserting one would only ever be testing the streaming behavior.
 *
 * What this spec does pin down is that `useActionState`-driven forms really do
 * post and redirect correctly with scripting disabled, so the progressive-
 * enhancement path CLAUDE.md cares about is genuinely exercised rather than
 * assumed.
 */
test("signing in works with JavaScript disabled", async ({ browser }) => {
  const password = "password123";
  const volEmail = uniqueEmail("nojs-vol");
  const churchName = `NoJS Church ${Date.now()}`;

  // Setup runs with JS on: creating a church and joining one both involve
  // client-side state (the role picker's sr-only radios, the event form's
  // category cards) that is out of scope here.
  const adminPage = await (await browser.newContext()).newPage();
  await signupChurch(adminPage, {
    name: "NoJS Admin",
    email: uniqueEmail("nojs-admin"),
    password,
    churchName,
  });
  const joinCode = await getJoinCode(adminPage);

  const volPage = await (await browser.newContext()).newPage();
  await joinChurch(volPage, {
    joinCode,
    role: "VOLUNTEER",
    name: "NoJS Volunteer",
    email: volEmail,
    password,
  });

  const noJsPage = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await noJsPage.goto("/login");
  await noJsPage.getByLabel("Email").fill(volEmail);
  await noJsPage.getByLabel("Password", { exact: true }).fill(password);
  await noJsPage.getByRole("button", { name: "Log in" }).click();
  // A role-derived redirect proves the action ran server-side and the session
  // cookie was set, without depending on the destination page's rendering.
  await noJsPage.waitForURL("**/volunteer/dashboard");

  // A wrong password must surface the error inline rather than dead-ending.
  const badPage = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await badPage.goto("/login");
  await badPage.getByLabel("Email").fill(volEmail);
  await badPage.getByLabel("Password", { exact: true }).fill("wrong-password");
  await badPage.getByRole("button", { name: "Log in" }).click();
  await expect(badPage.getByText(/incorrect|invalid|check/i).first()).toBeVisible();
});
