import { describe, expect, it } from "vitest";

import type { AreaDataset } from "@/features/area-intelligence";

import { buildLandingMarketIntelligence } from "./build-landing-market-intelligence";

function makeDataset(
  areaName: string,
  areaSlug: string,
  prices: Array<number | null>,
  segments: Array<{ segment: string; unitCount: number }> = [],
): AreaDataset {
  const listings = prices.map((price, index) => ({
    id: `${areaSlug}-${index}`,
    title: `${areaName} listing ${index}`,
    propertyName: areaName,
    areaName,
    areaSlug,
    segment: segments[0]?.segment ?? "Unknown",
    bedroomCount: null,
    bathroomCount: null,
    parkingCount: null,
    monthlyRentRM: price,
    annualRentRM: price && price > 0 ? price * 12 : null,
    annualRentIsDerived: price !== null && price > 0,
    dailyRentRM: null,
    dailyRentAvailability: "unavailable" as const,
    sizeSqft: 1000,
    furnishing: "Unknown" as const,
    minimumTenureMonths: null,
    moveInStatus: null,
    moveInDate: null,
    verified: null,
    zeroDeposit: null,
    sourceUrl: `https://speedhome.com/details/${areaSlug}-${index}`,
    sourcePage: 1,
    scrapedAt: "2026-06-24T00:00:00+00:00",
    parseWarnings: [],
    dataQualityFlags: [],
  }));

  return {
    metadata: {
      areaName,
      areaSlug,
      sourceUrl: `https://speedhome.com/rent/${areaSlug}`,
      scrapedAt: "2026-06-24T00:00:00+00:00",
      listingCount: prices.length,
      validPriceCount: prices.filter((price) => price !== null && price > 0)
        .length,
      currency: "MYR",
      sizeUnit: "sqft",
      dataMode: "snapshot",
      methodologyVersion: "1.0.0",
    },
    rentalTypes: {},
    summaries: segments.map((segment) => ({
      segment: segment.segment,
      unitCount: segment.unitCount,
      validPriceCount: segment.unitCount,
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
      modeStatus: "no_repeated_price" as const,
      multipleModes: false,
      allModes: [],
      fairPriceRM: null,
      fairPriceStatus: "insufficient_data" as const,
      averageSizeSqft: null,
      dataConfidence: "Very Low" as const,
    })),
    listings,
    marketInsights: {
      dataCompleteness: {
        totalListings: prices.length,
        priceCompletenessPercentage: 0,
        sizeCompletenessPercentage: 0,
        furnishingKnownPercentage: 0,
      },
      furnishingBreakdown: [],
      furnishingPremium: {
        available: false,
        fullyFurnishedMedianRM: null,
        unfurnishedMedianRM: null,
        premiumRM: null,
        premiumPercentage: null,
      },
    },
    qualityReport: {
      missingPriceCount: 0,
      missingSizeCount: 0,
      unknownFurnishingCount: 0,
      warningCount: 0,
    },
  };
}

describe("buildLandingMarketIntelligence", () => {
  it("aggregates totals and sorts area medians descending", () => {
    const intelligence = buildLandingMarketIntelligence(
      [
        makeDataset("Bangsar", "bangsar", [2000, 3000, 4000], [
          { segment: "2BR", unitCount: 3 },
        ]),
        makeDataset("KLCC", "klcc", [5000, 7000, 9000], [
          { segment: "1BR", unitCount: 3 },
        ]),
      ],
      "2026-06-24T00:00:00+00:00",
    );

    expect(intelligence.totalAreas).toBe(2);
    expect(intelligence.totalListings).toBe(6);
    expect(intelligence.generatedAt).toBe("2026-06-24T00:00:00+00:00");
    expect(intelligence.areas.map((area) => area.areaSlug)).toEqual([
      "klcc",
      "bangsar",
    ]);
    expect(intelligence.areas[0].medianMonthlyRentRM).toBe(7000);
    expect(intelligence.highestMedianArea).toEqual({
      areaName: "KLCC",
      medianMonthlyRentRM: 7000,
    });
  });

  it("excludes null, zero, and negative prices from medians and completeness", () => {
    const intelligence = buildLandingMarketIntelligence([
      makeDataset("Cheras", "cheras", [null, 0, -100, 2000, 3000], [
        { segment: "2BR", unitCount: 5 },
      ]),
    ]);

    expect(intelligence.areas[0].medianMonthlyRentRM).toBe(2500);
    expect(intelligence.areas[0].validPriceCount).toBe(2);
    expect(intelligence.priceCompletenessPercentage).toBe(40);
  });

  it("builds dominant segment and percentage", () => {
    const intelligence = buildLandingMarketIntelligence([
      makeDataset("A", "a", [1000, 2000], [
        { segment: "2BR", unitCount: 2 },
      ]),
      makeDataset("B", "b", [1000, 2000, 3000], [
        { segment: "2BR", unitCount: 1 },
        { segment: "3BR", unitCount: 2 },
      ]),
    ]);

    expect(intelligence.dominantSegment).toEqual({
      segment: "2BR",
      listingCount: 3,
      percentage: 60,
    });
  });

  it("handles empty datasets and unavailable analytical values", () => {
    const intelligence = buildLandingMarketIntelligence([]);

    expect(intelligence.totalAreas).toBe(0);
    expect(intelligence.totalListings).toBe(0);
    expect(intelligence.areas).toEqual([]);
    expect(intelligence.highestMedianArea).toBeNull();
    expect(intelligence.dominantSegment).toBeNull();
    expect(intelligence.priceCompletenessPercentage).toBeNull();
  });

  it("keeps areas without valid prices but excludes them from highest median", () => {
    const intelligence = buildLandingMarketIntelligence([
      makeDataset("No Price", "no-price", [null, 0], [
        { segment: "Unknown", unitCount: 2 },
      ]),
      makeDataset("With Price", "with-price", [1500, 2500], [
        { segment: "1BR", unitCount: 2 },
      ]),
    ]);

    expect(intelligence.areas.map((area) => area.areaSlug)).toEqual([
      "with-price",
      "no-price",
    ]);
    expect(intelligence.areas[1].medianMonthlyRentRM).toBeNull();
    expect(intelligence.highestMedianArea?.areaName).toBe("With Price");
  });
});
