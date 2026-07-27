"use client";

import { ShieldCheck, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui/Button";
import { MagneticButton } from "@/components/MagneticButton";
import { useMouseTracking } from "@/hooks/useMouseTracking";
import { useScrollOffset } from "@/hooks/useScrollOffset";

const BG_SHIFT = 10; // px — background mesh, slowest layer
const BADGE_SHIFT = 5; // px — badge, opposite direction from the background
const SHAPE_SHIFT = 14; // px — ambient shapes, a touch more than the background

// Small floating circles, purely decorative — varied size/position/delay so
// they read as organic drift, not a repeated pattern. `dir` flips which way
// a shape parallaxes relative to the cursor (some with it, some against).
const HERO_SHAPES = [
  { id: "s1", position: "left-[8%] top-[18%]", size: "size-16", tone: "bg-brand-300/40", delay: "0s", dir: 1 },
  { id: "s2", position: "right-[10%] top-[55%]", size: "size-11", tone: "bg-accent-300/35", delay: "1.5s", dir: -1 },
  { id: "s3", position: "right-[20%] top-[12%]", size: "size-8", tone: "bg-brand-300/35", delay: "3s", dir: 1 },
  { id: "s4", position: "left-[16%] top-[68%]", size: "size-9", tone: "bg-accent-300/40", delay: "4.5s", dir: -1 },
] as const;

/**
 * The landing hero, extracted from page.tsx (a Server Component) so it can
 * track the cursor for a barely-noticeable parallax: the background mesh
 * and the badge drift a few px in opposite directions, while the heading
 * and body text stay a perfectly still anchor layer.
 */
export function HeroSection() {
  const { ref, x, y, isHovering } = useMouseTracking<HTMLElement>();
  const scrollOffset = useScrollOffset(0.04, 30);
  const bgX = isHovering ? x * BG_SHIFT : 0;
  const bgY = isHovering ? y * BG_SHIFT : 0;
  const badgeX = isHovering ? -x * BADGE_SHIFT : 0;
  const badgeY = isHovering ? -y * BADGE_SHIFT : 0;

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div
        className="absolute -inset-6 bg-hero-mesh transition-transform duration-300 ease-out"
        style={{ transform: `translate(${bgX}px, ${bgY}px)` }}
      />

      {/* Ambient decorative shapes — pure warmth, not focal points. */}
      {HERO_SHAPES.map((shape) => (
        <div
          key={shape.id}
          aria-hidden
          className={`pointer-events-none absolute ${shape.position} transition-transform duration-300 ease-out`}
          style={{
            transform: `translate(${isHovering ? x * SHAPE_SHIFT * shape.dir : 0}px, ${(isHovering ? y * SHAPE_SHIFT * shape.dir : 0) + scrollOffset * shape.dir}px)`,
          }}
        >
          <div
            className={`${shape.size} animate-float-gentle rounded-full ${shape.tone}`}
            style={{ animationDelay: shape.delay }}
          />
        </div>
      ))}

      <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28">
        <div
          className="inline-block transition-transform duration-300 ease-out"
          style={{ transform: `translate(${badgeX}px, ${badgeY}px)` }}
        >
          <span
            className="inline-flex animate-fade-up items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700"
            style={{ animationDelay: "0ms" }}
          >
            <ShieldCheck weight="fill" className="size-3.5" />
            Built for church-based international student ministry
          </span>
        </div>
        <h1
          className="mt-6 animate-fade-up text-4xl font-extrabold tracking-tight text-ink sm:text-5xl md:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          Your church community,{" "}
          <span className="text-brand-600">gathered in one place</span>.
        </h1>
        <p
          className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-ink-soft"
          style={{ animationDelay: "160ms" }}
        >
          Volunteers plan dinners, coffee chats, and friend meetups. Other
          volunteers join in to help. International students RSVP and find
          a friend — all in one place, per church.
        </p>
        <div
          className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "240ms" }}
        >
          <MagneticButton>
            <LinkButton href="/signup" size="lg">
              Start your church&apos;s space <ArrowRight weight="bold" className="size-4" />
            </LinkButton>
          </MagneticButton>
          <MagneticButton>
            <LinkButton href="/join" variant="secondary" size="lg">
              Join with a code
            </LinkButton>
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
