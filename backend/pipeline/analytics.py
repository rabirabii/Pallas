from __future__ import annotations

from collections import Counter, defaultdict
from statistics import mean, median

from pipeline.speedhome.models import (
    AreaDataset,
    AreaMetadata,
    DataCompleteness,
    FairPriceStatus,
    Furnishing,
    FurnishingBreakdownItem,
    FurnishingPremium,
    MarketInsightSummary,
    ModeStatus,
    PriceSummary,
    PropertyListing,
    QualityReport,
    RentalTypeInfo,
)

def round_to_nearest_10(value: float) -> int:
    return int(round(value / 10) * 10)


def percentile(sorted_values: list[int], percent: float) -> float:
    if not sorted_values:
        raise ValueError("Cannot calculate percentile for empty values")

    if len(sorted_values) == 1:
        return float(sorted_values[0])

    index = (len(sorted_values) - 1) * percent
    lower_index = int(index)
    upper_index = min(lower_index + 1, len(sorted_values) - 1)
    weight = index - lower_index

    return sorted_values[lower_index] * (1 - weight) + sorted_values[upper_index] * weight

def nullable_round(value: float | None, digits: int = 2) -> float | None:
    if value is None:
        return None

    return round(value, digits)


def calculate_outlier_bounds(values: list[int]) -> tuple[float | None, float | None, float | None, float | None]:
    if len(values) < 2:
        return None, None, None, None

    sorted_values = sorted(values)
    q1 = percentile(sorted_values, 0.25)
    q3 = percentile(sorted_values, 0.75)

    if len(values) < 4:
        return q1, q3, None, None

    iqr = q3 - q1
    return q1, q3, q1 - 1.5 * iqr, q3 + 1.5 * iqr

def trimmed_mean(values: list[int], trim_ratio: float = 0.1) -> float:
    if not values:
        raise ValueError("Cannot calculate trimmed mean for empty values")

    sorted_values = sorted(values)
    trim_count = int(len(sorted_values) * trim_ratio)

    if trim_count == 0:
        return mean(sorted_values)

    trimmed = sorted_values[trim_count:-trim_count]
    if not trimmed:
        return mean(sorted_values)

    return mean(trimmed)


def calculate_mode(values: list[int]) -> tuple[int | None, ModeStatus, bool, list[int]]:
    if not values:
        return None, ModeStatus.INSUFFICIENT_DATA, False, []

    counts = Counter(values)
    highest_count = max(counts.values())

    if highest_count <= 1:
        return None, ModeStatus.NO_REPEATED_PRICE, False, []

    modes = sorted(value for value, count in counts.items() if count == highest_count)
    return modes[0], ModeStatus.AVAILABLE, len(modes) > 1, modes


def calculate_fair_price(values: list[int]) -> tuple[int | None, FairPriceStatus]:
    if len(values) < 3:
        return None, FairPriceStatus.INSUFFICIENT_DATA

    sorted_values = sorted(values)

    if len(sorted_values) < 4:
        return round_to_nearest_10(median(sorted_values)), FairPriceStatus.AVAILABLE

    q1 = percentile(sorted_values, 0.25)
    q3 = percentile(sorted_values, 0.75)
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr

    filtered = [
        value
        for value in sorted_values
        if lower_bound <= value <= upper_bound
    ]

    if not filtered:
        filtered = sorted_values

    filtered_median = median(filtered)
    filtered_trimmed_mean = trimmed_mean(filtered)
    fair_price = 0.5 * filtered_median + 0.5 * filtered_trimmed_mean

    return round_to_nearest_10(fair_price), FairPriceStatus.AVAILABLE


def data_confidence(valid_price_count: int) -> str:
    if valid_price_count <= 2:
        return "Very Low"
    if valid_price_count <= 4:
        return "Low"
    if valid_price_count <= 9:
        return "Moderate"
    return "Higher"


def calculate_average_size(listings: list[PropertyListing]) -> int | None:
    sizes = [
        listing.sizeSqft
        for listing in listings
        if listing.sizeSqft is not None and listing.sizeSqft > 0
    ]

    if not sizes:
        return None

    return round(mean(sizes))

def calculate_price_per_sqft_values(listings: list[PropertyListing]) -> list[float]:
    values: list[float] = []

    for listing in listings:
        if (
            listing.monthlyRentRM is not None
            and listing.sizeSqft is not None
            and listing.sizeSqft > 0
        ):
            values.append(listing.monthlyRentRM / listing.sizeSqft)

    return values

def summarize_segment(
    segment: str,
    listings: list[PropertyListing],
    total_listing_count: int | None = None,
) -> PriceSummary:
    prices = sorted(
        listing.monthlyRentRM
        for listing in listings
        if listing.monthlyRentRM is not None
    )

    mode, mode_status, multiple_modes, all_modes = calculate_mode(prices)
    fair_price, fair_price_status = calculate_fair_price(prices)

    average_price = round(mean(prices)) if prices else None
    median_price = round(median(prices)) if prices else None

    q1, q3, lower_bound, upper_bound = calculate_outlier_bounds(prices)
    outlier_count = (
        sum(price < lower_bound or price > upper_bound for price in prices)
        if lower_bound is not None and upper_bound is not None
        else 0
    )

    price_per_sqft_values = calculate_price_per_sqft_values(listings)

    mean_median_gap = (
        average_price - median_price
        if average_price is not None and median_price is not None
        else None
    )
    mean_median_gap_percentage = (
        round((mean_median_gap / median_price) * 100, 1)
        if mean_median_gap is not None and median_price
        else None
    )

    denominator = total_listing_count if total_listing_count is not None else len(listings)

    return PriceSummary(
        segment=segment,
        unitCount=len(listings),
        validPriceCount=len(prices),
        averageMonthlyRentRM=average_price,
        medianMonthlyRentRM=median_price,
        minimumMonthlyRentRM=min(prices) if prices else None,
        maximumMonthlyRentRM=max(prices) if prices else None,
        priceRangeRM=(max(prices) - min(prices)) if prices else None,
        q1MonthlyRentRM=round(q1) if q1 is not None else None,
        q3MonthlyRentRM=round(q3) if q3 is not None else None,
        iqrMonthlyRentRM=round(q3 - q1) if q1 is not None and q3 is not None else None,
        averageRentPerSqftRM=nullable_round(mean(price_per_sqft_values), 2)
        if price_per_sqft_values
        else None,
        medianRentPerSqftRM=nullable_round(median(price_per_sqft_values), 2)
        if price_per_sqft_values
        else None,
        outlierCount=outlier_count,
        lowerOutlierBoundRM=round(lower_bound) if lower_bound is not None else None,
        upperOutlierBoundRM=round(upper_bound) if upper_bound is not None else None,
        meanMedianGapRM=mean_median_gap,
        meanMedianGapPercentage=mean_median_gap_percentage,
        listingSharePercentage=percentage(len(listings), denominator),
        modeMonthlyRentRM=mode,
        modeStatus=mode_status,
        multipleModes=multiple_modes,
        allModes=all_modes,
        fairPriceRM=fair_price,
        fairPriceStatus=fair_price_status,
        averageSizeSqft=calculate_average_size(listings),
        dataConfidence=data_confidence(len(prices)),
    )

def summarize_listings(listings: list[PropertyListing]) -> list[PriceSummary]:
    grouped: dict[str, list[PropertyListing]] = defaultdict(list)

    for listing in listings:
        grouped[listing.segment].append(listing)

    preferred_order = [
        "Studio",
        "1BR",
        "2BR",
        "3BR",
        "4BR+",
        "Room - Small Shared",
        "Room - Medium Shared",
        "Room - Master Shared",
        "Room - Small Private",
        "Room - Medium Private",
        "Room - Master Private",
        "Unknown",
    ]

    summaries = [
        summarize_segment(segment, grouped[segment], total_listing_count=len(listings))
        for segment in preferred_order
        if segment in grouped
    ]

    remaining_segments = sorted(set(grouped) - set(preferred_order))
    summaries.extend(
        summarize_segment(segment, grouped[segment], total_listing_count=len(listings))
        for segment in remaining_segments
    )

    return summaries


def build_quality_report(listings: list[PropertyListing]) -> QualityReport:
    return QualityReport(
        missingPriceCount=sum("missing_price" in listing.dataQualityFlags for listing in listings),
        missingSizeCount=sum("missing_size" in listing.dataQualityFlags for listing in listings),
        unknownFurnishingCount=sum(listing.furnishing == Furnishing.UNKNOWN for listing in listings),
        warningCount=sum(len(listing.parseWarnings) + len(listing.dataQualityFlags) for listing in listings),
    )

def percentage(part: int, whole: int) -> float:
    if whole <= 0:
        return 0.0

    return round((part / whole) * 100, 1)


def build_data_completeness(listings: list[PropertyListing]) -> DataCompleteness:
    total = len(listings)

    price_count = sum(listing.monthlyRentRM is not None for listing in listings)
    size_count = sum(listing.sizeSqft is not None for listing in listings)
    furnishing_known_count = sum(
        listing.furnishing != Furnishing.UNKNOWN
        for listing in listings
    )

    return DataCompleteness(
        totalListings=total,
        priceCompletenessPercentage=percentage(price_count, total),
        sizeCompletenessPercentage=percentage(size_count, total),
        furnishingKnownPercentage=percentage(furnishing_known_count, total),
    )


def build_furnishing_breakdown(listings: list[PropertyListing]) -> list[FurnishingBreakdownItem]:
    total = len(listings)
    breakdown: list[FurnishingBreakdownItem] = []

    for furnishing in Furnishing:
        group = [
            listing
            for listing in listings
            if listing.furnishing == furnishing
        ]
        prices = sorted(
            listing.monthlyRentRM
            for listing in group
            if listing.monthlyRentRM is not None
        )

        breakdown.append(
            FurnishingBreakdownItem(
                furnishing=furnishing,
                listingCount=len(group),
                listingSharePercentage=percentage(len(group), total),
                medianMonthlyRentRM=round(median(prices)) if prices else None,
            )
        )

    return breakdown


def build_furnishing_premium(listings: list[PropertyListing]) -> FurnishingPremium:
    fully_furnished_prices = sorted(
        listing.monthlyRentRM
        for listing in listings
        if listing.furnishing == Furnishing.FULLY_FURNISHED
        and listing.monthlyRentRM is not None
    )
    unfurnished_prices = sorted(
        listing.monthlyRentRM
        for listing in listings
        if listing.furnishing == Furnishing.UNFURNISHED
        and listing.monthlyRentRM is not None
    )

    if len(fully_furnished_prices) < 3 or len(unfurnished_prices) < 3:
        return FurnishingPremium(
            available=False,
            fullyFurnishedMedianRM=round(median(fully_furnished_prices)) if fully_furnished_prices else None,
            unfurnishedMedianRM=round(median(unfurnished_prices)) if unfurnished_prices else None,
            premiumRM=None,
            premiumPercentage=None,
            reason="Insufficient fully furnished or unfurnished samples.",
        )

    fully_median = round(median(fully_furnished_prices))
    unfurnished_median = round(median(unfurnished_prices))
    premium_rm = fully_median - unfurnished_median

    return FurnishingPremium(
        available=True,
        fullyFurnishedMedianRM=fully_median,
        unfurnishedMedianRM=unfurnished_median,
        premiumRM=premium_rm,
        premiumPercentage=round((premium_rm / unfurnished_median) * 100, 1)
        if unfurnished_median > 0
        else None,
    )


def build_market_insights(listings: list[PropertyListing]) -> MarketInsightSummary:
    return MarketInsightSummary(
        dataCompleteness=build_data_completeness(listings),
        furnishingBreakdown=build_furnishing_breakdown(listings),
        furnishingPremium=build_furnishing_premium(listings),
    )

def build_area_dataset(
    area_name: str,
    area_slug: str,
    source_url: str,
    scraped_at: str,
    listings: list[PropertyListing],
) -> AreaDataset:
    valid_price_count = sum(1 for listing in listings if listing.monthlyRentRM is not None)

    return AreaDataset(
        metadata=AreaMetadata(
            areaName=area_name,
            areaSlug=area_slug,
            sourceUrl=source_url,
            scrapedAt=scraped_at,
            listingCount=len(listings),
            validPriceCount=valid_price_count,
            marketInsights=build_market_insights(listings),
        ),
        rentalTypes={
            "daily": RentalTypeInfo(
                available=False,
                reason="No explicit daily rental prices found.",
            ),
            "monthly": RentalTypeInfo(
                available=True,
                derived=False,
            ),
            "annual": RentalTypeInfo(
                available=True,
                derived=True,
                formula="monthlyRentRM * 12",
            ),
        },
        summaries=summarize_listings(listings),
        listings=listings,
        marketInsights=build_market_insights(listings),
        qualityReport=build_quality_report(listings),
    )