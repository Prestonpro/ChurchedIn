import { ImageResponse } from "next/og";

export const alt = "ChurchedIn — a church-by-church home base for hospitality";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#173f39",
          backgroundImage: "linear-gradient(135deg, #173f39 0%, #256056 55%, #327b6f 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 84,
            height: 84,
            borderRadius: 24,
            backgroundColor: "#dff1ee",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "8px solid #327b6f",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          ChurchedIn
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 34,
            fontWeight: 500,
            color: "#c0e2dd",
            maxWidth: 900,
          }}
        >
          Plan gatherings, coordinate rides, and connect international students with a friend at their church.
        </div>
      </div>
    ),
    { ...size },
  );
}
