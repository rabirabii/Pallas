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

export function AreaMarketOverview({
  dataset,
  compact = false,
  onExplainMetric,
}: {
  dataset: AreaDataset;
  compact?: boolean;
  onExplainMetric?: (metric: "fairPrice" | "confidence") => void;
}) {
  const primarySummary = selectPrimarySummary(dataset);

  return (
    <section className={compact ? "py-0" : "py-12"}>
      {compact ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-dark">
            Market Overview
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            Representative Snapshot
          </h2>
        </div>
      ) : (
        <SectionHeading
          marker="I."
          eyebrow="Market Overview"
          title="Representative Snapshot"
        >
          Primary metrics use the largest valid segment sample in this area.
        </SectionHeading>
      )}

      <div
        className={
          compact
            ? "mt-6 grid gap-5 sm:grid-cols-2"
            : "mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        }
      >
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

      {onExplainMetric ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onExplainMetric("fairPrice")}
            className="border border-border-strong px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-primary hover:text-primary"
          >
            Explain Fair Price
          </button>
          <button
            type="button"
            onClick={() => onExplainMetric("confidence")}
            className="border border-border-strong px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-primary hover:text-primary"
          >
            Explain Confidence
          </button>
        </div>
      ) : null}

      <div className="mt-6 border-y border-border py-4">
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

      {!compact ? (
        <p className="mt-4 text-sm text-foreground-muted">
          Confidence refers to sample size only, not appraisal certainty.
          Snapshot contains {formatNumber(dataset.metadata.listingCount)}{" "}
          listings.
        </p>
      ) : null}
    </section>
  );
}
