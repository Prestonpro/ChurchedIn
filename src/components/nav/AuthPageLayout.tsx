import Link from "next/link";
import { UsersThree, Quotes } from "@phosphor-icons/react/dist/ssr";

export function AuthPageLayout({
  children,
  panelTitle = "A church-by-church home base for hospitality.",
  panelBody = "Events, RSVPs, and friend connections — organized per church, so students always know where to find their people.",
}: {
  children: React.ReactNode;
  panelTitle?: string;
  panelBody?: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-700 bg-hero-mesh px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2 text-base font-bold">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/15">
            <UsersThree weight="fill" className="size-4.5" />
          </span>
          ChurchedIn
        </Link>
        <div className="max-w-md">
          <Quotes weight="fill" className="size-8 text-brand-300" />
          <h2 className="mt-4 text-3xl font-extrabold leading-tight">{panelTitle}</h2>
          <p className="mt-4 text-brand-100">{panelBody}</p>
        </div>
        <p className="text-xs text-brand-200">
          Contact info stays private until a friend accepts a connection.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <Link href="/" className="mb-8 flex items-center gap-2 text-base font-bold text-brand-700 lg:hidden">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-white">
            <UsersThree weight="fill" className="size-4.5" />
          </span>
          ChurchedIn
        </Link>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
