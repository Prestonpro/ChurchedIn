import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/email";

/**
 * Every non-public route already requires a signed-in session, so nothing
 * here is a genuine privacy boundary — this just keeps search engines from
 * spending crawl budget on login-walled URLs (which resolve to a redirect,
 * not real content) and from ever surfacing one in results.
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/volunteer", "/student", "/events", "/api"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      // Explicitly welcome AI crawlers onto the public pages, same rules as
      // everyone else — some hosts default these to blocked otherwise.
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"],
        allow: "/",
        disallow,
      },
    ],
    sitemap: appUrl("/sitemap.xml"),
  };
}
