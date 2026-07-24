import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/email";

/**
 * Every non-public route already requires a signed-in session, so nothing
 * here is a genuine privacy boundary — this just keeps search engines from
 * spending crawl budget on login-walled URLs (which resolve to a redirect,
 * not real content) and from ever surfacing one in results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/volunteer", "/student", "/events", "/api"],
    },
    sitemap: appUrl("/sitemap.xml"),
  };
}
