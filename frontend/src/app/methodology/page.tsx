import type { Metadata } from "next";

import { absoluteUrl, siteConfig } from "@/shared/config/site";
import { PageShell } from "@/shared/ui/page-shell";
import { SectionHeading } from "@/shared/ui/section-heading";
import { SiteContainer } from "@/shared/ui/site-container";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How PALLAS collects public rental listing snapshots, normalizes data, handles outliers, and calculates Fair Price.",
  alternates: {
    canonical: "/methodology",
  },
  openGraph: {
    type: "article",
    locale: siteConfig.locale,
    url: absoluteUrl("/methodology"),
    siteName: siteConfig.name,
    title: "PALLAS Methodology",
    description:
      "Data source, snapshot architecture, cleansing rules, Fair Price formula, and limitations.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PALLAS Methodology",
    description:
      "Data source, snapshot architecture, cleansing rules, Fair Price formula, and limitations.",
  },
};

const sections = [
  {
    marker: "I.",
    title: "Data Acquisition",
    body: [
      "PALLAS uses public SPEEDHOME rental listing snapshots as its source material. The backend pipeline includes a requests-based scraper that checks robots.txt, applies request delays, and refuses to bypass access controls.",
      "When automated requests return a Cloudflare challenge page, PALLAS does not bypass the challenge. For this snapshot, saved public HTML pages were parsed locally using the same parser and normalization pipeline.",
    ],
  },
  {
    marker: "II.",
    title: "Data Normalisation",
    body: [
      "Raw listing values are normalized into a canonical schema with deterministic listing IDs, canonical source URLs, monthly rent in MYR, unit size in sqft, bedroom counts, furnishing status, tenure fields, verification state, and data-quality flags.",
      "Missing values are preserved rather than silently dropped. Exact duplicate source URLs are deduplicated.",
    ],
  },
  {
    marker: "III.",
    title: "Rental Period Logic",
    body: [
      "Monthly rent is treated as the observed primary rental value when present in the source snapshot.",
      "Annual rent is derived as monthly rent multiplied by 12 and is explicitly labelled as derived. Daily rent is left unavailable unless explicitly observed in the source data.",
    ],
  },
  {
    marker: "IV.",
    title: "Statistical Measures",
    body: [
      "PALLAS calculates average, median, mode, minimum, maximum, price range, quartiles, IQR, average size, price per sqft, outlier counts, and sample-size confidence by unit segment.",
      "Mode is shown only when a price repeats. If all observed prices are unique, the mode state is reported as no repeated price.",
    ],
  },
  {
    marker: "V.",
    title: "Fair Price Method",
    body: [
      "Fair Price is a representative market estimate, not an official valuation. If fewer than three valid prices exist for a segment, Fair Price is suppressed.",
      "For three values, the median is used. For larger samples, PALLAS calculates Q1, Q3, and IQR, filters out prices outside the standard IQR bounds, then blends the filtered median and a trimmed mean before rounding to the nearest RM 10.",
    ],
  },
  {
    marker: "VI.",
    title: "Confidence and Data Quality",
    body: [
      "Confidence refers to sample size only, not appraisal certainty. A larger sample receives a stronger confidence label, but it does not guarantee price accuracy.",
      "Quality flags include missing price, missing size, missing furnishing, suspicious size, duplicate source URL, unavailable detail page, inconsistent bedroom values, and ambiguous room type.",
    ],
  },
  {
    marker: "VII.",
    title: "Limitations",
    body: [
      "The dataset is a static snapshot. SPEEDHOME listings can change after collection, and deployed PALLAS pages do not access SPEEDHOME at runtime.",
      "Area-level comparisons may contain different unit mixes. A higher median in one area does not imply identical property composition across areas.",
    ],
  },
];

export default function MethodologyPage() {
  return (
    <PageShell>
      <SiteContainer>
        <article className="py-14 sm:py-20">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-accent-dark">
            PALLAS / Technical Appendix
          </div>
          <h1 className="mt-5 font-serif text-6xl leading-none text-foreground sm:text-7xl">
            Methodology
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground-muted">
            How public rental listing snapshots are collected, normalized, and
            transformed into market intelligence.
          </p>

          <div className="mt-12 space-y-12">
            {sections.map((section) => (
              <section key={section.title}>
                <SectionHeading marker={section.marker} title={section.title} />
                <div className="mt-5 max-w-4xl space-y-4 text-base leading-8 text-foreground-muted">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-14 border-y border-border-strong py-6">
            <h2 className="font-serif text-3xl text-foreground">
              Attribution and Disclaimer
            </h2>
            <p className="mt-4 max-w-4xl text-base leading-8 text-foreground-muted">
              PALLAS is an independent portfolio project based on publicly
              available rental listing snapshots. It is not affiliated with or
              endorsed by SPEEDHOME or Jendela360. Prices are based on public
              listing snapshots and may change after collection.
            </p>
          </section>
        </article>
      </SiteContainer>
    </PageShell>
  );
}
