import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const LAST_UPDATED = "July 31, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center">
            <Image src="/icon-192.png" alt="ChurchedIn" width={32} height={32} priority className="size-8 shrink-0 rounded-full sm:hidden" />
            <Image src="/logo-full.svg" alt="ChurchedIn" width={161} height={43} priority className="hidden h-8 w-auto sm:block" />
          </Link>
          <Link
            href="/"
            className="whitespace-nowrap rounded-xl px-2.5 py-2 text-sm font-medium text-ink-soft transition-brand hover:text-ink sm:px-3.5"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-ink-soft">
          <section>
            <p>
              ChurchedIn (&quot;ChurchedIn,&quot; &quot;we,&quot; &quot;us&quot;) helps churches run
              events, coordinate rides, and match international students with volunteer friends. This
              policy explains what information we collect, how we use it, and the choices you have. By
              using ChurchedIn, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Information we collect</h2>
            <p className="mt-3">We collect information you provide directly, including:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <span className="font-semibold text-ink">Account details</span>: your name, email
                address, profile photo, and password (stored as a secure hash), or your Google account
                identifier if you sign in with Google.
              </li>
              <li>
                <span className="font-semibold text-ink">Profile information</span>: for students, this
                may include country of origin, school, major, graduation year, languages, hobbies,
                interests, and career goals; for volunteers, job, company, industry, languages, hobbies,
                and interests. All of this is optional beyond what your church requires.
              </li>
              <li>
                <span className="font-semibold text-ink">Activity within your church</span>: events you
                create or RSVP to, ride requests and offers, friend connection requests, and messages
                exchanged as part of arranging a connection.
              </li>
              <li>
                <span className="font-semibold text-ink">Safety reports</span>: if you report or block
                another member, we keep a record of that action and any details you provide, to help
                church admins moderate their community.
              </li>
            </ul>
            <p className="mt-3">
              We also automatically collect a small amount of technical information (such as a session
              cookie used to keep you signed in) needed to operate the service securely.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">How we use this information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>To operate core features: events, RSVPs, ride coordination, and friend matching.</li>
              <li>To let church admins manage their church&apos;s members, events, and join codes.</li>
              <li>To send account-related emails, such as event reminders and password resets.</li>
              <li>To keep the community safe, including reviewing reports and enforcing blocks.</li>
              <li>To maintain and improve the reliability and security of the app.</li>
            </ul>
            <p className="mt-3">We do not sell your personal information, and we do not use it for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Who can see your information</h2>
            <p className="mt-3">
              Your profile and activity are visible only within your own church. ChurchedIn is scoped so
              that members of one church cannot see another church&apos;s members or events. Contact
              information, such as your email address, is never shown to another member until you both
              agree to connect (for example, by accepting a friend connection request). Church admins can
              see their church&apos;s member list and event activity in order to manage their community.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Third-party services</h2>
            <p className="mt-3">We rely on a small number of service providers to run ChurchedIn:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <span className="font-semibold text-ink">Neon</span> (PostgreSQL hosting) stores our
                database.
              </li>
              <li>
                <span className="font-semibold text-ink">Vercel</span> hosts the application and serverless
                functions.
              </li>
              <li>
                <span className="font-semibold text-ink">Resend</span> delivers transactional emails, such
                as event reminders and password resets.
              </li>
              <li>
                <span className="font-semibold text-ink">Google</span> provides optional &quot;Sign in with
                Google&quot; authentication, if you choose to use it.
              </li>
            </ul>
            <p className="mt-3">
              These providers process data only as needed to provide their service to us and are not
              permitted to use your information for their own purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Data retention</h2>
            <p className="mt-3">
              We keep your information for as long as your account is active. If you&apos;d like your
              account and associated data deleted, contact your church admin or reach out to us directly
              (see below), and we will remove it except where we&apos;re required to keep it, for example,
              open safety reports involving your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Your choices</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>You can review and edit your profile at any time from your account.</li>
              <li>You can block another member, which prevents further contact between you.</li>
              <li>You can ask us to export or delete your data by contacting us.</li>
              <li>Most profile fields are optional. You only need to share what your church requires.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Children&apos;s privacy</h2>
            <p className="mt-3">
              ChurchedIn is intended for adults coordinating church events, rides, and friendship, and is
              not directed at children under 13. We do not knowingly collect information from children
              under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Changes to this policy</h2>
            <p className="mt-3">
              We may update this policy from time to time. If we make material changes, we&apos;ll update
              the &quot;last updated&quot; date above, and where appropriate, let churches know directly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-ink">Contact us</h2>
            <p className="mt-3">
              Questions about this policy or your data? Reach out to your church admin.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-line px-6 py-10 text-center text-sm text-ink-muted">
        <Link href="/" className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
          Back to ChurchedIn
        </Link>
      </footer>
    </div>
  );
}
