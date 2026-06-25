import { describe, expect, it } from "vitest";

import type { PropertyListing } from "@/features/area-intelligence";

import {
  defaultListingFilters,
  filterListings,
  uniqueFurnishings,
  uniqueSegments,
} from "./filter-listings";

function listing(overrides: Partial<PropertyListing>): PropertyListing {
  return {
    id: "1",
    title: "Residensi Example",
    propertyName: "Example Property",
    areaName: "Mont Kiara",
    areaSlug: "mont-kiara",
    segment: "2BR",
    bedroomCount: 2,
    bathroomCount: 2,
    parkingCount: 1,
    monthlyRentRM: 3000,
    annualRentRM: 36000,
    annualRentIsDerived: true,
    dailyRentRM: null,
    dailyRentAvailability: "unavailable",
    sizeSqft: 1000,
    furnishing: "Fully Furnished",
    minimumTenureMonths: 12,
    moveInStatus: null,
    moveInDate: null,
    verified: true,
    zeroDeposit: true,
    sourceUrl: "https://speedhome.com/details/example",
    sourcePage: 1,
    scrapedAt: "2026-06-24T00:00:00+00:00",
    parseWarnings: [],
    dataQualityFlags: [],
    ...overrides,
  };
}

const listings = [
  listing({
    id: "1",
    title: "Alpha Residence",
    segment: "2BR",
    monthlyRentRM: 3000,
    sizeSqft: 1000,
  }),
  listing({
    id: "2",
    title: "Beta Suite",
    segment: "1BR",
    monthlyRentRM: 1800,
    sizeSqft: 500,
    furnishing: "Partially Furnished",
    verified: false,
  }),
  listing({
    id: "3",
    title: "Gamma House",
    segment: "3BR",
    monthlyRentRM: 4500,
    sizeSqft: 1500,
    furnishing: "Unfurnished",
  }),
];

describe("filterListings", () => {
  it("filters by global search", () => {
    const result = filterListings(listings, {
      ...defaultListingFilters,
      globalSearch: "beta",
    });

    expect(result.map((item) => item.id)).toEqual(["2"]);
  });

  it("filters by segment and furnishing", () => {
    const result = filterListings(listings, {
      ...defaultListingFilters,
      segment: "3BR",
      furnishing: "Unfurnished",
    });

    expect(result.map((item) => item.id)).toEqual(["3"]);
  });

  it("filters by price and size ranges", () => {
    const result = filterListings(listings, {
      ...defaultListingFilters,
      minPrice: "2500",
      maxPrice: "3500",
      minSize: "900",
      maxSize: "1200",
    });

    expect(result.map((item) => item.id)).toEqual(["1"]);
  });

  it("filters verified listings", () => {
    const result = filterListings(listings, {
      ...defaultListingFilters,
      verifiedOnly: true,
    });

    expect(result.map((item) => item.id)).toEqual(["1", "3"]);
  });

  it("extracts unique filter options", () => {
    expect(uniqueSegments(listings)).toEqual(["1BR", "2BR", "3BR"]);
    expect(uniqueFurnishings(listings)).toEqual([
      "Fully Furnished",
      "Partially Furnished",
      "Unfurnished",
    ]);
  });
});
