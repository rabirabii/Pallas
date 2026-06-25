import type { PropertyListing } from "@/features/area-intelligence";

export type ListingFilters = {
  globalSearch: string;
  segment: string;
  furnishing: string;
  minPrice: string;
  maxPrice: string;
  minSize: string;
  maxSize: string;
  verifiedOnly: boolean;
};

export const defaultListingFilters: ListingFilters = {
  globalSearch: "",
  segment: "all",
  furnishing: "all",
  minPrice: "",
  maxPrice: "",
  minSize: "",
  maxSize: "",
  verifiedOnly: false,
};

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function includesText(
  value: string | null | undefined,
  query: string,
): boolean {
  return (value ?? "").toLowerCase().includes(query);
}

export function filterListings(
  listings: PropertyListing[],
  filters: ListingFilters,
): PropertyListing[] {
  const query = filters.globalSearch.trim().toLowerCase();
  const minPrice = parseOptionalNumber(filters.minPrice);
  const maxPrice = parseOptionalNumber(filters.maxPrice);
  const minSize = parseOptionalNumber(filters.minSize);
  const maxSize = parseOptionalNumber(filters.maxSize);

  return listings.filter((listing) => {
    if (query) {
      const matchesQuery =
        includesText(listing.title, query) ||
        includesText(listing.propertyName, query) ||
        includesText(listing.areaName, query) ||
        includesText(listing.segment, query) ||
        includesText(listing.furnishing, query);

      if (!matchesQuery) {
        return false;
      }
    }

    if (filters.segment !== "all" && listing.segment !== filters.segment) {
      return false;
    }

    if (
      filters.furnishing !== "all" &&
      listing.furnishing !== filters.furnishing
    ) {
      return false;
    }

    if (filters.verifiedOnly && listing.verified !== true) {
      return false;
    }

    if (
      minPrice !== null &&
      (listing.monthlyRentRM === null || listing.monthlyRentRM < minPrice)
    ) {
      return false;
    }

    if (
      maxPrice !== null &&
      (listing.monthlyRentRM === null || listing.monthlyRentRM > maxPrice)
    ) {
      return false;
    }

    if (
      minSize !== null &&
      (listing.sizeSqft === null || listing.sizeSqft < minSize)
    ) {
      return false;
    }

    if (
      maxSize !== null &&
      (listing.sizeSqft === null || listing.sizeSqft > maxSize)
    ) {
      return false;
    }

    return true;
  });
}

export function uniqueSegments(listings: PropertyListing[]): string[] {
  return [...new Set(listings.map((listing) => listing.segment))].sort();
}

export function uniqueFurnishings(listings: PropertyListing[]): string[] {
  return [...new Set(listings.map((listing) => listing.furnishing))].sort();
}
