import type { LandingMarketIntelligence } from "../application/build-landing-market-intelligence";
import { AnalyticalObservations } from "./analytical-observations";
import { AreaMedianChart } from "./area-median-chart";

import { formatDate, formatNumber } from "@/shared/formatting/number-format";
import { SectionHeading } from "@/shared/ui/section-heading";

export function MarketPulse({
  intelligence,
}: {
  intelligence: LandingMarketIntelligence;
}) {
  return (
    <section className="border-y border-border py-6">
      <SectionHeading
        marker="I."
        eyebrow="Market Pulse"
        title="Current Rental Intelligence"
      >
        A cross-sectional preview of the current public listing snapshot.
      </SectionHeading>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <AreaMedianChart areas={intelligence.areas} />
        <AnalyticalObservations intelligence={intelligence} />
      </div>

      <div className="mt-7 border-t border-border pt-4 font-mono text-xs uppercase tracking-[0.12em] text-foreground-muted">
        <span>{String(intelligence.totalAreas).padStart(2, "0")} areas</span>
        <span className="mx-3 text-foreground-subtle">·</span>
        <span>{formatNumber(intelligence.totalListings)} listings</span>
        {intelligence.generatedAt ? (
          <>
            <span className="mx-3 text-foreground-subtle">·</span>
            <span>Generated {formatDate(intelligence.generatedAt)}</span>
          </>
        ) : null}
        <span className="mx-3 text-foreground-subtle">·</span>
        <span>Static snapshot</span>
      </div>
    </section>
  );
}
