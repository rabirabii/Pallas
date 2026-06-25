import { describe, expect, it } from "vitest";

import type { AreaDataset } from "@/features/area-intelligence";

import { buildAreaObservations } from "./build-area-observations";

describe("buildAreaObservations", () => {
  it("generates deterministic observations from dataset summaries", () => {
    const dataset = {
      metadata: {
        areaName: "Mont Kiara",
      },
      summaries: [
        {
          segment: "2BR",
          unitCount: 10,
          listingSharePercentage: 50,
          medianMonthlyRentRM: 2500,
        },
        {
          segment: "1BR",
          unitCount: 5,
          listingSharePercentage: 25,
          medianMonthlyRentRM: 1800,
        },
      ],
      marketInsights: {
        furnishingPremium: {
          available: true,
          premiumRM: 300,
          premiumPercentage: 15,
        },
        dataCompleteness: {
          priceCompletenessPercentage: 100,
        },
      },
    } as AreaDataset;

    const observations = buildAreaObservations(dataset);

    expect(observations[0]).toContain("2BR units represent 50.0%");
    expect(observations[1]).toContain(
      "2BR has the highest observed median rent",
    );
    expect(observations[2]).toContain("median premium of RM 300");
    expect(observations[3]).toContain("100.0%");
  });
});
