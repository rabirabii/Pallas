from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pipeline.speedhome.client import (  # noqa: E402
    SpeedhomeAccessBlockedError,
    SpeedhomeClient,
    SpeedhomeClientConfig,
    SpeedhomeRequestError,
)
from pipeline.speedhome.models import RawListingDetail, ScrapedListing  # noqa: E402
from pipeline.speedhome.parser import parse_area_page, parse_detail_page  # noqa: E402
from pipeline.utils import (  # noqa: E402
    area_name_from_slug,
    build_area_url,
    page_url,
    parse_speedhome_area_slug,
)


LOGGER = logging.getLogger("scrape_speedhome")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape public SPEEDHOME rental listings.")
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument("--url", help="SPEEDHOME area URL, e.g. https://speedhome.com/rent/mont-kiara")
    input_group.add_argument("--area", help="Area name, e.g. Mont Kiara")

    parser.add_argument("--max-pages", type=int, default=10)
    parser.add_argument("--output-dir", default="data/raw")
    parser.add_argument("--log-level", default="INFO")

    return parser.parse_args()


def load_config() -> SpeedhomeClientConfig:
    load_dotenv()

    return SpeedhomeClientConfig(
        user_agent=os.getenv("SCRAPER_USER_AGENT", "PropertyPriceIntelligenceAssessment/1.0"),
        request_delay_seconds=float(os.getenv("REQUEST_DELAY_SECONDS", "1.5")),
        request_timeout_seconds=float(os.getenv("REQUEST_TIMEOUT_SECONDS", "30")),
        max_retries=int(os.getenv("MAX_RETRIES", "3")),
    )


def serialize_scraped_listing(listing: ScrapedListing) -> dict:
    return listing.model_dump(mode="json")


def write_raw_output(
    output_path: Path,
    area_name: str,
    area_slug: str,
    source_url: str,
    scraped_at: datetime,
    listings: list[ScrapedListing],
    errors: list[dict],
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "metadata": {
            "areaName": area_name,
            "areaSlug": area_slug,
            "sourceUrl": source_url,
            "scrapedAt": scraped_at.isoformat(),
            "listingCount": len(listings),
        },
        "listings": [serialize_scraped_listing(listing) for listing in listings],
        "errors": errors,
    }

    output_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def scrape_area(
    client: SpeedhomeClient,
    area_url: str,
    max_pages: int,
    output_path: Path,
) -> None:
    area_slug = parse_speedhome_area_slug(area_url)
    area_name = area_name_from_slug(area_slug)
    scraped_at = datetime.now(timezone.utc)

    LOGGER.info("Checking robots.txt for %s", area_url)
    robots_result = client.validate_robots(area_url)
    LOGGER.info(robots_result.reason)

    scraped_listings: list[ScrapedListing] = []
    errors: list[dict] = []
    seen_detail_urls: set[str] = set()

    try:
        for page_number in range(1, max_pages + 1):
            current_page_url = page_url(area_url, page_number)
            LOGGER.info("Scraping area page %s/%s: %s", page_number, max_pages, current_page_url)

            if page_number > 1:
                client.polite_delay()

            try:
                page_result = client.fetch_html(current_page_url)
            except SpeedhomeAccessBlockedError as exc:
                errors.append(
                    {
                        "url": current_page_url,
                        "type": "access_blocked",
                        "message": str(exc),
                    }
                )
                LOGGER.error(str(exc))
                break
            except SpeedhomeRequestError as exc:
                errors.append(
                    {
                        "url": current_page_url,
                        "type": "request_error",
                        "message": str(exc),
                    }
                )
                LOGGER.error(str(exc))
                break

            raw_listings = parse_area_page(
                html=page_result.html,
                source_page=page_number,
                base_url=current_page_url,
            )

            new_raw_listings = [
                listing
                for listing in raw_listings
                if listing.detail_url not in seen_detail_urls
            ]

            if not new_raw_listings:
                LOGGER.info("No new listing URLs found on page %s. Stopping pagination.", page_number)
                break

            LOGGER.info("Found %s new listing URLs on page %s", len(new_raw_listings), page_number)

            for raw_listing in new_raw_listings:
                seen_detail_urls.add(raw_listing.detail_url)
                detail: RawListingDetail | None = None
                parse_warnings: list[str] = []

                client.polite_delay()

                try:
                    detail_result = client.fetch_html(raw_listing.detail_url)
                    detail = parse_detail_page(
                        html=detail_result.html,
                        source_url=raw_listing.detail_url,
                    )
                except SpeedhomeAccessBlockedError as exc:
                    parse_warnings.append("detail_page_unavailable")
                    errors.append(
                        {
                            "url": raw_listing.detail_url,
                            "type": "access_blocked",
                            "message": str(exc),
                        }
                    )
                    LOGGER.warning("Detail page unavailable: %s", raw_listing.detail_url)
                except SpeedhomeRequestError as exc:
                    parse_warnings.append("detail_page_unavailable")
                    errors.append(
                        {
                            "url": raw_listing.detail_url,
                            "type": "request_error",
                            "message": str(exc),
                        }
                    )
                    LOGGER.warning("Detail request failed: %s", raw_listing.detail_url)

                scraped_listings.append(
                    ScrapedListing(
                        area_name=area_name,
                        area_slug=area_slug,
                        source_page=page_number,
                        list_page=raw_listing,
                        detail_page=detail,
                        scraped_at=scraped_at,
                        parse_warnings=parse_warnings,
                    )
                )

            write_raw_output(
                output_path=output_path,
                area_name=area_name,
                area_slug=area_slug,
                source_url=area_url,
                scraped_at=scraped_at,
                listings=scraped_listings,
                errors=errors,
            )

    except KeyboardInterrupt:
        LOGGER.warning("Interrupted. Preserving partial results at %s", output_path)
    finally:
        write_raw_output(
            output_path=output_path,
            area_name=area_name,
            area_slug=area_slug,
            source_url=area_url,
            scraped_at=scraped_at,
            listings=scraped_listings,
            errors=errors,
        )

    LOGGER.info("Wrote %s scraped listings to %s", len(scraped_listings), output_path)


def main() -> int:
    args = parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    config = load_config()
    client = SpeedhomeClient(config)

    area_url = build_area_url(args.url or args.area)
    area_slug = parse_speedhome_area_slug(area_url)
    output_path = Path(args.output_dir) / f"{area_slug}.json"

    scrape_area(
        client=client,
        area_url=area_url,
        max_pages=args.max_pages,
        output_path=output_path,
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())