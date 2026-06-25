import type { ManifestArea } from "@/features/area-intelligence";

export type AreaSearchMatch = ManifestArea & {
  score: number;
  matchType: "exact" | "prefix" | "token" | "substring";
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[\s-]+/)
    .filter(Boolean);
}

export function searchAreas(
  areas: ManifestArea[],
  query: string,
  limit = 8,
): AreaSearchMatch[] {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return areas.slice(0, limit).map((area) => ({
      ...area,
      score: 0,
      matchType: "prefix",
    }));
  }

  const queryTokens = tokenize(normalizedQuery);
  const matches: AreaSearchMatch[] = [];

  for (const area of areas) {
    const normalizedName = normalize(area.name);
    const normalizedSlug = normalize(area.slug);
    const areaTokens = [...tokenize(area.name), ...tokenize(area.slug)];

    if (
      normalizedName === normalizedQuery ||
      normalizedSlug === normalizedQuery
    ) {
      matches.push({ ...area, score: 100, matchType: "exact" });
      continue;
    }

    if (
      normalizedName.startsWith(normalizedQuery) ||
      normalizedSlug.startsWith(normalizedQuery)
    ) {
      matches.push({ ...area, score: 80, matchType: "prefix" });
      continue;
    }

    if (
      queryTokens.every((token) =>
        areaTokens.some((areaToken) => areaToken.startsWith(token)),
      )
    ) {
      matches.push({ ...area, score: 60, matchType: "token" });
      continue;
    }

    if (
      normalizedName.includes(normalizedQuery) ||
      normalizedSlug.includes(normalizedQuery)
    ) {
      matches.push({ ...area, score: 40, matchType: "substring" });
    }
  }

  return matches
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function findAreaBySlug(
  areas: ManifestArea[],
  slug: string,
): ManifestArea | null {
  return areas.find((area) => area.slug === slug) ?? null;
}
