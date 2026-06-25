import { describe, expect, it } from "vitest";

import type { ManifestArea } from "@/features/area-intelligence";

import { findAreaBySlug, searchAreas } from "./search-areas";

const areas: ManifestArea[] = [
  {
    name: "Mont Kiara",
    slug: "mont-kiara",
    sourceUrl: "https://speedhome.com/rent/mont-kiara",
    listingCount: 40,
    scrapedAt: "2026-06-24T00:00:00+00:00",
  },
  {
    name: "Bangsar",
    slug: "bangsar",
    sourceUrl: "https://speedhome.com/rent/bangsar",
    listingCount: 30,
    scrapedAt: "2026-06-24T00:00:00+00:00",
  },
  {
    name: "KLCC",
    slug: "klcc",
    sourceUrl: "https://speedhome.com/rent/klcc",
    listingCount: 40,
    scrapedAt: "2026-06-24T00:00:00+00:00",
  },
];

describe("search areas", () => {
  it("prioritizes exact matches", () => {
    const results = searchAreas(areas, "mont-kiara");

    expect(results[0]?.slug).toBe("mont-kiara");
    expect(results[0]?.matchType).toBe("exact");
  });

  it("supports prefix matches", () => {
    const results = searchAreas(areas, "Bang");

    expect(results[0]?.slug).toBe("bangsar");
    expect(results[0]?.matchType).toBe("prefix");
  });

  it("supports token matches", () => {
    const results = searchAreas(areas, "ki");

    expect(results[0]?.slug).toBe("mont-kiara");
  });

  it("finds areas by slug", () => {
    expect(findAreaBySlug(areas, "klcc")?.name).toBe("KLCC");
    expect(findAreaBySlug(areas, "unknown")).toBeNull();
  });
});
