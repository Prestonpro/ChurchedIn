import type { Icon } from "@phosphor-icons/react";

const BRAND_BACKGROUND: Record<"linkedin" | "facebook" | "instagram", string> = {
  linkedin: "bg-[#0A66C2]",
  facebook: "bg-[#1877F2]",
  instagram: "bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5]",
};

export function SocialIconLink({
  href,
  icon: IconComponent,
  label,
  brand,
}: {
  href: string;
  icon: Icon;
  label: string;
  brand: "linkedin" | "facebook" | "instagram";
}) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-white transition-brand hover:opacity-85 ${BRAND_BACKGROUND[brand]}`}
    >
      <IconComponent weight="fill" className="size-[18px]" />
    </a>
  );
}
