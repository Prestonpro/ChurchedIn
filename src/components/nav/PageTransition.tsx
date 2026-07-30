"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps AuthShell's <main> content, keyed by pathname — forces a fresh
 * mount (and so a replayed entrance animation) on every navigation, not
 * just the first page load, so every tab transitions in the same way
 * landing on /home does.
 */
export function PageTransition({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={`animate-fade-in ${className}`}>
      {children}
    </div>
  );
}
