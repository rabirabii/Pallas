from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pipeline.speedhome.parser import parse_saved_area_snapshot  # noqa: E402
from pipeline.utils import build_area_url, parse_speedhome_area_slug, area_name_from_slug  # noqa: E402


LOGGER = logging.getLogger("parse_saved_speedhome_html")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Parse saved SPEEDHOME area page HTML into raw pipeline JSON."
    )
    parser.add_argument("--input", required=True, help="Saved SPEEDHOME area HTML file.")
    parser.add_argument("--area", help="Area name, e.g. Mont Kiara.")
    parser.add_argument("--url", help="Original SPEEDHOME area URL.")
    parser.add_argument("--source-page", type=int, default=1)
    parser.add_argument("--output-dir", default="data/raw")
    parser.add_argument("--log-level", default="INFO")
    return parser.parse_args()


def write_raw_output(
    output_path: Path,
    area_name: str,
    area_slug: str,
    source_url: str,
    scraped_at: datetime,
    listings: list,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "metadata": {
            "areaName": area_name,
            "areaSlug": area_slug,
            "sourceUrl": source_url,
            "scrapedAt": scraped_at.isoformat(),
            "listingCount": len(listings),
            "dataCollectionMode": "saved_html_snapshot",
        },
        "listings": [listing.model_dump(mode="json") for listing in listings],
        "errors": [],
    }

    output_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def main() -> int:
    args = parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    if not args.area and not args.url:
        raise SystemExit("Provide either --area or --url")

    source_url = build_area_url(args.url or args.area)
    area_slug = parse_speedhome_area_slug(source_url)
    area_name = args.area or area_name_from_slug(area_slug)

    input_path = Path(args.input)
    html = input_path.read_text(encoding="utf-8")
    scraped_at = datetime.now(timezone.utc)

    listings = parse_saved_area_snapshot(
        html=html,
        area_name=area_name,
        area_slug=area_slug,
        source_page=args.source_page,
        scraped_at=scraped_at,
        base_url=source_url,
    )

    output_path = Path(args.output_dir) / f"{area_slug}.json"

    write_raw_output(
        output_path=output_path,
        area_name=area_name,
        area_slug=area_slug,
        source_url=source_url,
        scraped_at=scraped_at,
        listings=listings,
    )

    LOGGER.info("Parsed %s listings from %s", len(listings), input_path)
    LOGGER.info("Wrote raw snapshot JSON: %s", output_path)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())