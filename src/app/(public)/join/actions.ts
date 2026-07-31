"use server";

import { redirect } from "next/navigation";

export type GoToCodeResult = { error: string } | void;

/** Just a redirect to /join/[code] — the real validation (does this code
 * match a church?) happens on that page. This only needs to catch the
 * "nothing was typed" case, which previously failed silently: `required`
 * covers a JS-enabled browser, but a no-JS submit of an all-whitespace value
 * still reaches here, and used to just re-render the same empty form with no
 * explanation. */
export async function goToCodeAction(_prev: GoToCodeResult, formData: FormData): Promise<GoToCodeResult> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) {
    return { error: "Enter your church's join code." };
  }
  redirect(`/join/${code}`);
}
