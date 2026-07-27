"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react/dist/ssr";

/**
 * Centered dialog with a dimmed/blurred backdrop, rendered via a portal into
 * document.body — not just for the usual z-index/overflow reasons, but
 * because some callers (e.g. the tilting feature cards) sit inside an
 * ancestor with a CSS `perspective`, which creates a new containing block
 * for `position: fixed` descendants. Rendered as a normal child, the modal
 * would end up fixed relative to that small tilting box instead of the
 * viewport. The portal sidesteps that entirely.
 */
export function Modal({
  open,
  onClose,
  title,
  maxWidthClassName = "max-w-md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Defaults to a compact dialog width; widen (e.g. "max-w-xl") for
   * content-rich panels like the feature demos. */
  maxWidthClassName?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="animate-fade-in absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        className={`animate-modal-pop relative w-full rounded-2xl bg-surface p-6 shadow-lifted ${maxWidthClassName}`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-faint transition-brand hover:bg-paper hover:text-ink"
        >
          <X weight="bold" className="size-4" />
        </button>
        <h2 id="modal-title" className="pr-8 text-xl font-bold text-ink">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-ink-soft">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
