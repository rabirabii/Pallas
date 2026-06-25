export type {
  AreaDataset,
  DatasetManifest,
  ManifestArea,
  MarketInsightSummary,
  PriceSummary,
  PropertyListing,
  RentalTypeInfo,
} from "./domain/contracts";

export {
  loadAreaDataset,
  loadAreaManifest,
} from "./infrastructure/static-dataset-repository";

export { MarketRegistry } from "./presentation/market-registry";
export { SnapshotLedger } from "./presentation/snapshot-ledger";
export { selectPrimarySummary } from "./application/select-primary-summary";
export { AreaMarketOverview } from "./presentation/area-market-overview";
export { RentalAvailability } from "./presentation/rental-availability";
export { PriceSummaryTable } from "./presentation/price-summary-table";
