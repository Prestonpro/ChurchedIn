import "server-only";
import { renderEmailLayout, escapeHtml } from "@/lib/emailLayout";
import { appUrl } from "@/lib/email";

export type EmailContent = { subject: string; text: string; html: string };

function paragraph(text: string): string {
  return `<p style="margin:0 0 12px 0;">${text}</p>`;
}

// ---------------------------------------------------------------------------
// RSVP + waitlist
// ---------------------------------------------------------------------------

export function rsvpConfirmedEmail(opts: {
  eventTitle: string;
  eventId: string;
  startsAt: Date;
}): EmailContent {
  const when = opts.startsAt.toLocaleString();
  const subject = `You're confirmed: ${opts.eventTitle}`;
  const text = `You're confirmed for ${opts.eventTitle} on ${when}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "You're confirmed!",
    bodyHtml: paragraph(
      `You're confirmed for <strong>${escapeHtml(opts.eventTitle)}</strong> on ${escapeHtml(when)}.`,
    ),
    cta: { label: "View event details", url: appUrl(`/events/${opts.eventId}`) },
  });
  return { subject, text, html };
}

export function rsvpWaitlistedEmail(opts: { eventTitle: string; eventId: string }): EmailContent {
  const subject = `You're on the waitlist: ${opts.eventTitle}`;
  const text = `${opts.eventTitle} is currently full. You're on the waitlist and will be notified automatically if a spot opens up.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "You're on the waitlist",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.eventTitle)}</strong> is currently full. You're on the waitlist and will be notified automatically if a spot opens up.`,
    ),
    cta: { label: "View event details", url: appUrl(`/events/${opts.eventId}`) },
  });
  return { subject, text, html };
}

export function waitlistPromotedEmail(opts: { eventTitle: string; eventId: string }): EmailContent {
  const subject = `A spot opened up: ${opts.eventTitle}`;
  const text = `A spot just opened up and you've been moved from the waitlist to confirmed for ${opts.eventTitle}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "A spot opened up!",
    bodyHtml: paragraph(
      `A spot just opened up and you've been moved from the waitlist to <strong>confirmed</strong> for <strong>${escapeHtml(opts.eventTitle)}</strong>.`,
    ),
    cta: { label: "View event details", url: appUrl(`/events/${opts.eventId}`) },
  });
  return { subject, text, html };
}

export function eventCancelledEmail(opts: { eventTitle: string; startsAt: Date }): EmailContent {
  const when = opts.startsAt.toLocaleString();
  const subject = `Cancelled: ${opts.eventTitle}`;
  const text = `${opts.eventTitle} on ${when} has been cancelled by the organizer.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Event cancelled",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.eventTitle)}</strong> on ${escapeHtml(when)} has been cancelled by the organizer.`,
    ),
  });
  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Mentor connections
// ---------------------------------------------------------------------------

export function connectionRequestedEmail(opts: {
  studentName: string;
  message?: string | null;
}): EmailContent {
  const subject = `${opts.studentName} wants to connect`;
  const text = `${opts.studentName} sent you a mentorship connection request${
    opts.message ? `:\n\n"${opts.message}"` : "."
  }\n\nReview it from your dashboard.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: `${opts.studentName} wants to connect`,
    bodyHtml: [
      paragraph(`<strong>${escapeHtml(opts.studentName)}</strong> sent you a mentorship connection request.`),
      opts.message
        ? `<p style="margin:0 0 12px 0; padding: 12px 16px; background-color:#f1f8f7; border-radius:8px; font-style:italic;">"${escapeHtml(opts.message)}"</p>`
        : "",
    ].join(""),
    cta: { label: "Review request", url: appUrl("/volunteer/dashboard") },
  });
  return { subject, text, html };
}

export function connectionAcceptedForStudentEmail(opts: {
  mentorName: string;
  mentorEmail: string;
}): EmailContent {
  const subject = `${opts.mentorName} accepted your request`;
  const text = `${opts.mentorName} accepted your mentorship request. You can reach them at ${opts.mentorEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "You're connected!",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.mentorName)}</strong> accepted your mentorship request. You can reach them at <a href="mailto:${escapeHtml(opts.mentorEmail)}" style="color:#409688;">${escapeHtml(opts.mentorEmail)}</a>.`,
    ),
    cta: { label: "View your mentors", url: appUrl("/student/mentors") },
  });
  return { subject, text, html };
}

export function connectionAcceptedForMentorEmail(opts: {
  studentName: string;
  studentEmail: string;
}): EmailContent {
  const subject = `You're connected with ${opts.studentName}`;
  const text = `You accepted ${opts.studentName}'s request. You can reach them at ${opts.studentEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "You're connected!",
    bodyHtml: paragraph(
      `You accepted <strong>${escapeHtml(opts.studentName)}</strong>'s request. You can reach them at <a href="mailto:${escapeHtml(opts.studentEmail)}" style="color:#409688;">${escapeHtml(opts.studentEmail)}</a>.`,
    ),
    cta: { label: "View your dashboard", url: appUrl("/volunteer/dashboard") },
  });
  return { subject, text, html };
}

export function connectionDeclinedEmail(opts: { mentorName: string }): EmailContent {
  const subject = "Update on your mentor request";
  const text = `${opts.mentorName} isn't able to connect right now.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Update on your request",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.mentorName)}</strong> isn't able to connect right now.`,
    ),
    cta: { label: "Browse other mentors", url: appUrl("/student/mentors") },
  });
  return { subject, text, html };
}

export function connectionEndedEmail(opts: { otherName: string }): EmailContent {
  const subject = "A connection was ended";
  const text = `${opts.otherName} ended your mentorship connection.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "A connection was ended",
    bodyHtml: paragraph(`<strong>${escapeHtml(opts.otherName)}</strong> ended your mentorship connection.`),
  });
  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

export function passwordResetEmail(opts: { resetUrl: string }): EmailContent {
  const subject = "Reset your password";
  const text = `Reset your password using this link (expires in 1 hour, and can only be used once): ${opts.resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = renderEmailLayout({
    preheader: "Reset your password — this link expires in 1 hour.",
    heading: "Reset your password",
    bodyHtml: [
      paragraph("We got a request to reset your password. This link expires in 1 hour and can only be used once."),
      paragraph("If you didn't request this, you can safely ignore this email — your password won't change."),
    ].join(""),
    cta: { label: "Reset password", url: opts.resetUrl },
  });
  return { subject, text, html };
}
