/**
 * Splits a comma-separated profile field (languages, interests, hobbies)
 * into short display tags. Shared by the Friends directory and the public
 * profile page so both surfaces are guaranteed to parse the same value the
 * same way, rather than trusting two separately-maintained copies to stay
 * in sync.
 */
export function tags(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
