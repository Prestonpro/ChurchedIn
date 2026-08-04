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
  icons: {
    icon: [
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
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "ChurchedIn",
    description,
    images: ["/icon-512.png"],
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
