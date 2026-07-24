"use client";

/**
 * Only renders if the root layout itself throws (font loading, a provider,
 * etc.) — everything else is caught by error.tsx. Next.js requires this to
 * render its own <html>/<body> since it replaces the root layout entirely,
 * so it deliberately doesn't import anything from layout.tsx that might be
 * what failed.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 1.5rem",
            background: "#f6f7fc",
            color: "#1a1a2e",
          }}
        >
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Something went wrong</h1>
          <p style={{ marginTop: "0.5rem", maxWidth: "24rem", color: "#666" }}>
            That&apos;s on us, not you. Try reloading the page.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#3243ab",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
