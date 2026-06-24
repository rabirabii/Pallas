import pytest

from pipeline.utils import (
    area_name_from_slug,
    build_area_url,
    canonicalize_detail_url,
    canonicalize_url,
    make_listing_id,
    page_url,
    parse_speedhome_area_slug,
    slugify_area_name,
)


def test_slugify_area_name():
    assert slugify_area_name("Mont Kiara") == "mont-kiara"
    assert slugify_area_name(" Kuala   Lumpur ") == "kuala-lumpur"


def test_area_name_from_slug():
    assert area_name_from_slug("mont-kiara") == "Mont Kiara"


def test_build_area_url():
    assert build_area_url("Mont Kiara") == "https://speedhome.com/rent/mont-kiara"


def test_parse_speedhome_area_slug():
    assert parse_speedhome_area_slug("https://speedhome.com/rent/mont-kiara") == "mont-kiara"
    assert parse_speedhome_area_slug("https://www.speedhome.com/rent/bangsar?page=2") == "bangsar"


def test_parse_speedhome_area_slug_rejects_other_hosts():
    with pytest.raises(ValueError):
        parse_speedhome_area_slug("https://example.com/rent/mont-kiara")


def test_canonicalize_url_keeps_only_page_query():
    assert (
        canonicalize_url("https://www.speedhome.com/rent/mont-kiara?foo=bar&page=2")
        == "https://speedhome.com/rent/mont-kiara?page=2"
    )


def test_canonicalize_detail_url_removes_query():
    assert (
        canonicalize_detail_url("https://www.speedhome.com/details/example-id?utm=abc")
        == "https://speedhome.com/details/example-id"
    )


def test_make_listing_id_is_deterministic():
    first = make_listing_id("https://speedhome.com/details/example-id")
    second = make_listing_id("https://www.speedhome.com/details/example-id?utm=abc")

    assert first == second
    assert len(first) == 16


def test_page_url():
    assert page_url("https://speedhome.com/rent/mont-kiara", 1) == "https://speedhome.com/rent/mont-kiara"
    assert page_url("https://speedhome.com/rent/mont-kiara", 2) == "https://speedhome.com/rent/mont-kiara?page=2"