import { z } from "zod";

export const furnishingSchema = z.enum([
  "Fully Furnished",
  "Partially Furnished",
  "Unfurnished",
  "Unknown",
]);

export const dailyRentAvailabilitySchema = z.enum([
  "available",
  "unavailable",
  "unknown",
]);

export const modeStatusSchema = z.enum([
  "available",
  "no_repeated_price",
  "insufficient_data",
]);

export const fairPriceStatusSchema = z.enum(["available", "insufficient_data"]);

export const propertyListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  propertyName: z.string().nullable(),
  areaName: z.string(),
  areaSlug: z.string(),

  segment: z.string(),
  bedroomCount: z.number().nullable(),
  bathroomCount: z.number().nullable(),
  parkingCount: z.number().nullable(),

  monthlyRentRM: z.number().nullable(),
  annualRentRM: z.number().nullable(),
  annualRentIsDerived: z.boolean(),

  dailyRentRM: z.number().nullable(),
  dailyRentAvailability: dailyRentAvailabilitySchema,

  sizeSqft: z.number().nullable(),
  furnishing: furnishingSchema,

  minimumTenureMonths: z.number().nullable(),
  moveInStatus: z.string().nullable(),
  moveInDate: z.string().nullable(),

  verified: z.boolean().nullable(),
  zeroDeposit: z.boolean().nullable(),

  sourceUrl: z.string(),
  sourcePage: z.number(),
  scrapedAt: z.string(),

  parseWarnings: z.array(z.string()),
  dataQualityFlags: z.array(z.string()),
});

export const priceSummarySchema = z.object({
  segment: z.string(),
  unitCount: z.number(),
  validPriceCount: z.number(),

  averageMonthlyRentRM: z.number().nullable(),
  medianMonthlyRentRM: z.number().nullable(),

  minimumMonthlyRentRM: z.number().nullable(),
  maximumMonthlyRentRM: z.number().nullable(),
  priceRangeRM: z.number().nullable(),

  q1MonthlyRentRM: z.number().nullable(),
  q3MonthlyRentRM: z.number().nullable(),
  iqrMonthlyRentRM: z.number().nullable(),

  averageRentPerSqftRM: z.number().nullable(),
  medianRentPerSqftRM: z.number().nullable(),

  outlierCount: z.number(),
  lowerOutlierBoundRM: z.number().nullable(),
  upperOutlierBoundRM: z.number().nullable(),

  meanMedianGapRM: z.number().nullable(),
  meanMedianGapPercentage: z.number().nullable(),

  listingSharePercentage: z.number(),

  modeMonthlyRentRM: z.number().nullable(),
  modeStatus: modeStatusSchema,
  multipleModes: z.boolean(),
  allModes: z.array(z.number()),

  fairPriceRM: z.number().nullable(),
  fairPriceStatus: fairPriceStatusSchema,

  averageSizeSqft: z.number().nullable(),
  dataConfidence: z.enum(["Very Low", "Low", "Moderate", "Higher"]),
});

export const rentalTypeInfoSchema = z.object({
  available: z.boolean(),
  derived: z.boolean().nullable().optional(),
  formula: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
});

export const dataCompletenessSchema = z.object({
  totalListings: z.number(),
  priceCompletenessPercentage: z.number(),
  sizeCompletenessPercentage: z.number(),
  furnishingKnownPercentage: z.number(),
});

export const furnishingBreakdownItemSchema = z.object({
  furnishing: furnishingSchema,
  listingCount: z.number(),
  listingSharePercentage: z.number(),
  medianMonthlyRentRM: z.number().nullable(),
});

export const furnishingPremiumSchema = z.object({
  available: z.boolean(),
  fullyFurnishedMedianRM: z.number().nullable(),
  unfurnishedMedianRM: z.number().nullable(),
  premiumRM: z.number().nullable(),
  premiumPercentage: z.number().nullable(),
  reason: z.string().nullable().optional(),
});

export const marketInsightSummarySchema = z.object({
  dataCompleteness: dataCompletenessSchema,
  furnishingBreakdown: z.array(furnishingBreakdownItemSchema),
  furnishingPremium: furnishingPremiumSchema,
});

export const qualityReportSchema = z.object({
  missingPriceCount: z.number(),
  missingSizeCount: z.number(),
  unknownFurnishingCount: z.number(),
  warningCount: z.number(),
});

export const areaMetadataSchema = z.object({
  areaName: z.string(),
  areaSlug: z.string(),
  sourceUrl: z.string(),
  scrapedAt: z.string(),
  listingCount: z.number(),
  validPriceCount: z.number(),
  currency: z.literal("MYR"),
  sizeUnit: z.literal("sqft"),
  dataMode: z.literal("snapshot"),
  methodologyVersion: z.string(),
});

export const areaDatasetSchema = z.object({
  metadata: areaMetadataSchema,
  rentalTypes: z.record(z.string(), rentalTypeInfoSchema),
  summaries: z.array(priceSummarySchema),
  listings: z.array(propertyListingSchema),
  marketInsights: marketInsightSummarySchema,
  qualityReport: qualityReportSchema,
});

export const manifestAreaSchema = z.object({
  name: z.string(),
  slug: z.string(),
  sourceUrl: z.string(),
  listingCount: z.number(),
  scrapedAt: z.string(),
});

export const datasetManifestSchema = z.object({
  generatedAt: z.string(),
  areas: z.array(manifestAreaSchema),
});

export type PropertyListing = z.infer<typeof propertyListingSchema>;
export type PriceSummary = z.infer<typeof priceSummarySchema>;
export type RentalTypeInfo = z.infer<typeof rentalTypeInfoSchema>;
export type AreaDataset = z.infer<typeof areaDatasetSchema>;
export type DatasetManifest = z.infer<typeof datasetManifestSchema>;
export type ManifestArea = z.infer<typeof manifestAreaSchema>;
export type MarketInsightSummary = z.infer<typeof marketInsightSummarySchema>;
