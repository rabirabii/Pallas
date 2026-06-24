from __future__ import annotations

import re
from collections import Counter

from pipeline.speedhome.models import (
    DailyRentAvailability,
    Furnishing,
    PropertyListing,
    ScrapedListing,
)
from pipeline.utils import canonicalize_detail_url, make_listing_id, normalize_whitespace


ROOM_SEGMENT_KEYWORDS = [
    ("small shared", "Room - Small Shared"),
    ("medium shared", "Room - Medium Shared"),
    ("master shared", "Room - Master Shared"),
    ("small private", "Room - Small Private"),
    ("medium private", "Room - Medium Private"),
    ("master private", "Room - Master Private"),
    ("master bedroom", "Room - Master Private"),
]


def parse_int(value: str | None) -> int | None:
    if value is None:
        return None

    match = re.search(r"\d[\d,]*", value)
    if not match:
        return None

    return int(match.group(0).replace(",", ""))


def parse_price_rm(value: str | None) -> int | None:
    return parse_int(value)


def parse_size_sqft(value: str | None) -> int | None:
    return parse_int(value)


def parse_count(value: str | None) -> int | None:
    if value is None:
        return None

    if re.search(r"\bstudio\b", value, flags=re.IGNORECASE):
        return 0

    parsed = parse_int(value)
    if parsed is None:
        return None

    if parsed < 0 or parsed > 20:
        return None

    return parsed


def normalize_furnishing(value: str | None) -> Furnishing:
    if not value:
        return Furnishing.UNKNOWN

    lowered = value.lower()

    if "fully furnished" in lowered:
        return Furnishing.FULLY_FURNISHED
    if "partially furnished" in lowered:
        return Furnishing.PARTIALLY_FURNISHED
    if "unfurnished" in lowered:
        return Furnishing.UNFURNISHED

    return Furnishing.UNKNOWN


def parse_boolean_flag(value: str | None) -> bool | None:
    if value is None:
        return None

    lowered = value.lower()
    if lowered in {"true", "yes", "1"}:
        return True
    if lowered in {"false", "no", "0"}:
        return False

    return True


def parse_minimum_tenure_months(value: str | None) -> int | None:
    return parse_int(value)


def classify_segment(
    title: str | None,
    description: str | None,
    bedroom_count: int | None,
) -> tuple[str, list[str]]:
    warnings: list[str] = []
    haystack = f"{title or ''} {description or ''}".lower()

    for keyword, segment in ROOM_SEGMENT_KEYWORDS:
        if keyword in haystack:
            return segment, warnings

    if "room" in haystack and bedroom_count is None:
        warnings.append("ambiguous_room_type")
        return "Unknown", warnings

    if bedroom_count == 0:
        return "Studio", warnings
    if bedroom_count == 1:
        return "1BR", warnings
    if bedroom_count == 2:
        return "2BR", warnings
    if bedroom_count == 3:
        return "3BR", warnings
    if bedroom_count is not None and bedroom_count >= 4:
        return "4BR+", warnings

    return "Unknown", warnings


def _choose_detail_or_list_value(detail_value: str | None, list_value: str | None) -> str | None:
    return detail_value if detail_value not in {None, ""} else list_value


def _quality_flags(
    monthly_rent_rm: int | None,
    size_sqft: int | None,
    furnishing: Furnishing,
    bedroom_text: str | None,
    bedroom_count: int | None,
    duplicate: bool,
    segment_warnings: list[str],
    detail_missing: bool,
) -> list[str]:
    flags: list[str] = []

    if monthly_rent_rm is None:
        flags.append("missing_price")
    if size_sqft is None:
        flags.append("missing_size")
    elif size_sqft < 100:
        flags.append("suspicious_size")
    if furnishing == Furnishing.UNKNOWN:
        flags.append("missing_furnishing")
    if duplicate:
        flags.append("duplicate_source_url")
    if bedroom_text and bedroom_count is None and re.search(r"\d", bedroom_text):
        flags.append("inconsistent_bedroom_value")
    if detail_missing:
        flags.append("detail_page_unavailable")

    flags.extend(segment_warnings)

    return list(dict.fromkeys(flags))


def normalize_listing(scraped: ScrapedListing, duplicate: bool = False) -> PropertyListing:
    raw = scraped.list_page
    detail = scraped.detail_page

    title = _choose_detail_or_list_value(
        detail.listing_title if detail else None,
        raw.property_name,
    )
    title = normalize_whitespace(title) or "Untitled SPEEDHOME listing"

    property_name = _choose_detail_or_list_value(
        detail.property_name if detail else None,
        raw.property_name,
    )
    property_name = normalize_whitespace(property_name)

    source_url = canonicalize_detail_url(
        detail.source_url if detail else raw.detail_url
    )

    price_text = _choose_detail_or_list_value(
        detail.monthly_price_text if detail else None,
        raw.monthly_price_text,
    )
    size_text = _choose_detail_or_list_value(
        detail.size_text if detail else None,
        raw.size_text,
    )
    bedroom_text = _choose_detail_or_list_value(
        detail.bedroom_text if detail else None,
        raw.bedroom_text,
    )
    bathroom_text = _choose_detail_or_list_value(
        detail.bathroom_text if detail else None,
        raw.bathroom_text,
    )
    parking_text = _choose_detail_or_list_value(
        detail.parking_text if detail else None,
        raw.parking_text,
    )

    monthly_rent_rm = parse_price_rm(price_text)
    size_sqft = parse_size_sqft(size_text)
    bedroom_count = parse_count(bedroom_text)
    bathroom_count = parse_count(bathroom_text)
    parking_count = parse_count(parking_text)

    furnishing = normalize_furnishing(detail.furnishing_text if detail else None)

    description = detail.description if detail else None
    segment, segment_warnings = classify_segment(title, description, bedroom_count)

    annual_rent_rm = monthly_rent_rm * 12 if monthly_rent_rm is not None else None

    parse_warnings = [
        *raw.parse_warnings,
        *((detail.parse_warnings if detail else [])),
    ]

    quality_flags = _quality_flags(
        monthly_rent_rm=monthly_rent_rm,
        size_sqft=size_sqft,
        furnishing=furnishing,
        bedroom_text=bedroom_text,
        bedroom_count=bedroom_count,
        duplicate=duplicate,
        segment_warnings=segment_warnings,
        detail_missing=detail is None,
    )

    return PropertyListing(
        id=make_listing_id(source_url),
        title=title,
        propertyName=property_name,
        areaName=scraped.area_name,
        areaSlug=scraped.area_slug,
        segment=segment,
        bedroomCount=bedroom_count,
        bathroomCount=bathroom_count,
        parkingCount=parking_count,
        monthlyRentRM=monthly_rent_rm,
        annualRentRM=annual_rent_rm,
        annualRentIsDerived=annual_rent_rm is not None,
        dailyRentRM=None,
        dailyRentAvailability=DailyRentAvailability.UNAVAILABLE,
        sizeSqft=size_sqft,
        furnishing=furnishing,
        minimumTenureMonths=parse_minimum_tenure_months(
            detail.minimum_tenure_text if detail else None
        ),
        moveInStatus=raw.move_in_text,
        moveInDate=detail.move_in_date_text if detail else None,
        verified=parse_boolean_flag(raw.verified_text),
        zeroDeposit=parse_boolean_flag(raw.zero_deposit_text),
        sourceUrl=source_url,
        sourcePage=raw.source_page,
        scrapedAt=scraped.scraped_at.isoformat(),
        parseWarnings=parse_warnings,
        dataQualityFlags=quality_flags,
    )


def normalize_listings(scraped_listings: list[ScrapedListing]) -> list[PropertyListing]:
    url_counts = Counter(
        canonicalize_detail_url(item.detail_page.source_url if item.detail_page else item.list_page.detail_url)
        for item in scraped_listings
    )

    normalized: list[PropertyListing] = []
    seen_urls: set[str] = set()

    for scraped in scraped_listings:
        source_url = canonicalize_detail_url(
            scraped.detail_page.source_url if scraped.detail_page else scraped.list_page.detail_url
        )
        duplicate = url_counts[source_url] > 1

        if source_url in seen_urls:
            continue

        seen_urls.add(source_url)
        normalized.append(normalize_listing(scraped, duplicate=duplicate))

    return normalized