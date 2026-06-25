export function snapshotDateForFilename(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "snapshot";
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

export function areaNameForFilename(areaName: string): string {
  return areaName.trim().replace(/\s+/g, "_");
}

export function exportFilename(
  areaName: string,
  scrapedAt: string,
  extension: "json" | "csv" | "xlsx",
): string {
  return `SPEEDHOME_${areaNameForFilename(areaName)}_${snapshotDateForFilename(
    scrapedAt,
  )}.${extension}`;
}
