import { Compass } from "@phosphor-icons/react/dist/ssr";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Compass weight="duotone" className="size-7" />
      </span>
      <h1 className="mt-5 text-xl font-extrabold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        That page doesn&apos;t exist, or you may not have access to it.
      </p>
      <div className="mt-7">
        <LinkButton href="/home">Go home</LinkButton>
      </div>
    </div>
  );
}
