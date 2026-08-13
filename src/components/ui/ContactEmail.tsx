import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr";

/**
 * A revealed contact email address. Exists as its own component because an
 * email is the one string in this app with no spaces to wrap at, so left
 * alone it sets a wide min-content floor on every ancestor and blows the
 * layout off the right edge of a phone. `min-w-0` + `break-all` on the text
 * is what actually contains it; the surrounding flex row needs the icon to
 * stay `shrink-0` so it isn't squashed instead.
 *
 * Only ever render this where the contact-info safety rule already allows it
 * (see requestContactVisible) — this component does no gating of its own.
 */
export function ContactEmail({ email, size = "xs" }: { email: string; size?: "xs" | "sm" }) {
  const text = size === "sm" ? "text-sm" : "text-xs";
  const icon = size === "sm" ? "size-4" : "size-3.5";
  return (
    <p className={`flex min-w-0 items-start gap-1.5 ${text} text-ink-muted`}>
      <EnvelopeSimple weight="bold" className={`${icon} mt-0.5 shrink-0 text-ink-faint`} />
      <span className="min-w-0 break-all">{email}</span>
    </p>
  );
}
