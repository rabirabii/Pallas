import { describe, expect, it } from "vitest";

import type { AreaDataset, PriceSummary } from "@/features/area-intelligence";

import { selectPrimarySummary } from "./select-primary-summary";

function summary(
  segment: string,
  validPriceCount: number,
  unitCount: number,
): PriceSummary {
  return {
    segment,
    unitCount,
    validPriceCount,
    averageMonthlyRentRM: null,
    medianMonthlyRentRM: null,
    minimumMonthlyRentRM: null,
    maximumMonthlyRentRM: null,
    priceRangeRM: null,
    q1MonthlyRentRM: null,
    q3MonthlyRentRM: null,
    iqrMonthlyRentRM: null,
    averageRentPerSqftRM: null,
    medianRentPerSqftRM: null,
    outlierCount: 0,
    lowerOutlierBoundRM: null,
    upperOutlierBoundRM: null,
    meanMedianGapRM: null,
    meanMedianGapPercentage: null,
    listingSharePercentage: 0,
    modeMonthlyRentRM: null,
    modeStatus: "no_repeated_price",
    multipleModes: false,
    allModes: [],
    fairPriceRM: null,
    fairPriceStatus: "insufficient_data",
    averageSizeSqft: null,
    dataConfidence: "Very Low",
  };
}

describe("selectPrimarySummary", () => {
  it("selects the segment with the largest valid price sample", () => {
    const dataset = {
      summaries: [
        summary("1BR", 3, 8),
        summary("2BR", 10, 10),
        summary("3BR", 6, 12),
      ],
    } as AreaDataset;

    expect(selectPrimarySummary(dataset)?.segment).toBe("2BR");
  });

  it("returns null when no segment has valid prices", () => {
    const dataset = {
      summaries: [summary("Unknown", 0, 3)],
    } as AreaDataset;

    expect(selectPrimarySummary(dataset)).toBeNull();
  });
});
