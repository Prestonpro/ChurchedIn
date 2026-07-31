import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/email";

/** Only the public marketing/auth pages — everything else requires a
 * session and is excluded from crawling via robots.ts. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/login", "/signup", "/join", "/forgot-password", "/privacy"];
  return paths.map((path) => ({
    url: appUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.5,
  }));
}
