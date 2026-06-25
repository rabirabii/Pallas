import type { AreaDataset, PriceSummary } from "@/features/area-intelligence";
import {
  formatNumber,
  formatPercentage,
  formatRM,
  formatSqft,
} from "@/shared/formatting/number-format";
import { SectionHeading } from "@/shared/ui/section-heading";

function formatMode(summary: PriceSummary): string {
  if (summary.modeStatus === "no_repeated_price") {
    return "No repeated price";
  }

  if (summary.modeStatus === "insufficient_data") {
    return "Insufficient data";
  }

  return formatRM(summary.modeMonthlyRentRM);
}

function formatFairPrice(summary: PriceSummary): string {
  if (summary.fairPriceStatus === "insufficient_data") {
    return "Insufficient data";
  }

  return formatRM(summary.fairPriceRM);
}

export function PriceSummaryTable({
  dataset,
  compact = false,
}: {
  dataset: AreaDataset;
  compact?: boolean;
}) {
  return (
    <section className={compact ? "py-0" : "py-12"}>
      {compact ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-dark">
            Segment Intelligence
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            Price Summary by Unit Type
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">
            Fair Price is a representative market estimate based on the
            available sample. Confidence refers to sample size only.
          </p>
        </div>
      ) : (
        <SectionHeading
          marker="III."
          eyebrow="Segment Intelligence"
          title="Price Summary by Unit Type"
        >
          Fair Price is a representative market estimate based on the available
          sample. Confidence refers to sample size only.
        </SectionHeading>
      )}

      <div className="mt-8 overflow-x-auto border-y border-border-strong">
        <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Price summary grouped by unit segment for{" "}
            {dataset.metadata.areaName}
          </caption>
          <thead>
            <tr className="border-b border-border font-mono text-xs uppercase tracking-[0.12em] text-foreground-subtle">
              <th scope="col" className="px-3 py-4 font-semibold">
                Segment
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Units
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Share
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Average
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Median
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Mode
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Fair Price
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Range
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Avg Size
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody>
            {dataset.summaries.map((summary) => (
              <tr
                key={summary.segment}
                className="border-b border-border transition-colors hover:bg-surface/70"
              >
                <th
                  scope="row"
                  className="px-3 py-5 font-serif text-2xl font-semibold text-foreground"
                >
                  {summary.segment}
                </th>
                <td className="px-3 py-5 text-right font-mono">
                  {formatNumber(summary.unitCount)}
                </td>
                <td className="px-3 py-5 text-right font-mono">
                  {formatPercentage(summary.listingSharePercentage)}
                </td>
                <td className="px-3 py-5 text-right font-mono">
                  {formatRM(summary.averageMonthlyRentRM)}
                </td>
                <td className="px-3 py-5 text-right font-mono">
                  {formatRM(summary.medianMonthlyRentRM)}
                </td>
                <td className="px-3 py-5 text-right font-mono">
                  {formatMode(summary)}
                </td>
                <td className="px-3 py-5 text-right font-mono text-primary">
                  {formatFairPrice(summary)}
                </td>
                <td className="px-3 py-5 text-right font-mono">
                  {summary.priceRangeRM === null
                    ? "Not stated"
                    : formatRM(summary.priceRangeRM)}
                </td>
                <td className="px-3 py-5 text-right font-mono">
                  {formatSqft(summary.averageSizeSqft)}
                </td>
                <td className="px-3 py-5 text-right font-mono">
                  {summary.dataConfidence}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-foreground-muted">
        Daily rental data is not available unless explicitly observed in the
        source snapshot. Annual values are derived from monthly rent × 12.
      </p>
    </section>
  );
}
