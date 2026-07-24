import Link from "next/link";
import {
  CalendarPlus,
  HandHeart,
  UsersThree,
  ArrowRight,
  ShieldCheck,
  ChatCircleDots,
  ForkKnife,
} from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    icon: CalendarPlus,
    title: "Plan a gathering",
    body: "Dinners, coffee chats, study groups, airport pickups — share it, set a headcount, and see who's coming.",
  },
  {
    icon: HandHeart,
    title: "RSVP together",
    body: "Students say they're in. Other volunteers pitch in to help run it. Full gatherings waitlist automatically.",
  },
  {
    icon: UsersThree,
    title: "Find a friend",
    body: "Students browse a friend directory and reach out — contact info is shared only once a friend accepts.",
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
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="group">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-brand group-hover:bg-brand-600 group-hover:text-white">
                <Icon weight="duotone" className="size-6" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-ink">How it works</h2>
            <p className="mt-2 text-ink-muted">Three steps from signup to your first friend.</p>
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

      <footer className="border-t border-line px-6 py-10 text-center text-sm text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <ForkKnife weight="fill" className="size-4" /> Made with love for church communities welcoming students far from home.
        </span>
      </footer>
    </div>
  );
}
