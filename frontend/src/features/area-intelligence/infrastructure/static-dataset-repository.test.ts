import { describe, expect, it } from "vitest";

import { loadAreaDataset, loadAreaManifest } from "./static-dataset-repository";

describe("static dataset repository", () => {
  it("loads the area manifest", async () => {
    const manifest = await loadAreaManifest();

    expect(manifest.areas.length).toBeGreaterThanOrEqual(3);
    expect(manifest.areas.some((area) => area.slug === "mont-kiara")).toBe(
      true,
    );
  });

  it("loads an area dataset", async () => {
    const dataset = await loadAreaDataset("mont-kiara");

    expect(dataset?.metadata.areaSlug).toBe("mont-kiara");
    expect(dataset?.metadata.listingCount).toBeGreaterThan(0);
    expect(
      dataset?.marketInsights.dataCompleteness.totalListings,
    ).toBeGreaterThan(0);
  });

  it("returns null for unknown area slugs", async () => {
    const dataset = await loadAreaDataset("not-in-snapshot");

    expect(dataset).toBeNull();
  });
});
