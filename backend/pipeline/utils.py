from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlencode, urljoin, urlparse, urlunparse


SPEEDHOME_BASE_URL = "https://speedhome.com"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_whitespace(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = re.sub(r"\s+", " ", value).strip()
    return cleaned or None


def slugify_area_name(area_name: str) -> str:
    normalized = normalize_whitespace(area_name)
    if not normalized:
        raise ValueError("Area name cannot be empty")

    slug = normalized.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = slug.strip("-")

    if not slug:
        raise ValueError(f"Could not create slug from area name: {area_name!r}")

    return slug


def area_name_from_slug(slug: str) -> str:
    normalized = slug.replace("-", " ").strip()
    return " ".join(word.capitalize() for word in normalized.split())


def build_area_url(area_name_or_slug: str) -> str:
    if area_name_or_slug.startswith("http://") or area_name_or_slug.startswith("https://"):
        return canonicalize_url(area_name_or_slug)

    slug = slugify_area_name(area_name_or_slug)
    return f"{SPEEDHOME_BASE_URL}/rent/{slug}"


def parse_speedhome_area_slug(url: str) -> str:
    parsed = urlparse(url)

    hostname = parsed.netloc.lower()
    if hostname not in {"speedhome.com", "www.speedhome.com"}:
        raise ValueError("URL hostname must be speedhome.com")

    path_parts = [part for part in parsed.path.split("/") if part]
    if len(path_parts) < 2 or path_parts[0] != "rent":
        raise ValueError("URL must use the /rent/{area-slug} path")

    slug = path_parts[1].strip().lower()
    if not re.fullmatch(r"[a-z0-9-]+", slug):
        raise ValueError(f"Invalid SPEEDHOME area slug: {slug!r}")

    return slug


def canonicalize_url(url: str, base_url: str = SPEEDHOME_BASE_URL) -> str:
    absolute = urljoin(base_url, url)
    parsed = urlparse(absolute)

    scheme = "https"
    netloc = parsed.netloc.lower()
    if netloc == "www.speedhome.com":
        netloc = "speedhome.com"

    path = re.sub(r"/+", "/", parsed.path).rstrip("/")
    query_pairs = parse_qs(parsed.query, keep_blank_values=False)

    allowed_query = {}
    if "page" in query_pairs:
        allowed_query["page"] = query_pairs["page"][0]

    query = urlencode(allowed_query)

    return urlunparse((scheme, netloc, path, "", query, ""))


def canonicalize_detail_url(url: str) -> str:
    canonical = canonicalize_url(url)
    parsed = urlparse(canonical)

    if "/details/" not in parsed.path:
        raise ValueError(f"Expected a SPEEDHOME detail URL, got: {url}")

    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))


def make_listing_id(source_url: str) -> str:
    canonical = canonicalize_detail_url(source_url)
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return digest[:16]


def page_url(area_url: str, page_number: int) -> str:
    canonical = canonicalize_url(area_url)

    if page_number <= 1:
        parsed = urlparse(canonical)
        return urlunparse((parsed.scheme, parsed.netloc, parsed.path, "", "", ""))

    parsed = urlparse(canonical)
    return urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            "",
            urlencode({"page": page_number}),
            "",
        )
    )