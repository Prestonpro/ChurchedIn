// Glyph paths below are each platform's own official mark, not a third-party
// icon set's redraw: LinkedIn's "in" bug and Facebook's "f" bug are traced
// from Wikimedia Commons' PD-textlogo-tagged official assets (simple
// geometric/text logos below the threshold of copyright originality, still
// each platform's trademark — used here only to identify/link to the
// platform, the standard nominative use for a "visit my LinkedIn" icon).
// Instagram's camera-glyph is the same official mark on a background
// approximating Instagram's published brand gradient.
type Brand = "linkedin" | "facebook" | "instagram";

const BRAND_BACKGROUND: Record<Brand, string> = {
  linkedin: "bg-[#0A66C2]",
  facebook: "bg-[#0866FF]",
  instagram: "bg-gradient-to-br from-[#FEDA75] via-[#D62976] to-[#4F5BD5]",
};

function LinkedInGlyph() {
  return (
    <svg viewBox="0 0 72 72" className="size-[18px]" fill="currentColor" aria-hidden="true">
      <path d="M62,62 L51.315625,62 L51.315625,43.8021149 C51.315625,38.8127542 49.4197917,36.0245323 45.4707031,36.0245323 C41.1746094,36.0245323 38.9300781,38.9261103 38.9300781,43.8021149 L38.9300781,62 L28.6333333,62 L28.6333333,27.3333333 L38.9300781,27.3333333 L38.9300781,32.0029283 C38.9300781,32.0029283 42.0260417,26.2742151 49.3825521,26.2742151 C56.7356771,26.2742151 62,30.7644705 62,40.051212 L62,62 Z M16.349349,22.7940133 C12.8420573,22.7940133 10,19.9296567 10,16.3970067 C10,12.8643566 12.8420573,10 16.349349,10 C19.8566406,10 22.6970052,12.8643566 22.6970052,16.3970067 C22.6970052,19.9296567 19.8566406,22.7940133 16.349349,22.7940133 Z M11.0325521,62 L21.769401,62 L21.769401,27.3333333 L11.0325521,27.3333333 L11.0325521,62 Z" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 14222 14222" className="size-[18px]" fill="currentColor" aria-hidden="true">
      <path d="M9879 9167l315 -2056 -1972 0 0 -1334c0,-562 275,-1111 1159,-1111l897 0 0 -1750c0,0 -814,-139 -1592,-139 -1624,0 -2686,984 -2686,2767l0 1567 -1806 0 0 2056 1806 0 0 4969c362,57 733,86 1111,86 378,0 749,-30 1111,-86l0 -4969 1657 0z" />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 512 512" className="size-[18px]" fill="currentColor" aria-hidden="true">
      <path d="M256,49.471c67.266,0,75.233.257,101.8,1.469,24.562,1.121,37.9,5.224,46.778,8.674a78.052,78.052,0,0,1,28.966,18.845,78.052,78.052,0,0,1,18.845,28.966c3.45,8.877,7.554,22.216,8.674,46.778,1.212,26.565,1.469,34.532,1.469,101.8s-0.257,75.233-1.469,101.8c-1.121,24.562-5.225,37.9-8.674,46.778a83.427,83.427,0,0,1-47.811,47.811c-8.877,3.45-22.216,7.554-46.778,8.674-26.56,1.212-34.527,1.469-101.8,1.469s-75.237-.257-101.8-1.469c-24.562-1.121-37.9-5.225-46.778-8.674a78.051,78.051,0,0,1-28.966-18.845,78.053,78.053,0,0,1-18.845-28.966c-3.45-8.877-7.554-22.216-8.674-46.778-1.212-26.564-1.469-34.532-1.469-101.8s0.257-75.233,1.469-101.8c1.121-24.562,5.224-37.9,8.674-46.778A78.052,78.052,0,0,1,78.458,78.458a78.053,78.053,0,0,1,28.966-18.845c8.877-3.45,22.216-7.554,46.778-8.674,26.565-1.212,34.532-1.469,101.8-1.469m0-45.391c-68.418,0-77,.29-103.866,1.516-26.815,1.224-45.127,5.482-61.151,11.71a123.488,123.488,0,0,0-44.62,29.057A123.488,123.488,0,0,0,17.3,90.982C11.077,107.007,6.819,125.319,5.6,152.134,4.369,179,4.079,187.582,4.079,256S4.369,333,5.6,359.866c1.224,26.815,5.482,45.127,11.71,61.151a123.489,123.489,0,0,0,29.057,44.62,123.486,123.486,0,0,0,44.62,29.057c16.025,6.228,34.337,10.486,61.151,11.71,26.87,1.226,35.449,1.516,103.866,1.516s77-.29,103.866-1.516c26.815-1.224,45.127-5.482,61.151-11.71a128.817,128.817,0,0,0,73.677-73.677c6.228-16.025,10.486-34.337,11.71-61.151,1.226-26.87,1.516-35.449,1.516-103.866s-0.29-77-1.516-103.866c-1.224-26.815-5.482-45.127-11.71-61.151a123.486,123.486,0,0,0-29.057-44.62A123.487,123.487,0,0,0,421.018,17.3C404.993,11.077,386.681,6.819,359.866,5.6,333,4.369,324.418,4.079,256,4.079h0Z" />
      <path d="M256,126.635A129.365,129.365,0,1,0,385.365,256,129.365,129.365,0,0,0,256,126.635Zm0,213.338A83.973,83.973,0,1,1,339.974,256,83.974,83.974,0,0,1,256,339.973Z" />
      <circle cx="390.476" cy="121.524" r="30.23" />
    </svg>
  );
}

const BRAND_GLYPH: Record<Brand, () => React.JSX.Element> = {
  linkedin: LinkedInGlyph,
  facebook: FacebookGlyph,
  instagram: InstagramGlyph,
};

export function SocialIconLink({
  href,
  label,
  brand,
}: {
  href: string;
  label: string;
  brand: Brand;
}) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  const Glyph = BRAND_GLYPH[brand];
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-white transition-brand hover:opacity-85 ${BRAND_BACKGROUND[brand]}`}
    >
      <Glyph />
    </a>
  );
}
