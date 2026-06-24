from datetime import datetime, timezone

from pipeline.cleansing import (
    classify_segment,
    normalize_furnishing,
    normalize_listings,
    parse_count,
    parse_int,
)
from pipeline.speedhome.models import Furnishing, RawListing, RawListingDetail, ScrapedListing


def make_scraped(detail_url="https://speedhome.com/details/example-id"):
    return ScrapedListing(
        area_name="Mont Kiara",
        area_slug="mont-kiara",
        source_page=1,
        scraped_at=datetime(2026, 6, 23, tzinfo=timezone.utc),
        list_page=RawListing(
            detail_url=detail_url,
            card_text="VERIFIED ZERO DEPOSIT RM 3,500 / month 1,050 sqft 2 bedroom 2 bathroom 1 parking",
            property_name="Residensi 22 Mont Kiara",
            monthly_price_text="RM 3,500",
            size_text="1,050 sqft",
            bedroom_text="2",
            bathroom_text="2",
            parking_text="1",
            verified_text="VERIFIED",
            zero_deposit_text="ZERO DEPOSIT",
            source_page=1,
        ),
        detail_page=RawListingDetail(
            source_url=detail_url,
            listing_title="Residensi 22 Mont Kiara",
            property_name="Residensi 22",
            monthly_price_text="RM 3,500",
            size_text="1,050 sqft",
            bedroom_text="2",
            bathroom_text="2",
            parking_text="1",
            furnishing_text="Fully Furnished",
            minimum_tenure_text="12 month",
            move_in_date_text="May 4, 2026",
            description="Bright unit with balcony",
        ),
    )


def test_parse_int():
    assert parse_int("RM 3,500") == 3500
    assert parse_int("1,050 sqft") == 1050
    assert parse_int("not stated") is None


def test_parse_count():
    assert parse_count("Studio") == 0
    assert parse_count("2 bedroom") == 2
    assert parse_count("999 bedroom") is None


def test_normalize_furnishing():
    assert normalize_furnishing("Fully Furnished • Amenities") == Furnishing.FULLY_FURNISHED
    assert normalize_furnishing("Partially Furnished") == Furnishing.PARTIALLY_FURNISHED
    assert normalize_furnishing("Unfurnished") == Furnishing.UNFURNISHED
    assert normalize_furnishing(None) == Furnishing.UNKNOWN


def test_classify_segment_by_bedroom_count():
    assert classify_segment("Condo", "", 0)[0] == "Studio"
    assert classify_segment("Condo", "", 1)[0] == "1BR"
    assert classify_segment("Condo", "", 2)[0] == "2BR"
    assert classify_segment("Condo", "", 3)[0] == "3BR"
    assert classify_segment("Condo", "", 4)[0] == "4BR+"


def test_classify_room_segment_from_title_and_description():
    assert classify_segment("Master Bedroom for rent", "", None)[0] == "Room - Master Private"
    assert classify_segment("Room for rent", "medium shared unit", None)[0] == "Room - Medium Shared"


def test_classify_ambiguous_room_type():
    segment, warnings = classify_segment("Room for rent", "", None)

    assert segment == "Unknown"
    assert warnings == ["ambiguous_room_type"]


def test_normalize_listing():
    listing = normalize_listings([make_scraped()])[0]

    assert listing.title == "Residensi 22 Mont Kiara"
    assert listing.areaName == "Mont Kiara"
    assert listing.segment == "2BR"
    assert listing.monthlyRentRM == 3500
    assert listing.annualRentRM == 42000
    assert listing.annualRentIsDerived is True
    assert listing.dailyRentRM is None
    assert listing.dailyRentAvailability == "unavailable"
    assert listing.sizeSqft == 1050
    assert listing.furnishing == Furnishing.FULLY_FURNISHED
    assert listing.minimumTenureMonths == 12
    assert listing.moveInDate == "May 4, 2026"
    assert listing.verified is True
    assert listing.zeroDeposit is True
    assert listing.dataQualityFlags == []


def test_normalize_listing_quality_flags_missing_values():
    scraped = make_scraped()
    scraped.detail_page.monthly_price_text = None
    scraped.detail_page.size_text = None
    scraped.detail_page.furnishing_text = None
    scraped.list_page.monthly_price_text = None
    scraped.list_page.size_text = None

    listing = normalize_listings([scraped])[0]

    assert "missing_price" in listing.dataQualityFlags
    assert "missing_size" in listing.dataQualityFlags
    assert "missing_furnishing" in listing.dataQualityFlags


def test_normalize_listings_deduplicates_source_url():
    first = make_scraped("https://speedhome.com/details/example-id")
    second = make_scraped("https://speedhome.com/details/example-id?utm=abc")

    listings = normalize_listings([first, second])

    assert len(listings) == 1
    assert "duplicate_source_url" in listings[0].dataQualityFlags