/** Google's official multi-color "G" mark — required as-is by Google's brand
 * guidelines for third-party sign-in buttons, not a recolorable icon. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.5 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.3 17.7 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.6H24v9.1h12.6c-.5 3-2.2 5.5-4.6 7.2l7.4 5.7c4.3-4 6.8-9.8 6.8-17.4Z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.5A14.3 14.3 0 0 1 9.5 24c0-1.6.3-3.1.8-4.5l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.6 2.6 10.8l7.9-6.3Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.3 0-11.6-3.8-13.5-9.8l-7.9 6.3C6.5 42.6 14.6 48 24 48Z"
      />
    </svg>
  );
}

export function GoogleButton({ href, label = "Continue with Google" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-line-strong bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-brand hover:border-brand-300 hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.97]"
    >
      <GoogleMark className="size-4.5" />
      {label}
    </a>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-1 text-xs font-medium text-ink-faint" role="separator">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
