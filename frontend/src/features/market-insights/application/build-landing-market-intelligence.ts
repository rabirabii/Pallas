import type { AreaDataset } from "@/features/area-intelligence";

export type LandingMarketIntelligence = {
  totalAreas: number;
  totalListings: number;
  generatedAt: string | null;
  areas: Array<{
    areaName: string;
    areaSlug: string;
    listingCount: number;
    validPriceCount: number;
    medianMonthlyRentRM: number | null;
  }>;
  highestMedianArea: {
    areaName: string;
    medianMonthlyRentRM: number;
  } | null;
  dominantSegment: {
    segment: string;
    listingCount: number;
    percentage: number;
  } | null;
  priceCompletenessPercentage: number | null;
};

function median(values: number[]): number | null {
  const sortedValues = values
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (sortedValues.length === 0) {
    return null;
  }

  const midpoint = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 1) {
    return sortedValues[midpoint];
  }

  return Math.round((sortedValues[midpoint - 1] + sortedValues[midpoint]) / 2);
}

function percentage(part: number, whole: number): number | null {
  if (whole <= 0) {
    return null;
  }

  return Math.round((part / whole) * 1000) / 10;
}

export function buildLandingMarketIntelligence(
  datasets: AreaDataset[],
  generatedAt: string | null = null,
): LandingMarketIntelligence {
  const totalListings = datasets.reduce(
    (sum, dataset) => sum + dataset.metadata.listingCount,
    0,
  );
  const validPriceCount = datasets.reduce(
    (sum, dataset) =>
      sum +
      dataset.listings.filter(
        (listing) =>
          listing.monthlyRentRM !== null &&
          Number.isFinite(listing.monthlyRentRM) &&
          listing.monthlyRentRM > 0,
      ).length,
    0,
  );
  const segmentCounts = new Map<string, number>();

  for (const dataset of datasets) {
    for (const summary of dataset.summaries) {
      segmentCounts.set(
        summary.segment,
        (segmentCounts.get(summary.segment) ?? 0) + summary.unitCount,
      );
    }
  }

  const areas = datasets
    .map((dataset) => {
      const prices = dataset.listings
        .map((listing) => listing.monthlyRentRM)
        .filter((value): value is number => value !== null && value > 0);

      return {
        areaName: dataset.metadata.areaName,
        areaSlug: dataset.metadata.areaSlug,
        listingCount: dataset.metadata.listingCount,
        validPriceCount: prices.length,
        medianMonthlyRentRM: median(prices),
      };
    })
    .sort((a, b) => {
      if (a.medianMonthlyRentRM === null && b.medianMonthlyRentRM === null) {
        return a.areaName.localeCompare(b.areaName);
      }

      if (a.medianMonthlyRentRM === null) {
        return 1;
      }

      if (b.medianMonthlyRentRM === null) {
        return -1;
      }

      return b.medianMonthlyRentRM - a.medianMonthlyRentRM;
    });

  const highestMedianArea =
    areas.find((area) => area.medianMonthlyRentRM !== null) ?? null;

  const dominantSegmentEntry = [...segmentCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0];

  return {
    totalAreas: datasets.length,
    totalListings,
    generatedAt,
    areas,
    highestMedianArea: highestMedianArea
      ? {
          areaName: highestMedianArea.areaName,
          medianMonthlyRentRM: highestMedianArea.medianMonthlyRentRM ?? 0,
        }
      : null,
    dominantSegment: dominantSegmentEntry
      ? {
          segment: dominantSegmentEntry[0],
          listingCount: dominantSegmentEntry[1],
          percentage: percentage(dominantSegmentEntry[1], totalListings) ?? 0,
        }
      : null,
    priceCompletenessPercentage: percentage(validPriceCount, totalListings),
  };
}
