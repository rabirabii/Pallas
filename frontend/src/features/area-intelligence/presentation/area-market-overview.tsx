import type { AreaDataset } from "@/features/area-intelligence";
import { selectPrimarySummary } from "@/features/area-intelligence/application/select-primary-summary";
import {
  formatNumber,
  formatPercentage,
  formatRM,
  formatSqft,
} from "@/shared/formatting/number-format";
import { MetricDisplay } from "@/shared/ui/metric-display";
import { SectionHeading } from "@/shared/ui/section-heading";

export function AreaMarketOverview({ dataset }: { dataset: AreaDataset }) {
  const primarySummary = selectPrimarySummary(dataset);

  return (
    <section className="py-12">
      <SectionHeading
        marker="I."
        eyebrow="Market Overview"
        title="Representative Snapshot"
      >
        Primary metrics use the largest valid segment sample in this area.
      </SectionHeading>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricDisplay
          label="Median Monthly Rent"
          value={formatRM(primarySummary?.medianMonthlyRentRM)}
          detail={
            primarySummary
              ? `${primarySummary.segment} segment`
              : "No valid price sample"
          }
          emphasis
        />
        <MetricDisplay
          label="Fair Price"
          value={formatRM(primarySummary?.fairPriceRM)}
          detail={
            primarySummary?.fairPriceStatus === "insufficient_data"
              ? "Insufficient data for Fair Price estimate."
              : "Representative market estimate"
          }
        />
        <MetricDisplay
          label="Average Size"
          value={formatSqft(primarySummary?.averageSizeSqft)}
          detail="Observed unit size"
        />
        <MetricDisplay
          label="Sample Confidence"
          value={primarySummary?.dataConfidence ?? "Not stated"}
          detail="Based on sample size only"
        />
      </div>

      <div className="mt-8 border-y border-border py-5">
        <div className="grid gap-4 font-mono text-sm text-foreground-muted sm:grid-cols-3">
          <div>
            <span className="block text-xs uppercase tracking-[0.14em] text-foreground-subtle">
              Price Completeness
            </span>
            <span className="mt-2 block text-foreground">
              {formatPercentage(
                dataset.marketInsights.dataCompleteness
                  .priceCompletenessPercentage,
              )}
            </span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-[0.14em] text-foreground-subtle">
              Size Completeness
            </span>
            <span className="mt-2 block text-foreground">
              {formatPercentage(
                dataset.marketInsights.dataCompleteness
                  .sizeCompletenessPercentage,
              )}
            </span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-[0.14em] text-foreground-subtle">
              Furnishing Known
            </span>
            <span className="mt-2 block text-foreground">
              {formatPercentage(
                dataset.marketInsights.dataCompleteness
                  .furnishingKnownPercentage,
              )}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-foreground-muted">
        Confidence refers to sample size only, not appraisal certainty. Snapshot
        contains {formatNumber(dataset.metadata.listingCount)} listings.
      </p>
    </section>
  );
}
