from pipeline.analytics import (
    calculate_fair_price,
    calculate_mode,
    data_confidence,
    percentile,
    round_to_nearest_10,
    summarize_segment,
)
from pipeline.speedhome.models import (
    DailyRentAvailability,
    FairPriceStatus,
    Furnishing,
    ModeStatus,
    PropertyListing,
)


def make_listing(segment="2BR", price=3000, size=1000):
    return PropertyListing(
        id=f"{segment}-{price}-{size}",
        title="Example",
        propertyName="Example Property",
        areaName="Mont Kiara",
        areaSlug="mont-kiara",
        segment=segment,
        bedroomCount=2,
        bathroomCount=2,
        parkingCount=1,
        monthlyRentRM=price,
        annualRentRM=price * 12 if price is not None else None,
        annualRentIsDerived=price is not None,
        dailyRentRM=None,
        dailyRentAvailability=DailyRentAvailability.UNAVAILABLE,
        sizeSqft=size,
        furnishing=Furnishing.FULLY_FURNISHED,
        minimumTenureMonths=12,
        moveInStatus=None,
        moveInDate=None,
        verified=True,
        zeroDeposit=True,
        sourceUrl="https://speedhome.com/details/example",
        sourcePage=1,
        scrapedAt="2026-06-23T00:00:00+00:00",
        parseWarnings=[],
        dataQualityFlags=[],
    )


def test_round_to_nearest_10():
    assert round_to_nearest_10(2524) == 2520
    assert round_to_nearest_10(2525) == 2520
    assert round_to_nearest_10(2526) == 2530


def test_percentile():
    assert percentile([1000, 2000, 3000, 4000], 0.25) == 1750
    assert percentile([1000, 2000, 3000, 4000], 0.75) == 3250


def test_calculate_mode_no_repeated_price():
    mode, status, multiple_modes, all_modes = calculate_mode([1000, 2000, 3000])

    assert mode is None
    assert status == ModeStatus.NO_REPEATED_PRICE
    assert multiple_modes is False
    assert all_modes == []


def test_calculate_mode_multiple_modes():
    mode, status, multiple_modes, all_modes = calculate_mode([1000, 1000, 2000, 2000, 3000])

    assert mode == 1000
    assert status == ModeStatus.AVAILABLE
    assert multiple_modes is True
    assert all_modes == [1000, 2000]


def test_calculate_fair_price_insufficient_data():
    fair_price, status = calculate_fair_price([1000, 2000])

    assert fair_price is None
    assert status == FairPriceStatus.INSUFFICIENT_DATA


def test_calculate_fair_price_uses_median_for_three_values():
    fair_price, status = calculate_fair_price([1000, 2000, 9000])

    assert fair_price == 2000
    assert status == FairPriceStatus.AVAILABLE


def test_calculate_fair_price_filters_outlier():
    fair_price, status = calculate_fair_price([2500, 2600, 2700, 2800])

    assert fair_price == 2650
    assert status == FairPriceStatus.AVAILABLE


def test_data_confidence():
    assert data_confidence(1) == "Very Low"
    assert data_confidence(3) == "Low"
    assert data_confidence(6) == "Moderate"
    assert data_confidence(10) == "Higher"


def test_summarize_segment():
    listings = [
        make_listing(price=2500, size=900),
        make_listing(price=2500, size=1000),
        make_listing(price=3000, size=1100),
    ]

    summary = summarize_segment("2BR", listings)

    assert summary.segment == "2BR"
    assert summary.unitCount == 3
    assert summary.validPriceCount == 3
    assert summary.averageMonthlyRentRM == 2667
    assert summary.medianMonthlyRentRM == 2500
    assert summary.modeMonthlyRentRM == 2500
    assert summary.fairPriceRM == 2500
    assert summary.averageSizeSqft == 1000
    assert summary.dataConfidence == "Low"