import { ImageResponse } from "next/og";

import bangsar from "../../../../public/data/areas/bangsar.json";
import cheras from "../../../../public/data/areas/cheras.json";
import klcc from "../../../../public/data/areas/klcc.json";
import montKiara from "../../../../public/data/areas/mont-kiara.json";

export const alt = "PALLAS area rental market intelligence";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const datasets = {
  bangsar,
  cheras,
  klcc,
  "mont-kiara": montKiara,
};

type AreaSlug = keyof typeof datasets;

function formatRM(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Not stated";
  }

  return `RM ${new Intl.NumberFormat("en-MY", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function primarySummary(slug: AreaSlug) {
  const dataset = datasets[slug];
  return [...dataset.summaries]
    .filter((summary) => summary.validPriceCount > 0)
    .sort(
      (a, b) =>
        b.validPriceCount - a.validPriceCount || b.unitCount - a.unitCount,
    )[0];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const safeSlug: AreaSlug = slug in datasets ? (slug as AreaSlug) : "bangsar";
  const dataset = datasets[safeSlug];
  const summary = primarySummary(safeSlug);

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
            borderBottom: "1px solid #87949a",
            paddingBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
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
              PALLAS / Market Record
            </div>
            <div
              style={{
                fontSize: 88,
                fontWeight: 900,
                lineHeight: 0.9,
              }}
            >
              {dataset.metadata.areaName}
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
              height: 52,
            }}
          >
            Snapshot
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 28,
          }}
        >
          {[
            ["Listings", dataset.metadata.listingCount],
            ["Valid Prices", dataset.metadata.validPriceCount],
            ["Median Rent", formatRM(summary?.medianMonthlyRentRM)],
            ["Fair Price", formatRM(summary?.fairPriceRM)],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                flex: 1,
                borderLeft: "2px solid #87949a",
                paddingLeft: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: "#60717b",
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 38,
                  fontWeight: 700,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#5e696f",
          }}
        >
          Segment rent comparison, listing explorer, data-quality indicators,
          and downloadable static dataset.
        </div>
      </div>
    ),
    size,
  );
}
