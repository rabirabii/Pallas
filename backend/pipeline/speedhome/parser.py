from __future__ import annotations
import json
import re
from dataclasses import dataclass
from urllib.parse import urljoin
from datetime import datetime
from bs4 import BeautifulSoup, Tag

from pipeline.speedhome.models import RawListing, RawListingDetail, ScrapedListing
from pipeline.utils import SPEEDHOME_BASE_URL, canonicalize_detail_url, normalize_whitespace


# Selector findings from live SPEEDHOME inspection:
# - Area result pages expose listing anchors with href values containing "/details/".
# - Listing cards include plain text signals such as "VERIFIED", "ZERO DEPOSIT",
#   "COOKING READY", "{n} sqft", and "RM {amount} / month".
# - Detail pages expose the listing title in an h1 when server-rendered HTML is available.
# - Detail pages may include useful structured data in application/ld+json blocks.
# - Detail text can contain "Move-in: {date}" and "Min. Tenure: {n} month".
# - Furnishing is usually discoverable from visible text:
#   "Fully Furnished", "Partially Furnished", or "Unfurnished".
# Avoid generated class names; prefer href patterns, JSON-LD, headings, and text patterns.

@dataclass(frozen=True)
class PaginationInfo:
  next_page_url : str | None
  page_numbers : list[int]

def text_from_node(node : Tag) -> str:
    return normalize_whitespace(node.get_text(separator=" ", strip=True)) or ""
  
def parse_json_ld_blocks(html : str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    blocks: list[dict] = []

    for script in soup.find_all("script", {"type": "application/ld+json"}):
        raw = script.string or script.get_text()
        if not raw:
            continue

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            continue

        if isinstance(parsed, list):
            blocks.extend(item for item in parsed if isinstance(item, dict))
        elif isinstance(parsed, dict):
            blocks.append(parsed)

    return blocks
def parse_price_text(text: str | None) -> str | None:
    if not text:
        return None

    match = re.search(r"\bRM\s*[\d,]+(?:\.\d+)?", text, flags=re.IGNORECASE)
    return normalize_whitespace(match.group(0)) if match else None


def parse_size_text(text: str | None) -> str | None:
    if not text:
        return None

    match = re.search(r"\b[\d,]+(?:\.\d+)?\s*sq\s*ft\b|\b[\d,]+(?:\.\d+)?\s*sqft\b", text, flags=re.IGNORECASE)
    return normalize_whitespace(match.group(0)) if match else None

def _number_before_keyword(text: str, keyword_pattern: str) -> str | None:
    match = re.search(rf"\b(\d+)\s*(?:{keyword_pattern})\b", text, flags=re.IGNORECASE)
    return match.group(1) if match else None


def parse_bedroom_text(text: str | None) -> str | None:
    if not text:
        return None

    room_match = re.search(r"\b(studio|small shared|medium shared|master shared|small private|medium private|master private|master bedroom)\b", text, flags=re.IGNORECASE)
    if room_match:
        return normalize_whitespace(room_match.group(1))

    return _number_before_keyword(text, r"bed|beds|bedroom|bedrooms|br")


def parse_bathroom_text(text: str | None) -> str | None:
    if not text:
        return None

    return _number_before_keyword(text, r"bath|baths|bathroom|bathrooms")


def parse_parking_text(text: str | None) -> str | None:
    if not text:
        return None

    return _number_before_keyword(text, r"parking|car\s*park|carpark")

def parse_listing_links(html: str, base_url: str = SPEEDHOME_BASE_URL) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    links: list[str] = []

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "/details/" not in href:
            continue

        try:
            links.append(canonicalize_detail_url(urljoin(base_url, href)))
        except ValueError:
            continue

    return list(dict.fromkeys(links))


def _find_card_for_link(anchor: Tag) -> Tag:
    current: Tag = anchor

    for _ in range(6):
        parent = current.parent
        if not isinstance(parent, Tag):
            return anchor

        parent_text = text_from_node(parent)
        if "RM" in parent_text and "/ month" in parent_text.lower():
            return parent

        current = parent

    return anchor

def _parse_property_name_from_text(text: str) -> str | None:
    cleaned = normalize_whitespace(text)
    if not cleaned:
        return None

    before_price = re.split(r"\bRM\s*[\d,]+", cleaned, maxsplit=1, flags=re.IGNORECASE)[0]
    before_flags = re.split(r"\bVERIFIED\b|\bZERO DEPOSIT\b", before_price, maxsplit=1, flags=re.IGNORECASE)[0]
    value = normalize_whitespace(before_flags)
    return value


def parse_area_page(html: str, source_page: int, base_url: str = SPEEDHOME_BASE_URL) -> list[RawListing]:
    soup = BeautifulSoup(html, "html.parser")
    listings: list[RawListing] = []
    seen_urls: set[str] = set()

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        if "/details/" not in href:
            continue

        try:
            detail_url = canonicalize_detail_url(urljoin(base_url, href))
        except ValueError:
            continue

        if detail_url in seen_urls:
            continue
        seen_urls.add(detail_url)

        card = _find_card_for_link(anchor)
        card_text = text_from_node(card)
        anchor_text = text_from_node(anchor)

        listings.append(
            RawListing(
                detail_url=detail_url,
                card_text=card_text,
                property_name=_parse_property_name_from_text(anchor_text or card_text),
                area=None,
                monthly_price_text=parse_price_text(card_text),
                size_text=parse_size_text(card_text),
                bedroom_text=parse_bedroom_text(card_text),
                bathroom_text=parse_bathroom_text(card_text),
                parking_text=parse_parking_text(card_text),
                verified_text="VERIFIED" if re.search(r"\bVERIFIED\b", card_text, re.IGNORECASE) else None,
                zero_deposit_text="ZERO DEPOSIT" if re.search(r"\bZERO\s+DEPOSIT\b", card_text, re.IGNORECASE) else None,
                move_in_text=None,
                source_page=source_page,
                parse_warnings=[],
            )
        )

    return listings

def parse_pagination(html: str, current_url: str) -> PaginationInfo:
    soup = BeautifulSoup(html, "html.parser")
    page_numbers: set[int] = set()
    next_page_url: str | None = None

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        text = text_from_node(anchor).lower()

        page_match = re.search(r"[?&]page=(\d+)", href)
        if page_match:
            page_numbers.add(int(page_match.group(1)))

        if text in {"next", "next page", ">"} or "next" in text:
            next_page_url = urljoin(current_url, href)

    return PaginationInfo(
        next_page_url=next_page_url,
        page_numbers=sorted(page_numbers),
    )


def _first_h1_text(soup: BeautifulSoup) -> str | None:
    h1 = soup.find("h1")
    if not h1:
        return None

    return normalize_whitespace(h1.get_text(" ", strip=True))
def _page_title(soup: BeautifulSoup) -> str | None:
    if soup.title and soup.title.string:
        return normalize_whitespace(soup.title.string)

    return None


def _find_furnishing(text: str) -> str | None:
    for value in ("Fully Furnished", "Partially Furnished", "Unfurnished"):
        if re.search(re.escape(value), text, re.IGNORECASE):
            return value

    return None


def _find_minimum_tenure(text: str) -> str | None:
    match = re.search(
        r"Min\.?\s*Tenure\s*:\s*(\d+\s*months?)",
        text,
        flags=re.IGNORECASE,
    )
    return normalize_whitespace(match.group(1)) if match else None

def _find_move_in_date(text: str) -> str | None:
    match = re.search(
        r"Move-?in\s*:\s*(.+?)\s+Min\.?\s*Tenure\s*:",
        text,
        flags=re.IGNORECASE,
    )
    if match:
        value = match.group(1).replace("•", " ")
        return normalize_whitespace(value)

    fallback = re.search(
        r"Move-?in\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})",
        text,
        flags=re.IGNORECASE,
    )
    return normalize_whitespace(fallback.group(1)) if fallback else None


def _find_address(text: str) -> str | None:
    match = re.search(r"Address\s*:\s*(.+?)(?:About Property|Amenities|Facilities|$)", text, flags=re.IGNORECASE)
    return normalize_whitespace(match.group(1)) if match else None


def _find_description(text: str) -> str | None:
    match = re.search(
        r"About Property\s*(.+?)(?:Amenities|Facilities|Rental Terms|$)",
        text,
        flags=re.IGNORECASE,
    )
    if not match:
        return None

    value = normalize_whitespace(match.group(1))
    if not value:
        return None

    value = re.sub(r"^About Property\s+", "", value, flags=re.IGNORECASE)
    return normalize_whitespace(value)


def parse_detail_page(html: str, source_url: str) -> RawListingDetail:
    soup = BeautifulSoup(html, "html.parser")
    text = text_from_node(soup)

    return RawListingDetail(
        source_url=canonicalize_detail_url(source_url),
        page_title=_page_title(soup),
        listing_title=_first_h1_text(soup),
        property_name=_first_h1_text(soup),
        full_area_or_address=_find_address(text),
        monthly_price_text=parse_price_text(text),
        size_text=parse_size_text(text),
        bedroom_text=parse_bedroom_text(text),
        bathroom_text=parse_bathroom_text(text),
        parking_text=parse_parking_text(text),
        furnishing_text=_find_furnishing(text),
        minimum_tenure_text=_find_minimum_tenure(text),
        move_in_date_text=_find_move_in_date(text),
        property_type=None,
        description=_find_description(text),
        parse_warnings=[],
    )
def _next_data_payload(html: str) -> dict | None:
    soup = BeautifulSoup(html, "html.parser")
    script = soup.find("script", id="__NEXT_DATA__")

    if not script:
        return None

    raw = script.string or script.get_text()
    if not raw:
        return None

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None

    return parsed if isinstance(parsed, dict) else None


def parse_next_data_property_items(html: str) -> list[dict]:
    payload = _next_data_payload(html)
    if not payload:
        return []

    content = (
        payload
        .get("props", {})
        .get("pageProps", {})
        .get("propertyList", {})
        .get("content", [])
    )

    return [item for item in content if isinstance(item, dict)]


def _price_text_from_snapshot(item: dict) -> str | None:
    price = item.get("price")
    return f"RM {price}" if price is not None else None


def _size_text_from_snapshot(item: dict) -> str | None:
    sqft = item.get("sqft")
    return f"{sqft} sqft" if sqft is not None else None


def _count_text_from_snapshot(item: dict, key: str, label: str) -> str | None:
    value = item.get(key)
    return f"{value} {label}" if value is not None else None


def _furnishing_text_from_snapshot(item: dict) -> str | None:
    furnish_type = item.get("furnishType")

    if furnish_type == "FULL":
        return "Fully Furnished"
    if furnish_type == "PARTIAL":
        return "Partially Furnished"
    if furnish_type in {"NONE", "UNFURNISHED"}:
        return "Unfurnished"

    return None


def _detail_url_from_snapshot(item: dict, base_url: str = SPEEDHOME_BASE_URL) -> str:
    slug = item.get("slug")
    if not slug:
        raise ValueError("Snapshot property item does not contain slug")

    return canonicalize_detail_url(urljoin(base_url, f"/details/{slug}"))


def parse_saved_area_snapshot(
    html: str,
    area_name: str,
    area_slug: str,
    source_page: int,
    scraped_at: datetime,
    base_url: str = SPEEDHOME_BASE_URL,
) -> list[ScrapedListing]:
    from pipeline.speedhome.models import ScrapedListing

    scraped: list[ScrapedListing] = []

    for item in parse_next_data_property_items(html):
        try:
            detail_url = _detail_url_from_snapshot(item, base_url=base_url)
        except ValueError:
            continue

        name = normalize_whitespace(item.get("name"))
        address = normalize_whitespace(item.get("address"))
        description = normalize_whitespace(item.get("description"))

        price_text = _price_text_from_snapshot(item)
        size_text = _size_text_from_snapshot(item)
        bedroom_text = _count_text_from_snapshot(item, "bedroom", "bedroom")
        bathroom_text = _count_text_from_snapshot(item, "bathroom", "bathroom")
        parking_text = _count_text_from_snapshot(item, "carpark", "parking")
        furnishing_text = _furnishing_text_from_snapshot(item)

        card_parts = [
            "VERIFIED" if item.get("propertyVerified") else None,
            "ZERO DEPOSIT" if item.get("noDeposit") else None,
            name,
            price_text,
            size_text,
            bedroom_text,
            bathroom_text,
            parking_text,
        ]
        card_text = normalize_whitespace(" ".join(part for part in card_parts if part))

        raw_listing = RawListing(
            detail_url=detail_url,
            card_text=card_text,
            property_name=name,
            area=address,
            monthly_price_text=price_text,
            size_text=size_text,
            bedroom_text=bedroom_text,
            bathroom_text=bathroom_text,
            parking_text=parking_text,
            verified_text="VERIFIED" if item.get("propertyVerified") else None,
            zero_deposit_text="ZERO DEPOSIT" if item.get("noDeposit") else None,
            move_in_text=normalize_whitespace(item.get("availability")),
            source_page=source_page,
            parse_warnings=[],
        )

        detail = RawListingDetail(
            source_url=detail_url,
            page_title=name,
            listing_title=name,
            property_name=name,
            full_area_or_address=address,
            monthly_price_text=price_text,
            size_text=size_text,
            bedroom_text=bedroom_text,
            bathroom_text=bathroom_text,
            parking_text=parking_text,
            furnishing_text=furnishing_text,
            minimum_tenure_text=(
                f"{item.get('minRentalDuration')} month"
                if item.get("minRentalDuration") is not None
                else None
            ),
            move_in_date_text=normalize_whitespace(item.get("availability")),
            property_type=normalize_whitespace(item.get("type")),
            description=description,
            parse_warnings=[],
        )

        scraped.append(
            ScrapedListing(
                area_name=area_name,
                area_slug=area_slug,
                source_page=source_page,
                list_page=raw_listing,
                detail_page=detail,
                scraped_at=scraped_at,
                parse_warnings=[],
            )
        )

    return scraped