import { NextResponse } from "next/server";
import { sendDueEventReminders } from "@/lib/eventReminderJob";

/**
 * Hit once a day by vercel.json's cron config. Vercel signs its own cron
 * requests with `Authorization: Bearer $CRON_SECRET` automatically once
 * CRON_SECRET is set as an env var — checked here so this endpoint can't be
 * hit by anyone else to mass-email every confirmed attendee on demand.
 * Skipped entirely when CRON_SECRET isn't set (local dev), same as the
 * dev-mode console-log fallback in sendEmail itself.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await sendDueEventReminders();
  return NextResponse.json(result);
}
