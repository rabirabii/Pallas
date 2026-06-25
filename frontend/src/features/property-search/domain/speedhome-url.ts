export type SpeedhomeUrlParseResult =
  | { ok: true; slug: string }
  | { ok: false; reason: string };

export function parseSpeedhomeRentUrl(input: string): SpeedhomeUrlParseResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, reason: "Enter an area name or SPEEDHOME rental URL." };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "Input is not a valid URL." };
  }

  if (
    url.hostname !== "speedhome.com" &&
    url.hostname !== "www.speedhome.com"
  ) {
    return { ok: false, reason: "URL must use speedhome.com." };
  }

  const pathParts = url.pathname.split("/").filter(Boolean);

  if (pathParts.length < 2 || pathParts[0] !== "rent") {
    return { ok: false, reason: "SPEEDHOME URL must use /rent/{area}." };
  }

  const slug = pathParts[1]?.toLowerCase();

  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, reason: "SPEEDHOME area slug is invalid." };
  }

  return { ok: true, slug };
}

export function looksLikeUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}
