import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "ChurchedIn — a church-by-church home base for hospitality";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The real app icon (church + community mark), not a placeholder shape —
// inlined as a data URI since Satori (next/og's renderer) needs an <img>
// src it can resolve synchronously, not a relative /public path.
const iconBase64 = readFileSync(join(process.cwd(), "public", "icon-192.png")).toString("base64");

/** Satori (next/og's renderer) doesn't know about next/font — the rest of
 * the app gets Plus Jakarta Sans self-hosted at build time via that, but
 * here the actual font file bytes have to be fetched and handed to
 * ImageResponse directly, or this renders in a generic system sans-serif
 * that looks nothing like the real site. This is the standard next/og +
 * Google Fonts pattern (see Vercel's own og-image examples). */
async function loadGoogleFont(weight: number): Promise<ArrayBuffer> {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@${weight}`)
  ).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error("Could not find a font source in the Google Fonts response");
  const response = await fetch(match[1]);
  return response.arrayBuffer();
}

export default async function OpengraphImage() {
  const [bold, medium] = await Promise.all([loadGoogleFont(800), loadGoogleFont(500)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#173f39",
          backgroundImage: "linear-gradient(135deg, #173f39 0%, #256056 55%, #327b6f 100%)",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${iconBase64}`}
          width={148}
          height={148}
          alt=""
          style={{ borderRadius: "50%", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}
        />
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 92,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          {/* #e3ab3b is --color-accent-500 from globals.css — Satori can't
              read Tailwind classes, so this has to stay a literal hex. */}
          Churched<span style={{ color: "#e3ab3b" }}>In</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 32,
            fontWeight: 500,
            color: "#c0e2dd",
          }}
        >
          Connecting international students with churches
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Plus Jakarta Sans", data: bold, weight: 800, style: "normal" },
        { name: "Plus Jakarta Sans", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
