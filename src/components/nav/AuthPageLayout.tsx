import Link from "next/link";
import Image from "next/image";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

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
          <Image src="/icon-192.png" alt="" width={32} height={32} priority className="size-8 rounded-full" />
          ChurchedIn
        </Link>
        <div className="max-w-md">
          <Sparkle weight="fill" className="size-8 text-brand-300" />
          <h2 className="mt-4 text-3xl font-extrabold leading-tight">{panelTitle}</h2>
          <p className="mt-4 text-brand-100">{panelBody}</p>
        </div>
        <p className="text-xs text-brand-200">
          Plan gatherings, find a ride, and meet your church family.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <Link href="/" className="mb-8 flex items-center lg:hidden">
          <Image src="/logo-full.png" alt="ChurchedIn" width={1000} height={270} priority className="h-8 w-auto" />
        </Link>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
