from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT_DIR.parent

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from pipeline.speedhome.models import AreaDataset, DatasetManifest, ManifestArea  # noqa: E402


LOGGER = logging.getLogger("validate_dataset")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate clean datasets and generate manifest.")
    parser.add_argument("--areas-dir", default="data/clean", help="Directory containing area JSON datasets.")
    parser.add_argument("--manifest-output", default="data/clean/manifest.json")
    parser.add_argument("--copy-to-public", action="store_true", help="Copy datasets to project public/data.")
    parser.add_argument("--log-level", default="INFO")

    return parser.parse_args()


def load_area_dataset(path: Path) -> AreaDataset:
    payload = json.loads(path.read_text(encoding="utf-8"))
    return AreaDataset.model_validate(payload)


def discover_area_files(areas_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in areas_dir.glob("*.json")
        if path.name != "manifest.json"
    )


def build_manifest(datasets: list[AreaDataset]) -> DatasetManifest:
    return DatasetManifest(
        generatedAt=datetime.now(timezone.utc).isoformat(),
        areas=[
            ManifestArea(
                name=dataset.metadata.areaName,
                slug=dataset.metadata.areaSlug,
                sourceUrl=dataset.metadata.sourceUrl,
                listingCount=dataset.metadata.listingCount,
                scrapedAt=dataset.metadata.scrapedAt,
            )
            for dataset in sorted(datasets, key=lambda item: item.metadata.areaSlug)
        ],
    )


def write_json(payload: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def copy_to_public(datasets: list[AreaDataset], manifest: DatasetManifest) -> None:
    public_data_dir = PROJECT_ROOT / "public" / "data"
    public_areas_dir = public_data_dir / "areas"

    public_areas_dir.mkdir(parents=True, exist_ok=True)

    write_json(manifest.model_dump(mode="json"), public_data_dir / "manifest.json")

    for dataset in datasets:
        write_json(
            dataset.model_dump(mode="json"),
            public_areas_dir / f"{dataset.metadata.areaSlug}.json",
        )


def validate_datasets(areas_dir: Path, manifest_output: Path, copy_public: bool) -> None:
    area_files = discover_area_files(areas_dir)
    if not area_files:
        raise FileNotFoundError(f"No area dataset JSON files found in {areas_dir}")

    datasets = [load_area_dataset(path) for path in area_files]
    manifest = build_manifest(datasets)

    write_json(manifest.model_dump(mode="json"), manifest_output)

    LOGGER.info("Validated %s area dataset(s)", len(datasets))
    LOGGER.info("Wrote manifest: %s", manifest_output)

    if copy_public:
        copy_to_public(datasets, manifest)
        LOGGER.info("Copied datasets to %s", PROJECT_ROOT / "public" / "data")


def main() -> int:
    args = parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level.upper()),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    validate_datasets(
        areas_dir=Path(args.areas_dir),
        manifest_output=Path(args.manifest_output),
        copy_public=args.copy_to_public,
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())