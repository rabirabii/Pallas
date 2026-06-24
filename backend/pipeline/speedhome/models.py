from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class Furnishing(str, Enum):
    FULLY_FURNISHED = "Fully Furnished"
    PARTIALLY_FURNISHED = "Partially Furnished"
    UNFURNISHED = "Unfurnished"
    UNKNOWN = "Unknown"


class DailyRentAvailability(str, Enum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    UNKNOWN = "unknown"


class ModeStatus(str, Enum):
    AVAILABLE = "available"
    NO_REPEATED_PRICE = "no_repeated_price"
    INSUFFICIENT_DATA = "insufficient_data"


class FairPriceStatus(str, Enum):
    AVAILABLE = "available"
    INSUFFICIENT_DATA = "insufficient_data"


class RawListing(BaseModel):
    detail_url: str
    card_text: str | None = None
    property_name: str | None = None
    area: str | None = None
    monthly_price_text: str | None = None
    size_text: str | None = None
    bedroom_text: str | None = None
    bathroom_text: str | None = None
    parking_text: str | None = None
    verified_text: str | None = None
    zero_deposit_text: str | None = None
    move_in_text: str | None = None
    source_page: int
    parse_warnings: list[str] = Field(default_factory=list)


class RawListingDetail(BaseModel):
    source_url: str
    page_title: str | None = None
    listing_title: str | None = None
    property_name: str | None = None
    full_area_or_address: str | None = None
    monthly_price_text: str | None = None
    size_text: str | None = None
    bedroom_text: str | None = None
    bathroom_text: str | None = None
    parking_text: str | None = None
    furnishing_text: str | None = None
    minimum_tenure_text: str | None = None
    move_in_date_text: str | None = None
    property_type: str | None = None
    description: str | None = None
    parse_warnings: list[str] = Field(default_factory=list)


class ScrapedListing(BaseModel):
    area_name: str
    area_slug: str
    source_page: int
    list_page: RawListing
    detail_page: RawListingDetail | None = None
    scraped_at: datetime
    parse_warnings: list[str] = Field(default_factory=list)


class PropertyListing(BaseModel):
    id: str
    title: str
    propertyName: str | None
    areaName: str
    areaSlug: str

    segment: str
    bedroomCount: int | None
    bathroomCount: int | None
    parkingCount: int | None

    monthlyRentRM: int | None
    annualRentRM: int | None
    annualRentIsDerived: bool

    dailyRentRM: int | None
    dailyRentAvailability: DailyRentAvailability

    sizeSqft: int | None
    furnishing: Furnishing

    minimumTenureMonths: int | None
    moveInStatus: str | None
    moveInDate: str | None

    verified: bool | None
    zeroDeposit: bool | None

    sourceUrl: str
    sourcePage: int
    scrapedAt: str

    parseWarnings: list[str] = Field(default_factory=list)
    dataQualityFlags: list[str] = Field(default_factory=list)


class PriceSummary(BaseModel):
    segment: str
    unitCount: int
    validPriceCount: int

    averageMonthlyRentRM: int | None
    medianMonthlyRentRM: int | None

    modeMonthlyRentRM: int | None
    modeStatus: ModeStatus
    multipleModes: bool = False
    allModes: list[int] = Field(default_factory=list)

    fairPriceRM: int | None
    fairPriceStatus: FairPriceStatus

    averageSizeSqft: int | None
    dataConfidence: Literal["Very Low", "Low", "Moderate", "Higher"]

    minimumMonthlyRentRM: int | None
    maximumMonthlyRentRM: int | None
    priceRangeRM: int | None

    q1MonthlyRentRM: int | None
    q3MonthlyRentRM: int | None
    iqrMonthlyRentRM: int | None

    averageRentPerSqftRM: float | None
    medianRentPerSqftRM: float | None

    outlierCount: int
    lowerOutlierBoundRM: int | None
    upperOutlierBoundRM: int | None

    meanMedianGapRM: int | None
    meanMedianGapPercentage: float | None

    listingSharePercentage: float


class RentalTypeInfo(BaseModel):
    available: bool
    derived: bool | None = None
    formula: str | None = None
    reason: str | None = None


class QualityReport(BaseModel):
    missingPriceCount: int
    missingSizeCount: int
    unknownFurnishingCount: int
    warningCount: int


class AreaMetadata(BaseModel):
    areaName: str
    areaSlug: str
    sourceUrl: str
    scrapedAt: str
    listingCount: int
    validPriceCount: int
    currency: Literal["MYR"] = "MYR"
    sizeUnit: Literal["sqft"] = "sqft"
    dataMode: Literal["snapshot"] = "snapshot"
    methodologyVersion: str = "1.0.0"


class AreaDataset(BaseModel):
    metadata: AreaMetadata
    rentalTypes: dict[str, RentalTypeInfo]
    summaries: list[PriceSummary]
    listings: list[PropertyListing]
    marketInsights: MarketInsightSummary
    qualityReport: QualityReport


class ManifestArea(BaseModel):
    name: str
    slug: str
    sourceUrl: str
    listingCount: int
    scrapedAt: str


class DatasetManifest(BaseModel):
    generatedAt: str
    areas: list[ManifestArea]

class DataCompleteness(BaseModel):
    totalListings: int
    priceCompletenessPercentage: float
    sizeCompletenessPercentage: float
    furnishingKnownPercentage: float


class FurnishingBreakdownItem(BaseModel):
    furnishing: Furnishing
    listingCount: int
    listingSharePercentage: float
    medianMonthlyRentRM: int | None


class FurnishingPremium(BaseModel):
    available: bool
    fullyFurnishedMedianRM: int | None
    unfurnishedMedianRM: int | None
    premiumRM: int | None
    premiumPercentage: float | None
    reason: str | None = None


class MarketInsightSummary(BaseModel):
    dataCompleteness: DataCompleteness
    furnishingBreakdown: list[FurnishingBreakdownItem]
    furnishingPremium: FurnishingPremium