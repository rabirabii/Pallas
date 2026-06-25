import type { PropertyListing } from "@/features/area-intelligence";

export type FilteredListingSummary = {
  listingCount: number;
  validPriceCount: number;
  medianMonthlyRentRM: number | null;
  minimumMonthlyRentRM: number | null;
  maximumMonthlyRentRM: number | null;
  averageRentPerSqftRM: number | null;
};

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return Math.round((total / values.length) * 100) / 100;
}

export function summarizeFilteredListings(
  listings: PropertyListing[],
): FilteredListingSummary {
  const prices = listings
    .map((listing) => listing.monthlyRentRM)
    .filter((price): price is number => price !== null);

  const rentsPerSqft = listings
    .filter(
      (listing) =>
        listing.monthlyRentRM !== null &&
        listing.sizeSqft !== null &&
        listing.sizeSqft > 0,
    )
    .map((listing) => listing.monthlyRentRM! / listing.sizeSqft!);

  return {
    listingCount: listings.length,
    validPriceCount: prices.length,
    medianMonthlyRentRM: median(prices),
    minimumMonthlyRentRM: prices.length > 0 ? Math.min(...prices) : null,
    maximumMonthlyRentRM: prices.length > 0 ? Math.max(...prices) : null,
    averageRentPerSqftRM: average(rentsPerSqft),
  };
}
