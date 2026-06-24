from pipeline.speedhome.parser import (
    parse_area_page,
    parse_bathroom_text,
    parse_bedroom_text,
    parse_detail_page,
    parse_listing_links,
    parse_pagination,
    parse_price_text,
    parse_size_text,
)


AREA_HTML = """
<html>
  <body>
    <div class="generated-card-class">
      <a href="/details/residensi-22-mont-kiara-abc123">Residensi 22 Mont Kiara</a>
      <div>VERIFIED ZERO DEPOSIT</div>
      <div>RM 3,500 / month</div>
      <div>1,050 sqft 2 bedroom 2 bathroom 1 parking</div>
    </div>
    <a href="/rent/mont-kiara?page=2">Next</a>
  </body>
</html>
"""


DETAIL_HTML = """
<html>
  <head><title>Residensi 22 for rent | SPEEDHOME</title></head>
  <body>
    <h1>Residensi 22 Mont Kiara</h1>
    <section>RM 3,500</section>
    <section>1,050 sqft 2 bedroom 2 bathroom 1 parking</section>
    <section>Move-in: May 4, 2026 • Min. Tenure: 12 month</section>
    <section>Fully Furnished • Amenities</section>
    <section>Address: Jalan Kiara, Mont Kiara About Property</section>
    <section>About Property Bright unit with balcony Amenities Pool</section>
  </body>
</html>
"""


def test_parse_price_text():
    assert parse_price_text("RM 3,500 / month") == "RM 3,500"


def test_parse_size_text():
    assert parse_size_text("1,050 sqft 2 bedroom") == "1,050 sqft"


def test_parse_bedroom_text():
    assert parse_bedroom_text("2 bedroom") == "2"
    assert parse_bedroom_text("Master Bedroom for rent") == "Master Bedroom"


def test_parse_bathroom_text():
    assert parse_bathroom_text("2 bathroom") == "2"


def test_parse_listing_links():
    assert parse_listing_links(AREA_HTML) == [
        "https://speedhome.com/details/residensi-22-mont-kiara-abc123"
    ]


def test_parse_area_page():
    listings = parse_area_page(AREA_HTML, source_page=1)

    assert len(listings) == 1
    assert listings[0].detail_url == "https://speedhome.com/details/residensi-22-mont-kiara-abc123"
    assert listings[0].monthly_price_text == "RM 3,500"
    assert listings[0].size_text == "1,050 sqft"
    assert listings[0].bedroom_text == "2"
    assert listings[0].bathroom_text == "2"
    assert listings[0].parking_text == "1"
    assert listings[0].verified_text == "VERIFIED"
    assert listings[0].zero_deposit_text == "ZERO DEPOSIT"


def test_parse_pagination():
    pagination = parse_pagination(
        AREA_HTML,
        current_url="https://speedhome.com/rent/mont-kiara",
    )

    assert pagination.next_page_url == "https://speedhome.com/rent/mont-kiara?page=2"
    assert pagination.page_numbers == [2]


def test_parse_detail_page():
    detail = parse_detail_page(
        DETAIL_HTML,
        source_url="https://speedhome.com/details/residensi-22-mont-kiara-abc123",
    )

    assert detail.page_title == "Residensi 22 for rent | SPEEDHOME"
    assert detail.listing_title == "Residensi 22 Mont Kiara"
    assert detail.monthly_price_text == "RM 3,500"
    assert detail.size_text == "1,050 sqft"
    assert detail.bedroom_text == "2"
    assert detail.bathroom_text == "2"
    assert detail.parking_text == "1"
    assert detail.furnishing_text == "Fully Furnished"
    assert detail.minimum_tenure_text == "12 month"
    assert detail.move_in_date_text == "May 4, 2026"
    assert detail.description == "Bright unit with balcony"