import type { AreaDataset, PriceSummary } from "@/features/area-intelligence";
import { formatPercentage, formatRM } from "@/shared/formatting/number-format";

function summaryWithMedian(summary: PriceSummary): summary is PriceSummary & {
  medianMonthlyRentRM: number;
} {
  return summary.medianMonthlyRentRM !== null;
}

export function buildAreaObservations(dataset: AreaDataset): string[] {
  const observations: string[] = [];

  const mostListedSegment = [...dataset.summaries].sort(
    (a, b) => b.unitCount - a.unitCount,
  )[0];

  if (mostListedSegment) {
    observations.push(
      `${mostListedSegment.segment} units represent ${formatPercentage(
        mostListedSegment.listingSharePercentage,
      )} of observed listings in ${dataset.metadata.areaName}.`,
    );
  }

  const summariesWithMedian = dataset.summaries.filter(summaryWithMedian);

  const highestMedian = [...summariesWithMedian].sort(
    (a, b) => b.medianMonthlyRentRM - a.medianMonthlyRentRM,
  )[0];

  const lowestMedian = [...summariesWithMedian].sort(
    (a, b) => a.medianMonthlyRentRM - b.medianMonthlyRentRM,
  )[0];

  if (
    highestMedian &&
    lowestMedian &&
    highestMedian.segment !== lowestMedian.segment
  ) {
    observations.push(
      `${highestMedian.segment} has the highest observed median rent at ${formatRM(
        highestMedian.medianMonthlyRentRM,
      )}, while ${lowestMedian.segment} is lowest at ${formatRM(
        lowestMedian.medianMonthlyRentRM,
      )}.`,
    );
  }

  const furnishingPremium = dataset.marketInsights.furnishingPremium;
  if (furnishingPremium.available && furnishingPremium.premiumRM !== null) {
    observations.push(
      `Fully furnished listings show a median premium of ${formatRM(
        furnishingPremium.premiumRM,
      )} (${formatPercentage(
        furnishingPremium.premiumPercentage,
      )}) over unfurnished listings.`,
    );
  }

  const completeness =
    dataset.marketInsights.dataCompleteness.priceCompletenessPercentage;

  observations.push(
    `${formatPercentage(completeness)} of observed listings contain a valid monthly rental price.`,
  );

  return observations.slice(0, 4);
}
