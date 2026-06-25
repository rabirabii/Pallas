"use client";

import * as XLSX from "xlsx";

import type { AreaDataset } from "@/features/area-intelligence";
import { exportFilename } from "@/features/dataset-export/application/export-filename";
import {
  listingsToCsv,
  listingsToSheetRows,
} from "@/features/dataset-export/application/listing-export-mappers";
import {
  downloadCsv,
  downloadJson,
} from "@/features/dataset-export/infrastructure/browser-download";
import { SectionHeading } from "@/shared/ui/section-heading";

export function DatasetDownloads({
  dataset,
  compact = false,
}: {
  dataset: AreaDataset;
  compact?: boolean;
}) {
  const areaName = dataset.metadata.areaName;
  const scrapedAt = dataset.metadata.scrapedAt;

  function handleJsonDownload() {
    downloadJson(dataset, exportFilename(areaName, scrapedAt, "json"));
  }

  function handleCsvDownload() {
    downloadCsv(
      listingsToCsv(dataset.listings),
      exportFilename(areaName, scrapedAt, "csv"),
    );
  }

  function handleExcelDownload() {
    const workbook = XLSX.utils.book_new();

    const listingsSheet = XLSX.utils.json_to_sheet(
      listingsToSheetRows(dataset.listings),
    );
    const summarySheet = XLSX.utils.json_to_sheet(dataset.summaries);
    const metadataSheet = XLSX.utils.json_to_sheet([
      dataset.metadata,
      dataset.qualityReport,
    ]);

    XLSX.utils.book_append_sheet(workbook, listingsSheet, "Filtered Listings");
    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Current Price Summary",
    );
    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");

    XLSX.writeFile(workbook, exportFilename(areaName, scrapedAt, "xlsx"));
  }

  return (
    <section className={compact ? "py-0" : "py-12"}>
      {compact ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-dark">
            Dataset Export
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            Download Snapshot
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-muted">
            Export the current static dataset for independent inspection.
          </p>
        </div>
      ) : (
        <SectionHeading
          marker="VII."
          eyebrow="Dataset Export"
          title="Download Snapshot"
        >
          Export the current static dataset for independent inspection.
        </SectionHeading>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCsvDownload}
          className="border border-border-strong bg-surface-raised px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-foreground transition hover:bg-surface"
        >
          Download CSV
        </button>
        <button
          type="button"
          onClick={handleExcelDownload}
          className="border border-primary-strong bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-foreground-inverse transition hover:bg-primary-strong"
        >
          Download Excel
        </button>
        <button
          type="button"
          onClick={handleJsonDownload}
          className="border border-border-strong bg-transparent px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-foreground transition hover:bg-surface"
        >
          Download JSON
        </button>
      </div>
    </section>
  );
}
