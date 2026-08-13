export function Card({
  children,
  className = "",
  interactive = false,
  style,
  id,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode;
  className?: string;
  /** Adds hover-lift + border tint for cards that sit inside a clickable Link. */
  interactive?: boolean;
  style?: React.CSSProperties;
  /** For anchor-linking to a specific card, e.g. from a dashboard stat card. */
  id?: string;
  /** For e2e specs to scope an interaction to one of several repeated
   * cards, when there's no unique visible text to key off of otherwise. */
  "data-testid"?: string;
}) {
  return (
    <div
      id={id}
      data-testid={dataTestId}
      // min-w-0 matters more than it looks: as a grid/flex item, a Card
      // defaults to min-width:auto, so it can't shrink below its content's
      // min-content width. One long unbreakable string inside (an email
      // address, typically) would widen the whole grid track and push every
      // sibling card off the side of a phone screen. p-5 on mobile so a
      // 390px viewport isn't spending 48px of its width on padding alone.
      className={`min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-card transition-brand sm:p-6 ${
        interactive ? "hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lifted" : ""
      } ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
