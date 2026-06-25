import type { PropertyListing } from "@/features/area-intelligence";

const headers = [
  "Listing Title",
  "Property Name",
  "Area",
  "Segment",
  "Bedrooms",
  "Bathrooms",
  "Parking",
  "Monthly Rent RM",
  "Annual Rent RM",
  "Annual Derived",
  "Size Sqft",
  "Furnishing",
  "Minimum Tenure Months",
  "Verified",
  "Zero Deposit",
  "Quality Flags",
  "Source URL",
];

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = Array.isArray(value) ? value.join(", ") : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function listingToExportRow(listing: PropertyListing) {
  return {
    "Listing Title": listing.title,
    "Property Name": listing.propertyName,
    Area: listing.areaName,
    Segment: listing.segment,
    Bedrooms: listing.bedroomCount,
    Bathrooms: listing.bathroomCount,
    Parking: listing.parkingCount,
    "Monthly Rent RM": listing.monthlyRentRM,
    "Annual Rent RM": listing.annualRentRM,
    "Annual Derived": listing.annualRentIsDerived,
    "Size Sqft": listing.sizeSqft,
    Furnishing: listing.furnishing,
    "Minimum Tenure Months": listing.minimumTenureMonths,
    Verified: listing.verified,
    "Zero Deposit": listing.zeroDeposit,
    "Quality Flags": listing.dataQualityFlags.join(", "),
    "Source URL": listing.sourceUrl,
  };
}

export function listingsToCsv(listings: PropertyListing[]): string {
  const rows = listings.map(listingToExportRow);

  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => csvEscape(row[header as keyof typeof row]))
        .join(","),
    ),
  ].join("\n");
}

export function listingsToSheetRows(listings: PropertyListing[]) {
  return listings.map(listingToExportRow);
}
