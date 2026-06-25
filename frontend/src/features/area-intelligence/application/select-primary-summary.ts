import type { AreaDataset, PriceSummary } from "@/features/area-intelligence";

export function selectPrimarySummary(
  dataset: AreaDataset,
): PriceSummary | null {
  const summariesWithPrices = dataset.summaries.filter(
    (summary) => summary.validPriceCount > 0,
  );

  if (summariesWithPrices.length === 0) {
    return null;
  }

  return [...summariesWithPrices].sort(
    (a, b) =>
      b.validPriceCount - a.validPriceCount || b.unitCount - a.unitCount,
  )[0];
}
