import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only serves our own static logo SVG (public/logo-full.svg) — never
    // user-uploaded content — so the usual SVG/XSS concern doesn't apply.
    // Next blocks SVGs through its image loader by default regardless.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
