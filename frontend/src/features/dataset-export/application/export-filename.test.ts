import { describe, expect, it } from "vitest";

import {
  areaNameForFilename,
  exportFilename,
  snapshotDateForFilename,
} from "./export-filename";

describe("export filename", () => {
  it("formats snapshot dates", () => {
    expect(snapshotDateForFilename("2026-06-24T03:21:51.414076+00:00")).toBe(
      "20260624",
    );
  });

  it("formats area names", () => {
    expect(areaNameForFilename("Mont Kiara")).toBe("Mont_Kiara");
  });

  it("builds export filenames", () => {
    expect(
      exportFilename("Mont Kiara", "2026-06-24T00:00:00+00:00", "xlsx"),
    ).toBe("SPEEDHOME_Mont_Kiara_20260624.xlsx");
  });
});
