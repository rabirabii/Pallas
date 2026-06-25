import { ImageResponse } from "next/og";

export const alt = "PALLAS Malaysia Rental Market Intelligence";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#e7eaeb",
          color: "#202527",
          padding: 72,
          fontFamily: "Arial, sans-serif",
          border: "1px solid #87949a",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid #87949a",
            paddingBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 22,
                letterSpacing: 7,
                textTransform: "uppercase",
                color: "#60717b",
              }}
            >
              Property Analytics & Listing-Level Assessment System
            </div>
            <div
              style={{
                fontSize: 116,
                fontWeight: 900,
                letterSpacing: 8,
                lineHeight: 0.9,
              }}
            >
              PALLAS
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#7a3034",
              border: "1px solid #7a3034",
              padding: "14px 18px",
            }}
          >
            Static Snapshot
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              fontSize: 42,
              lineHeight: 1.2,
              maxWidth: 880,
            }}
          >
            Malaysia rental market intelligence from public listing snapshots.
          </div>
          <div
            style={{
              display: "flex",
              gap: 28,
              fontSize: 24,
              color: "#5e696f",
            }}
          >
            <span>4 areas</span>
            <span>150 listings</span>
            <span>No runtime scraping</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
