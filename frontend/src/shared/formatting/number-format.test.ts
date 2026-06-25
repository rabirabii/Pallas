import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateTime,
  formatNullableText,
  formatNumber,
  formatPercentage,
  formatRM,
  formatSqft,
} from "./number-format";

describe("number formatting", () => {
  it("formats RM currency", () => {
    expect(formatRM(2500)).toBe("RM 2,500");
    expect(formatRM(null)).toBe("Not stated");
  });

  it("formats sqft", () => {
    expect(formatSqft(1050)).toBe("1,050 sqft");
    expect(formatSqft(undefined)).toBe("Not stated");
  });

  it("formats percentages", () => {
    expect(formatPercentage(41.7)).toBe("41.7%");
  });

  it("formats plain numbers", () => {
    expect(formatNumber(12000)).toBe("12,000");
  });

  it("formats dates", () => {
    expect(formatDate("2026-06-24T03:21:51.414076+00:00")).toContain("2026");
    expect(formatDateTime("bad-date")).toBe("Not stated");
  });

  it("formats nullable text", () => {
    expect(formatNullableText("Mont Kiara")).toBe("Mont Kiara");
    expect(formatNullableText("")).toBe("Not stated");
  });
});
