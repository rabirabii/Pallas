import { describe, expect, it } from "vitest";

import { looksLikeUrl, parseSpeedhomeRentUrl } from "./speedhome-url";

describe("speedhome url parsing", () => {
  it("extracts area slugs from SPEEDHOME rent URLs", () => {
    expect(
      parseSpeedhomeRentUrl("https://speedhome.com/rent/mont-kiara"),
    ).toEqual({
      ok: true,
      slug: "mont-kiara",
    });

    expect(
      parseSpeedhomeRentUrl("https://www.speedhome.com/rent/bangsar?page=2"),
    ).toEqual({
      ok: true,
      slug: "bangsar",
    });
  });

  it("rejects invalid URLs", () => {
    expect(
      parseSpeedhomeRentUrl("https://example.com/rent/mont-kiara").ok,
    ).toBe(false);
    expect(
      parseSpeedhomeRentUrl("https://speedhome.com/details/example").ok,
    ).toBe(false);
  });

  it("detects URL-looking input", () => {
    expect(looksLikeUrl("https://speedhome.com/rent/klcc")).toBe(true);
    expect(looksLikeUrl("Mont Kiara")).toBe(false);
  });
});
