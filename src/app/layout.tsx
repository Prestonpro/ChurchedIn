import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const description =
  "Plan gatherings, coordinate rides, and connect international students with a friend at their church.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "ChurchedIn",
    template: "%s | ChurchedIn",
  },
  description,
  manifest: "/manifest.json",
  alternates: {
    canonical: "./",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChurchedIn",
  },
  openGraph: {
    type: "website",
    siteName: "ChurchedIn",
    title: "ChurchedIn",
    description,
    // No `images` here — src/app/opengraph-image.tsx generates a proper
    // 1200x630 social preview and Next.js wires it (and the twitter:image
    // fallback) into metadata automatically via the file convention.
  },
  twitter: {
    card: "summary_large_image",
    title: "ChurchedIn",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#409688",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
