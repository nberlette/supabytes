import { ImageResponse } from "@vercel/og";

export const runtime = "edge";
export const alt = "Supabytes secure file storage";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "radial-gradient(circle at top left, rgba(126, 91, 255, 0.25), transparent 34%), linear-gradient(135deg, #080815 0%, #10182f 55%, #1b2645 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            border: "1px solid rgba(148, 163, 184, 0.18)",
            borderRadius: "32px",
            background: "rgba(15, 23, 42, 0.72)",
            padding: "56px",
            gap: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "88px",
                  height: "88px",
                  borderRadius: "24px",
                  background: "#f8fafc",
                  color: "#0f172a",
                  fontSize: "44px",
                  fontWeight: 800,
                }}
              >
                S
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: "24px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "#a5b4fc",
                  }}
                >
                  Secure cloud storage
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "56px",
                    fontWeight: 800,
                    letterSpacing: "-0.04em",
                  }}
                >
                  Supabytes
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "22px",
                maxWidth: "720px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "72px",
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: "-0.05em",
                }}
              >
                Your files, protected and ready anywhere.
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "28px",
                  lineHeight: 1.45,
                  color: "#cbd5e1",
                }}
              >
                Upload, organize, and share files with a responsive dashboard built
                for speed, privacy, and modern collaboration.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              {["Share links", "Favorites", "Responsive dashboard", "PWA ready"]
                .map((label) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 22px",
                      borderRadius: "999px",
                      background: "rgba(99, 102, 241, 0.16)",
                      border: "1px solid rgba(165, 180, 252, 0.18)",
                      fontSize: "24px",
                      color: "#e2e8f0",
                    }}
                  >
                    {label}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
