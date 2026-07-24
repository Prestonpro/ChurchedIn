import Link from "next/link";
import type { Metadata } from "next";
import { Buildings, XCircle } from "@phosphor-icons/react/dist/ssr";
import { getChurchByJoinCode } from "@/lib/queries";
import { AuthPageLayout } from "@/components/nav/AuthPageLayout";
import { JoinForm } from "./JoinForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const church = await getChurchByJoinCode(code);
  return { title: church ? `Join ${church.name}` : "Join a church" };
}

export default async function JoinWithCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const church = await getChurchByJoinCode(code);

  return (
    <AuthPageLayout
      panelTitle={church ? `Welcome to ${church.name}.` : "Codes are church-specific."}
      panelBody={
        church
          ? "Sign up below to RSVP to events and browse the mentor directory."
          : "Double-check the code with whoever shared it, or start your own church's space instead."
      }
    >
      {church ? (
        <>
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Buildings weight="fill" className="size-5.5" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">Join {church.name}</h1>
          {church.city && <p className="mt-1 text-sm text-ink-muted">{church.city}</p>}
          <div className="mt-8">
            <JoinForm code={church.joinCode} />
          </div>
        </>
      ) : (
        <>
          <span className="flex size-11 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <XCircle weight="fill" className="size-5.5" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">Code not found</h1>
          <p className="mt-2 text-sm text-ink-soft">
            &quot;{code}&quot; doesn&apos;t match any church. Double-check the code with
            whoever shared it with you.
          </p>
          <Link
            href="/join"
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline"
          >
            Try another code
          </Link>
        </>
      )}
    </AuthPageLayout>
  );
}
