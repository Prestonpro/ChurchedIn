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

export function newEventNotificationEmail(opts: {
  churchName: string;
  eventTitle: string;
  eventId: string;
  categoryLabel: string;
  startsAt: Date;
  description: string;
}): EmailContent {
  const when = opts.startsAt.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
  const preview = opts.description.length > 160 ? `${opts.description.slice(0, 160)}…` : opts.description;
  const subject = `New gathering at ${opts.churchName}: ${opts.eventTitle}`;
  const text = `${opts.eventTitle} (${opts.categoryLabel}) on ${when}.\n\n${preview}\n\n${appUrl(`/events/${opts.eventId}`)}`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Something's happening!",
    bodyHtml: [
      paragraph(
        `<strong>${escapeHtml(opts.eventTitle)}</strong> (${escapeHtml(opts.categoryLabel)}) on ${escapeHtml(when)}.`,
      ),
      paragraph(escapeHtml(preview)),
    ].join(""),
    cta: { label: "View details", url: appUrl(`/events/${opts.eventId}`) },
  });
  return { subject, text, html };
}

export function eventReminderEmail(opts: {
  eventTitle: string;
  eventId: string;
  startsAt: Date;
  location: string;
}): EmailContent {
  const when = opts.startsAt.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" });
  const subject = `Tomorrow: ${opts.eventTitle}`;
  const text = `Just a reminder: you're confirmed for ${opts.eventTitle} on ${when} at ${opts.location}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "See you tomorrow!",
    bodyHtml: paragraph(
      `Just a reminder: you're confirmed for <strong>${escapeHtml(opts.eventTitle)}</strong> on ${escapeHtml(when)} at ${escapeHtml(opts.location)}.`,
    ),
    cta: { label: "View event details", url: appUrl(`/events/${opts.eventId}`) },
  });
  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Requests (Furniture/Food/Mentorship/Housing/Other) — replaces the old
// mentor-connection emails. Mentorship's targeted pick keeps the
// "requested"/"accepted"/"declined" wording (closest to how a connection
// request used to read); the blind-claim flow used by every other category
// (and untargeted Mentorship) reuses the "claimed" wording rides already
// established below.
// ---------------------------------------------------------------------------

export function requestMentorRequestedEmail(opts: {
  requesterName: string;
  message?: string | null;
}): EmailContent {
  const subject = `${opts.requesterName} wants to connect`;
  const text = `${opts.requesterName} sent you a request to connect as a mentor${
    opts.message ? `:\n\n"${opts.message}"` : "."
  }\n\nReview it from your dashboard.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: `${opts.requesterName} wants to connect`,
    bodyHtml: [
      paragraph(`<strong>${escapeHtml(opts.requesterName)}</strong> sent you a request to connect as a mentor.`),
      opts.message
        ? `<p style="margin:0 0 12px 0; padding: 12px 16px; background-color:#f1f8f7; border-radius:8px; font-style:italic;">"${escapeHtml(opts.message)}"</p>`
        : "",
    ].join(""),
    cta: { label: "Review request", url: appUrl("/volunteer/dashboard") },
  });
  return { subject, text, html };
}

export function requestAcceptedForRequesterEmail(opts: {
  claimerName: string;
  claimerEmail: string;
}): EmailContent {
  const subject = `${opts.claimerName} accepted your request`;
  const text = `${opts.claimerName} accepted your request to connect. You can reach them at ${opts.claimerEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "You're connected!",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.claimerName)}</strong> accepted your request to connect. You can reach them at <a href="mailto:${escapeHtml(opts.claimerEmail)}" style="color:#409688;">${escapeHtml(opts.claimerEmail)}</a>.`,
    ),
    cta: { label: "View your requests", url: appUrl("/student/requests") },
  });
  return { subject, text, html };
}

export function requestAcceptedForClaimerEmail(opts: {
  requesterName: string;
  requesterEmail: string;
}): EmailContent {
  const subject = `You're connected with ${opts.requesterName}`;
  const text = `You accepted ${opts.requesterName}'s request. You can reach them at ${opts.requesterEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "You're connected!",
    bodyHtml: paragraph(
      `You accepted <strong>${escapeHtml(opts.requesterName)}</strong>'s request. You can reach them at <a href="mailto:${escapeHtml(opts.requesterEmail)}" style="color:#409688;">${escapeHtml(opts.requesterEmail)}</a>.`,
    ),
    cta: { label: "View your dashboard", url: appUrl("/volunteer/dashboard") },
  });
  return { subject, text, html };
}

export function requestDeclinedEmail(opts: { claimerName: string }): EmailContent {
  const subject = "Update on your request";
  const text = `${opts.claimerName} isn't able to connect right now.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Update on your request",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.claimerName)}</strong> isn't able to connect right now.`,
    ),
    cta: { label: "Browse other mentors", url: appUrl("/student/requests") },
  });
  return { subject, text, html };
}

export function requestCancelledEmail(opts: { otherName: string; title: string }): EmailContent {
  const subject = "A request was cancelled";
  const text = `${opts.otherName} cancelled "${opts.title}".`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "A request was cancelled",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.otherName)}</strong> cancelled "${escapeHtml(opts.title)}".`,
    ),
  });
  return { subject, text, html };
}

// Contact info reveal happens only once a request is CLAIMED — same
// non-negotiable safety rule as rides (CLAUDE.md §1) — applied here for the
// blind-claim flow (Furniture/Food/Housing/Other, and untargeted Mentorship).
export function requestClaimedForRequesterEmail(opts: {
  claimerName: string;
  claimerEmail: string;
  title: string;
}): EmailContent {
  const subject = `${opts.claimerName} can help with "${opts.title}"`;
  const text = `${opts.claimerName} claimed your request "${opts.title}". You can reach them at ${opts.claimerEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Your request is covered!",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.claimerName)}</strong> claimed your request "${escapeHtml(opts.title)}". You can reach them at <a href="mailto:${escapeHtml(opts.claimerEmail)}" style="color:#409688;">${escapeHtml(opts.claimerEmail)}</a>.`,
    ),
    cta: { label: "View your requests", url: appUrl("/student/requests") },
  });
  return { subject, text, html };
}

export function requestClaimedForClaimerEmail(opts: {
  requesterName: string;
  requesterEmail: string;
  title: string;
}): EmailContent {
  const subject = `You claimed "${opts.title}"`;
  const text = `You're helping ${opts.requesterName} with "${opts.title}". You can reach them at ${opts.requesterEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Request claimed",
    bodyHtml: paragraph(
      `You're helping <strong>${escapeHtml(opts.requesterName)}</strong> with "${escapeHtml(opts.title)}". You can reach them at <a href="mailto:${escapeHtml(opts.requesterEmail)}" style="color:#409688;">${escapeHtml(opts.requesterEmail)}</a>.`,
    ),
    cta: { label: "View your dashboard", url: appUrl("/volunteer/dashboard") },
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
    preheader: "Reset your password. This link expires in 1 hour.",
    heading: "Reset your password",
    bodyHtml: [
      paragraph("We got a request to reset your password. This link expires in 1 hour and can only be used once."),
      paragraph("If you didn't request this, you can safely ignore this email. Your password won't change."),
    ].join(""),
    cta: { label: "Reset password", url: opts.resetUrl },
  });
  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Church co-admin invite
// ---------------------------------------------------------------------------

export function coAdminInviteEmail(opts: { inviterName: string; churchName: string; acceptUrl: string }): EmailContent {
  const subject = `${opts.inviterName} wants you to help lead ${opts.churchName} on ChurchedIn`;
  const text = `${opts.inviterName} invited you to co-lead ${opts.churchName}'s space on ChurchedIn. You don't have to be a pastor, just someone who wants to help welcome international students. This link expires in 7 days and can only be used once: ${opts.acceptUrl}`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "You're invited to help lead",
    bodyHtml: [
      paragraph(
        `<strong>${escapeHtml(opts.inviterName)}</strong> invited you to co-lead <strong>${escapeHtml(opts.churchName)}</strong>'s space on ChurchedIn.`,
      ),
      paragraph("You don't have to be a pastor, just someone who wants to help welcome international students."),
      paragraph("This link expires in 7 days and can only be used once."),
    ].join(""),
    cta: { label: "Accept and join as a co-leader", url: opts.acceptUrl },
  });
  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Rides board
// ---------------------------------------------------------------------------

// Contact info reveal happens only once a ride is CLAIMED — same
// non-negotiable safety rule as mentor connections (PLAN.md section 8),
// applied here since this is the same vulnerable population coordinating
// with someone they haven't vetted.
export function rideClaimedForStudentEmail(opts: {
  volunteerName: string;
  volunteerEmail: string;
  destination: string;
}): EmailContent {
  const subject = `${opts.volunteerName} can give you a ride`;
  const text = `${opts.volunteerName} claimed your ride request to ${opts.destination}. You can reach them at ${opts.volunteerEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Your ride is covered!",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.volunteerName)}</strong> claimed your ride request to <strong>${escapeHtml(opts.destination)}</strong>. You can reach them at <a href="mailto:${escapeHtml(opts.volunteerEmail)}" style="color:#409688;">${escapeHtml(opts.volunteerEmail)}</a>.`,
    ),
    cta: { label: "View your ride requests", url: appUrl("/student/rides") },
  });
  return { subject, text, html };
}

export function rideClaimedForVolunteerEmail(opts: {
  studentName: string;
  studentEmail: string;
  destination: string;
}): EmailContent {
  const subject = `You claimed a ride to ${opts.destination}`;
  const text = `You're giving ${opts.studentName} a ride to ${opts.destination}. You can reach them at ${opts.studentEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Ride claimed",
    bodyHtml: paragraph(
      `You're giving <strong>${escapeHtml(opts.studentName)}</strong> a ride to <strong>${escapeHtml(opts.destination)}</strong>. You can reach them at <a href="mailto:${escapeHtml(opts.studentEmail)}" style="color:#409688;">${escapeHtml(opts.studentEmail)}</a>.`,
    ),
    cta: { label: "View the rides board", url: appUrl("/volunteer/rides") },
  });
  return { subject, text, html };
}

export function rideOfferSeatConfirmedEmail(opts: {
  volunteerName: string;
  volunteerEmail: string;
  date: Date;
  time: string;
}): EmailContent {
  const when = `${opts.date.toLocaleDateString()} · ${opts.time}`;
  const subject = `You're in: ride with ${opts.volunteerName}`;
  const text = `You have a confirmed seat on ${opts.volunteerName}'s ride to church on ${when}. You can reach them at ${opts.volunteerEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Your seat is confirmed!",
    bodyHtml: paragraph(
      `You have a confirmed seat on <strong>${escapeHtml(opts.volunteerName)}</strong>'s ride to church on <strong>${escapeHtml(when)}</strong>. You can reach them at <a href="mailto:${escapeHtml(opts.volunteerEmail)}" style="color:#409688;">${escapeHtml(opts.volunteerEmail)}</a>.`,
    ),
    cta: { label: "View your rides", url: appUrl("/student/rides") },
  });
  return { subject, text, html };
}

export function rideOfferWaitlistedEmail(opts: { volunteerName: string; date: Date; time: string }): EmailContent {
  const when = `${opts.date.toLocaleDateString()} · ${opts.time}`;
  const subject = `You're on the waitlist for ${opts.volunteerName}'s ride`;
  const text = `${opts.volunteerName}'s ride to church on ${when} is currently full. You're on the waitlist and will be notified automatically if a seat opens up.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "You're on the waitlist",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.volunteerName)}</strong>'s ride to church on <strong>${escapeHtml(when)}</strong> is currently full. You're on the waitlist and will be notified automatically if a seat opens up.`,
    ),
    cta: { label: "View your rides", url: appUrl("/student/rides") },
  });
  return { subject, text, html };
}

export function rideOfferSeatPromotedEmail(opts: {
  volunteerName: string;
  volunteerEmail: string;
  date: Date;
  time: string;
}): EmailContent {
  const when = `${opts.date.toLocaleDateString()} · ${opts.time}`;
  const subject = `A seat opened up: ride with ${opts.volunteerName}`;
  const text = `A seat just opened up and you've been moved from the waitlist to confirmed on ${opts.volunteerName}'s ride to church on ${when}. You can reach them at ${opts.volunteerEmail}.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "A seat opened up!",
    bodyHtml: paragraph(
      `A seat just opened up and you've been moved from the waitlist to <strong>confirmed</strong> on <strong>${escapeHtml(opts.volunteerName)}</strong>'s ride to church on <strong>${escapeHtml(when)}</strong>. You can reach them at <a href="mailto:${escapeHtml(opts.volunteerEmail)}" style="color:#409688;">${escapeHtml(opts.volunteerEmail)}</a>.`,
    ),
    cta: { label: "View your rides", url: appUrl("/student/rides") },
  });
  return { subject, text, html };
}

export function rideOfferCancelledEmail(opts: { volunteerName: string; date: Date; time: string }): EmailContent {
  const when = `${opts.date.toLocaleDateString()} · ${opts.time}`;
  const subject = `Cancelled: ${opts.volunteerName}'s ride to church`;
  const text = `${opts.volunteerName}'s ride to church on ${when} has been cancelled. Check the rides board for another option.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "Ride cancelled",
    bodyHtml: paragraph(
      `<strong>${escapeHtml(opts.volunteerName)}</strong>'s ride to church on <strong>${escapeHtml(when)}</strong> has been cancelled. Check the rides board for another option.`,
    ),
    cta: { label: "View available rides", url: appUrl("/student/rides") },
  });
  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

/** Sent at most once per "unread streak" in a thread — see
 * shouldNotifyByEmail in src/lib/messaging.ts — so a fast back-and-forth
 * doesn't send one email per reply. Deliberately doesn't quote the message
 * body: the recipient has to open the app to read it, and this is a
 * notification, not a copy of private correspondence sitting in an inbox. */
export function newMessageEmail(opts: {
  senderName: string;
  requestId: string;
}): EmailContent {
  const subject = `New message from ${opts.senderName}`;
  const text = `${opts.senderName} sent you a message.`;
  const html = renderEmailLayout({
    preheader: text,
    heading: "New message",
    bodyHtml: paragraph(`<strong>${escapeHtml(opts.senderName)}</strong> sent you a message.`),
    cta: { label: "Read and reply", url: appUrl(`/messages/${opts.requestId}`) },
  });
  return { subject, text, html };
}
