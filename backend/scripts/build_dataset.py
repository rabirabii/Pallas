from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pipeline.analytics import build_area_dataset  # noqa: E402
from pipeline.cleansing import normalize_listings  # noqa: E402
from pipeline.export import write_csv, write_excel, write_json  # noqa: E402
from pipeline.speedhome.models import ScrapedListing  # noqa: E402


LOGGER = logging.getLogger("build_dataset")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build clean area dataset from raw SPEEDHOME scrape JSON.")
    parser.add_argument("--input", required=True, help="Raw scrape JSON path.")
    parser.add_argument("--output", required=True, help="Clean area dataset JSON output path.")
    parser.add_argument("--exports-dir", default="data/exports", help="Directory for CSV/XLSX exports.")
    parser.add_argument("--log-level", default="INFO")

    return parser.parse_args()


def load_raw_payload(input_path: Path) -> dict:
    return json.loads(input_path.read_text(encoding="utf-8"))


def load_scraped_listings(payload: dict) -> list[ScrapedListing]:
    return [
        ScrapedListing.model_validate(item)
        for item in payload.get("listings", [])
    ]


def safe_export_area_name(area_name: str) -> str:
    return "_".join(area_name.split())


def build_dataset(input_path: Path, output_path: Path, exports_dir: Path) -> None:
    payload = load_raw_payload(input_path)
    metadata = payload["metadata"]

    scraped_listings = load_scraped_listings(payload)
    listings = normalize_listings(scraped_listings)

    dataset = build_area_dataset(
        area_name=metadata["areaName"],
        area_slug=metadata["areaSlug"],
        source_url=metadata["sourceUrl"],
        scraped_at=metadata["scrapedAt"],
        listings=listings,
    )

    write_json(dataset, output_path)

    date_part = metadata["scrapedAt"][:10].replace("-", "")
    area_part = safe_export_area_name(metadata["areaName"])
    basename = f"SPEEDHOME_{area_part}_{date_part}"

    csv_path = exports_dir / f"{basename}.csv"
    excel_path = exports_dir / f"{basename}.xlsx"

    write_csv(dataset, csv_path)
    write_excel(dataset, excel_path)

    LOGGER.info("Wrote clean dataset: %s", output_path)
    LOGGER.info("Wrote CSV export: %s", csv_path)
    LOGGER.info("Wrote Excel export: %s", excel_path)
    LOGGER.info("Listings: %s, valid prices: %s", dataset.metadata.listingCount, dataset.metadata.validPriceCount)


def main() -> int:
    args = parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    build_dataset(
        input_path=Path(args.input),
        output_path=Path(args.output),
        exports_dir=Path(args.exports_dir),
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())