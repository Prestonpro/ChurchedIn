export function Card({
  children,
  className = "",
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Adds hover-lift + border tint for cards that sit inside a clickable Link. */
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-6 shadow-card transition-brand ${
        interactive ? "hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lifted" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
