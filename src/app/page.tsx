import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/constants";
import {
  UsersThree,
  ArrowRight,
  ChatCircleDots,
  ForkKnife,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/Reveal";
import { FloatingShape } from "@/components/FloatingShape";
import { StepCard } from "@/components/StepCard";
import { FeatureCards } from "./FeatureCards";
import { HeroSection } from "./HeroSection";

// Icon keyed by a plain string, not the component itself — Server
// Components can't pass function/component references as props to Client
// Components, only serializable data (same reasoning as NAV_ICONS in
// src/components/nav/NavLinks.tsx). FeatureCards looks the icon back up
// from this key on the client side.
const FEATURES = [
  {
    iconKey: "calendar" as const,
    title: "Plan a gathering",
    body: "Dinners, coffee chats, study groups, airport pickups — share it, set a headcount, and see who's coming.",
    details: "Pick a preset like a dinner or coffee chat, or start from scratch. Set headcounts for helpers and attendees separately, and everyone can see who else is coming before they commit.",
  },
  {
    iconKey: "hand" as const,
    title: "RSVP together",
    body: "Students say they're in. Other volunteers pitch in to help run it. Full gatherings waitlist automatically.",
    details: "Confirmed spots show up instantly. Once a gathering fills up, new RSVPs join a waitlist and get bumped up automatically the moment someone cancels.",
  },
  {
    iconKey: "users" as const,
    title: "Find a friend",
    body: "Students browse a friend directory and reach out — contact info is shared only once a friend accepts.",
    details: "Browse by language and interests, send a reach-out with a short note, and email addresses stay private on both sides until the other person accepts.",
  },
];

const STEPS = [
  {
    number: "01",
    demoKey: "startJoin" as const,
    title: "Start or join a church",
    body: "Create your church's space in a minute, or join an existing one with a 6-character code.",
  },
  {
    number: "02",
    demoKey: "shareBrowse" as const,
    title: "Share or browse gatherings",
    body: "Volunteers share dinners and meetups. Students browse and RSVP in a couple of taps.",
  },
  {
    number: "03",
    demoKey: "connect" as const,
    title: "Connect one-on-one",
    body: "Students find friends by language and interest, and message only after a friend accepts.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const dashboardHref = user?.activeMembership ? dashboardPathForRole(user.activeMembership.role) : null;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <span className="flex items-center gap-2 text-base font-bold text-brand-700">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
              <UsersThree weight="fill" className="size-4.5" />
            </span>
            <span className="hidden sm:inline">ChurchedIn</span>
          </span>
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            {user ? (
              <LinkButton href={dashboardHref ?? "/join"} size="sm" className="whitespace-nowrap">
                Dashboard <ArrowRight weight="bold" className="size-3.5" />
              </LinkButton>
            ) : (
              <>
                <Link
                  href="/login"
                  className="whitespace-nowrap rounded-xl px-2.5 py-2 font-medium text-ink-soft transition-brand hover:text-ink sm:px-3.5"
                >
                  Log in
                </Link>
                <LinkButton href="/signup" size="sm" className="whitespace-nowrap">
                  Start a church <ArrowRight weight="bold" className="size-3.5" />
                </LinkButton>
              </>
            )}
          </nav>
        </div>
      </header>

      <HeroSection />

      <section className="relative overflow-hidden">
        <FloatingShape position="-right-4 top-4" size="size-10" tone="bg-brand-300/35" scrollSpeed={0.04} />
        <div className="relative mx-auto max-w-6xl px-6 pb-24">
          <FeatureCards features={FEATURES} />
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-line bg-surface">
        <FloatingShape position="left-16 top-24" size="size-9" tone="bg-accent-300/35" delay="2s" scrollSpeed={-0.1} scrollMax={55} strong />
        <FloatingShape position="bottom-28 right-28" size="size-14" tone="bg-brand-300/35" delay="4s" scrollSpeed={0.14} scrollMax={55} strong />
        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <Reveal variant="left">
              <h2 className="text-3xl font-extrabold text-ink">People, doing this together</h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-2 text-ink-muted">Not a program to manage — just your church family, showing up for each other.</p>
            </Reveal>
          </div>
          <div className="grid items-stretch gap-8 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 100} className="h-full">
                <StepCard number={step.number} demoKey={step.demoKey} title={step.title} body={step.body} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <Reveal variant="icon">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <ChatCircleDots weight="fill" className="size-6" />
          </span>
        </Reveal>
        <Reveal variant="left" delay={100}>
          <h2 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">
            Contact info stays private until a friend says yes.
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p className="mx-auto mt-3 max-w-xl text-ink-soft">
            Every reach-out goes through an accept step first — no student or
            volunteer&apos;s email is ever shown before both sides have agreed
            to connect.
          </p>
        </Reveal>
      </section>

      <section className="relative overflow-hidden border-t border-line bg-surface">
        <FloatingShape position="right-28 top-20" size="size-8" tone="bg-brand-300/40" delay="1s" scrollSpeed={0.12} scrollMax={55} strong />
        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <Reveal variant="icon">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Sparkle weight="fill" className="size-6" />
            </span>
          </Reveal>
          <Reveal variant="left" delay={100}>
            <h2 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">
              You don&apos;t have to be a pastor.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-3 max-w-xl text-ink-soft">
              If you and a friend want to start welcoming international
              students, you can set it up together — no official title needed,
              just a willingness to open your door.
            </p>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-10 text-center text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <ForkKnife weight="fill" className="size-4" /> Made with love for church communities welcoming students far from home.
        </span>
        <p className="mt-3">
          <Link href="/privacy" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
}
