from __future__ import annotations
import json
import re
from dataclasses import dataclass
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from pipeline.speedhome.models import RawListing, RawListingDetail
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