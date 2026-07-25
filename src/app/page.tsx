import Link from "next/link";
import {
  UsersThree,
  ArrowRight,
  ShieldCheck,
  ChatCircleDots,
  ForkKnife,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui/Button";
import { FeatureCards } from "./FeatureCards";

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
  { number: "01", title: "Start or join a church", body: "Create your church's space in a minute, or join an existing one with a 6-character code." },
  { number: "02", title: "Share or browse gatherings", body: "Volunteers share dinners and meetups. Students browse and RSVP in a couple of taps." },
  { number: "03", title: "Connect one-on-one", body: "Students find friends by language and interest, and message only after a friend accepts." },
];

export default function LandingPage() {
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
            <Link
              href="/login"
              className="whitespace-nowrap rounded-xl px-2.5 py-2 font-medium text-ink-soft transition-brand hover:text-ink sm:px-3.5"
            >
              Log in
            </Link>
            <LinkButton href="/signup" size="sm" className="whitespace-nowrap">
              Start a church <ArrowRight weight="bold" className="size-3.5" />
            </LinkButton>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-hero-mesh">
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-20 text-center sm:pt-28">
          <span
            className="inline-flex animate-fade-up items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700"
            style={{ animationDelay: "0ms" }}
          >
            <ShieldCheck weight="fill" className="size-3.5" />
            Built for church-based international student ministry
          </span>
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
            <LinkButton href="/signup" size="lg">
              Start your church&apos;s space <ArrowRight weight="bold" className="size-4" />
            </LinkButton>
            <LinkButton href="/join" variant="secondary" size="lg">
              Join with a code
            </LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <FeatureCards features={FEATURES} />
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-ink">People, doing this together</h2>
            <p className="mt-2 text-ink-muted">Not a program to manage — just your church family, showing up for each other.</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number} className="relative">
                <span className="text-4xl font-extrabold text-brand-100">{step.number}</span>
                <h3 className="mt-2 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
          <ChatCircleDots weight="fill" className="size-6" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">
          Contact info stays private until a friend says yes.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          Every reach-out goes through an accept step first — no student or
          volunteer&apos;s email is ever shown before both sides have agreed
          to connect.
        </p>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Sparkle weight="fill" className="size-6" />
          </span>
          <h2 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">
            You don&apos;t have to be a pastor.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-soft">
            If you and a friend want to start welcoming international
            students, you can set it up together — no official title needed,
            just a willingness to open your door.
          </p>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-10 text-center text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <ForkKnife weight="fill" className="size-4" /> Made with love for church communities welcoming students far from home.
        </span>
      </footer>
    </div>
  );
}
