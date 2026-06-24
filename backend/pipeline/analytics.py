from __future__ import annotations

from collections import Counter, defaultdict
from statistics import mean, median

from pipeline.speedhome.models import (
    AreaDataset,
    AreaMetadata,
    FairPriceStatus,
    Furnishing,
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


def summarize_segment(segment: str, listings: list[PropertyListing]) -> PriceSummary:
    prices = [
        listing.monthlyRentRM
        for listing in listings
        if listing.monthlyRentRM is not None
    ]

    mode, mode_status, multiple_modes, all_modes = calculate_mode(prices)
    fair_price, fair_price_status = calculate_fair_price(prices)

    return PriceSummary(
        segment=segment,
        unitCount=len(listings),
        validPriceCount=len(prices),
        averageMonthlyRentRM=round(mean(prices)) if prices else None,
        medianMonthlyRentRM=round(median(prices)) if prices else None,
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
        summarize_segment(segment, grouped[segment])
        for segment in preferred_order
        if segment in grouped
    ]

    remaining_segments = sorted(set(grouped) - set(preferred_order))
    summaries.extend(
        summarize_segment(segment, grouped[segment])
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
        qualityReport=build_quality_report(listings),
    )