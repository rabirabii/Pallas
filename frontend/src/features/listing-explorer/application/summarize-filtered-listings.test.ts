import { describe, expect, it } from "vitest";

import type { PropertyListing } from "@/features/area-intelligence";
import { summarizeFilteredListings } from "./summarize-filtered-listings";

function listing(
  monthlyRentRM: number | null,
  sizeSqft: number | null,
): PropertyListing {
  return {
    id: crypto.randomUUID(),
    title: "Listing",
    propertyName: "Property",
    areaName: "Mont Kiara",
    areaSlug: "mont-kiara",
    segment: "2BR",
    bedroomCount: 2,
    bathroomCount: 2,
    parkingCount: 1,
    monthlyRentRM,
    annualRentRM: monthlyRentRM === null ? null : monthlyRentRM * 12,
    annualRentIsDerived: monthlyRentRM !== null,
    dailyRentRM: null,
    dailyRentAvailability: "unavailable",
    sizeSqft,
    furnishing: "Fully Furnished",
    minimumTenureMonths: 12,
    moveInStatus: null,
    moveInDate: null,
    verified: true,
    zeroDeposit: null,
    sourceUrl: "https://speedhome.com/details/example",
    sourcePage: 1,
    scrapedAt: "2026-06-24T00:00:00+00:00",
    parseWarnings: [],
    dataQualityFlags: [],
  };
}

describe("summarize filtered listings", () => {
  it("summarizes prices and rent per sqft", () => {
    const summary = summarizeFilteredListings([
      listing(2500, 1000),
      listing(3000, 1000),
      listing(3500, 700),
    ]);

    expect(summary.listingCount).toBe(3);
    expect(summary.validPriceCount).toBe(3);
    expect(summary.medianMonthlyRentRM).toBe(3000);
    expect(summary.minimumMonthlyRentRM).toBe(2500);
    expect(summary.maximumMonthlyRentRM).toBe(3500);
    expect(summary.averageRentPerSqftRM).toBe(3.5);
  });

  it("handles missing prices", () => {
    const summary = summarizeFilteredListings([
      listing(null, 1000),
      listing(3000, null),
    ]);

    expect(summary.listingCount).toBe(2);
    expect(summary.validPriceCount).toBe(1);
    expect(summary.medianMonthlyRentRM).toBe(3000);
    expect(summary.averageRentPerSqftRM).toBeNull();
  });
});
