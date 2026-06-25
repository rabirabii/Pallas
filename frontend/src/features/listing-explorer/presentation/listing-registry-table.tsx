"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { PropertyListing } from "@/features/area-intelligence";
import {
  downloadCsv,
  exportFilename,
  listingsToCsv,
} from "@/features/dataset-export";
import {
  defaultListingFilters,
  filterListings,
  type ListingFilters,
  summarizeFilteredListings,
  uniqueFurnishings,
  uniqueSegments,
} from "@/features/listing-explorer";
import {
  formatNullableText,
  formatNumber,
  formatRM,
  formatSqft,
} from "@/shared/formatting/number-format";
import { SectionHeading } from "@/shared/ui/section-heading";
import { ListingDetailDrawer } from "./listing-detail-drawer";

function formatCount(value: number | null): string {
  if (value === null) {
    return "Not stated";
  }

  return formatNumber(value);
}

function formatFlags(flags: string[]): string {
  if (flags.length === 0) {
    return "None";
  }

  return flags.join(", ");
}

function countActiveFilters(filters: ListingFilters): number {
  let count = 0;

  if (filters.globalSearch.trim()) count += 1;
  if (filters.segment !== defaultListingFilters.segment) count += 1;
  if (filters.furnishing !== defaultListingFilters.furnishing) count += 1;
  if (filters.minPrice.trim()) count += 1;
  if (filters.maxPrice.trim()) count += 1;
  if (filters.minSize.trim()) count += 1;
  if (filters.maxSize.trim()) count += 1;
  if (filters.verifiedOnly) count += 1;

  return count;
}

function hasActiveFilters(filters: ListingFilters): boolean {
  return (
    filters.globalSearch !== defaultListingFilters.globalSearch ||
    filters.segment !== defaultListingFilters.segment ||
    filters.furnishing !== defaultListingFilters.furnishing ||
    filters.minPrice !== defaultListingFilters.minPrice ||
    filters.maxPrice !== defaultListingFilters.maxPrice ||
    filters.minSize !== defaultListingFilters.minSize ||
    filters.maxSize !== defaultListingFilters.maxSize ||
    filters.verifiedOnly !== defaultListingFilters.verifiedOnly
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-subtle">
      {children}
    </label>
  );
}

function FilterInput({
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "numeric" | "search";
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="h-11 w-full border-b border-border bg-transparent text-sm text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary"
    />
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  allLabel: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full border-b border-border bg-transparent text-sm text-foreground outline-none transition-colors focus:border-primary"
    >
      <option value="all">{allLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") {
    return <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />;
  }

  if (direction === "desc") {
    return <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />;
  }

  return <ArrowUpDown className="size-3.5" aria-hidden="true" />;
}

export function ListingRegistryTable({
  listings,
  areaName,
  scrapedAt,
  segmentFilter,
  segmentFilterNonce = 0,
}: {
  listings: PropertyListing[];
  areaName: string;
  scrapedAt: string;
  segmentFilter?: string | null;
  segmentFilterNonce?: number;
}) {
  const [filters, setFilters] = useState<ListingFilters>(defaultListingFilters);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "monthlyRentRM", desc: false },
  ]);
  const [searchInput, setSearchInput] = useState("");
  const [announcedResult, setAnnouncedResult] = useState("");
  const [selectedListing, setSelectedListing] = useState<PropertyListing | null>(
    null,
  );
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLElement | null>(null);

  const segmentOptions = useMemo(() => uniqueSegments(listings), [listings]);
  const furnishingOptions = useMemo(
    () => uniqueFurnishings(listings),
    [listings],
  );

  const filteredListings = useMemo(
    () => filterListings(listings, filters),
    [filters, listings],
  );

  const filteredSummary = useMemo(
    () => summarizeFilteredListings(filteredListings),
    [filteredListings],
  );
  const columns = useMemo<ColumnDef<PropertyListing>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Listing",
        cell: ({ row }) => (
          <div className="max-w-[280px]">
            <p className="font-semibold text-foreground">
              {row.original.title}
            </p>
            <p className="mt-1 text-xs text-foreground-subtle">
              Page {row.original.sourcePage}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "propertyName",
        header: "Property / Area",
        cell: ({ row }) => (
          <div className="max-w-[240px] text-foreground-muted">
            {formatNullableText(
              row.original.propertyName ?? row.original.areaName,
            )}
          </div>
        ),
      },
      {
        accessorKey: "segment",
        header: "Segment",
        cell: ({ row }) => (
          <span className="font-mono text-xs uppercase tracking-[0.1em]">
            {row.original.segment}
          </span>
        ),
      },
      {
        accessorKey: "bedroomCount",
        header: "Beds",
        cell: ({ row }) => (
          <span className="font-mono">
            {formatCount(row.original.bedroomCount)}
          </span>
        ),
      },
      {
        accessorKey: "bathroomCount",
        header: "Baths",
        cell: ({ row }) => (
          <span className="font-mono">
            {formatCount(row.original.bathroomCount)}
          </span>
        ),
      },
      {
        accessorKey: "parkingCount",
        header: "Parking",
        cell: ({ row }) => (
          <span className="font-mono">
            {formatCount(row.original.parkingCount)}
          </span>
        ),
      },
      {
        accessorKey: "monthlyRentRM",
        header: "Monthly",
        cell: ({ row }) => (
          <span className="font-mono">
            {formatRM(row.original.monthlyRentRM)}
          </span>
        ),
      },
      {
        accessorKey: "annualRentRM",
        header: "Annual",
        cell: ({ row }) => (
          <div className="font-mono">
            <span>{formatRM(row.original.annualRentRM)}</span>
            {row.original.annualRentIsDerived ? (
              <span className="mt-1 block text-[11px] uppercase tracking-[0.1em] text-foreground-subtle">
                Derived
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "sizeSqft",
        header: "Size",
        cell: ({ row }) => (
          <span className="font-mono">{formatSqft(row.original.sizeSqft)}</span>
        ),
      },
      {
        accessorKey: "furnishing",
        header: "Furnishing",
        cell: ({ row }) => row.original.furnishing,
      },
      {
        accessorKey: "verified",
        header: "Verified",
        cell: ({ row }) =>
          row.original.verified ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              Yes
            </span>
          ) : (
            <span className="text-foreground-subtle">Not stated</span>
          ),
      },
      {
        accessorKey: "dataQualityFlags",
        header: "Quality Flags",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="max-w-[240px] text-foreground-muted">
            {formatFlags(row.original.dataQualityFlags)}
          </div>
        ),
      },
      {
        id: "inspect",
        header: "Inspect",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(event) => {
              setReturnFocusTo(event.currentTarget);
              setSelectedListing(row.original);
            }}
            className="font-mono text-xs uppercase tracking-[0.12em] text-primary transition-colors hover:text-foreground"
          >
            Inspect
          </button>
        ),
      },
      {
        id: "source",
        header: "Source",
        enableSorting: false,
        cell: ({ row }) => (
          <a
            href={row.original.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.12em] text-primary transition-colors hover:text-foreground"
          >
            Verify
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ),
      },
    ],
    [],
  );

  // TanStack Table intentionally returns callback-heavy APIs that React Compiler skips.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredListings,
    columns,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => {
    table.setPageIndex(0);
  }, [filters, table]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      segment: segmentFilter ?? defaultListingFilters.segment,
    }));
  }, [segmentFilter, segmentFilterNonce]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((current) =>
        current.globalSearch === searchInput
          ? current
          : {
              ...current,
              globalSearch: searchInput,
            },
      );
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    setAnnouncedResult(
      `${filteredListings.length} listings match the current filters.`,
    );
  }, [filteredListings.length]);

  const activeFilters = hasActiveFilters(filters);
  const activeFilterCount = countActiveFilters(filters);
  const pageCount = table.getPageCount();
  const pageLabel =
    pageCount === 0
      ? "0 / 0"
      : `${table.getState().pagination.pageIndex + 1} / ${pageCount}`;
  const filteredExportFilename = exportFilename(
    `${areaName}_filtered_listings`,
    scrapedAt,
    "csv",
  );

  function handleFilteredCsvDownload() {
    downloadCsv(listingsToCsv(filteredListings), filteredExportFilename);
  }

  function handleResetFilters() {
    setSearchInput("");
    setFilters(defaultListingFilters);
  }

  return (
    <section className="py-12">
      <SectionHeading
        marker="IV."
        eyebrow="Listing Explorer"
        title="Observed Unit Listings"
      >
        Search, filter, and sort snapshot records before opening the original
        SPEEDHOME source page.
      </SectionHeading>

      <div className="mt-8 border-y border-border-strong py-5">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.8fr_0.8fr]">
          <div>
            <FilterLabel>Search Registry</FilterLabel>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-foreground-subtle"
                aria-hidden="true"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search title, property, area, segment"
                inputMode="search"
                className="h-11 w-full border-b border-border bg-transparent pl-7 text-sm text-foreground outline-none transition-colors placeholder:text-foreground-subtle focus:border-primary"
              />
            </div>
          </div>

          <div>
            <FilterLabel>Segment</FilterLabel>
            <div className="mt-2">
              <FilterSelect
                value={filters.segment}
                onChange={(segment) =>
                  setFilters((current) => ({ ...current, segment }))
                }
                options={segmentOptions}
                allLabel="All segments"
              />
            </div>
          </div>

          <div>
            <FilterLabel>Furnishing</FilterLabel>
            <div className="mt-2">
              <FilterSelect
                value={filters.furnishing}
                onChange={(furnishing) =>
                  setFilters((current) => ({ ...current, furnishing }))
                }
                options={furnishingOptions}
                allLabel="All furnishing"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto_auto]">
          <div>
            <FilterLabel>Min Rent</FilterLabel>
            <div className="mt-2">
              <FilterInput
                value={filters.minPrice}
                onChange={(minPrice) =>
                  setFilters((current) => ({ ...current, minPrice }))
                }
                placeholder="RM"
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <FilterLabel>Max Rent</FilterLabel>
            <div className="mt-2">
              <FilterInput
                value={filters.maxPrice}
                onChange={(maxPrice) =>
                  setFilters((current) => ({ ...current, maxPrice }))
                }
                placeholder="RM"
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <FilterLabel>Min Size</FilterLabel>
            <div className="mt-2">
              <FilterInput
                value={filters.minSize}
                onChange={(minSize) =>
                  setFilters((current) => ({ ...current, minSize }))
                }
                placeholder="sqft"
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <FilterLabel>Max Size</FilterLabel>
            <div className="mt-2">
              <FilterInput
                value={filters.maxSize}
                onChange={(maxSize) =>
                  setFilters((current) => ({ ...current, maxSize }))
                }
                placeholder="sqft"
                inputMode="numeric"
              />
            </div>
          </div>

          <label className="flex h-16 items-end gap-2 text-sm text-foreground-muted">
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  verifiedOnly: event.target.checked,
                }))
              }
              className="mb-3 size-4 accent-primary"
            />
            <span className="pb-2">Verified only</span>
          </label>

          <div className="flex h-16 items-end">
            <motion.button
              type="button"
              onClick={handleResetFilters}
              disabled={!activeFilters}
              whileHover={activeFilters ? { y: -1 } : undefined}
              whileTap={activeFilters ? { scale: 0.98 } : undefined}
              className="inline-flex h-11 items-center gap-2 border border-border-strong px-4 font-mono text-xs uppercase tracking-[0.12em] text-foreground-muted transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="size-4" aria-hidden="true" />
              Reset
            </motion.button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-foreground-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Showing {table.getRowModel().rows.length} visible records from{" "}
              {filteredListings.length} matched listings.
            </span>

            <AnimatePresence initial={false}>
              {activeFilterCount > 0 ? (
                <motion.span
                  key="active-filters"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className="inline-flex items-center gap-2 border border-primary/40 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-primary"
                >
                  <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                  {activeFilterCount} active filter
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>

          <span className="font-mono text-xs uppercase tracking-[0.12em] text-foreground-subtle">
            {listings.length} observed listings · Static snapshot
          </span>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcedResult}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Matched Records",
            value: formatNumber(filteredSummary.listingCount),
          },
          {
            label: "Valid Prices",
            value: formatNumber(filteredSummary.validPriceCount),
          },
          {
            label: "Median Rent",
            value: formatRM(filteredSummary.medianMonthlyRentRM),
          },
          {
            label: "Observed Range",
            value:
              filteredSummary.minimumMonthlyRentRM === null ||
              filteredSummary.maximumMonthlyRentRM === null
                ? "Not stated"
                : `${formatRM(filteredSummary.minimumMonthlyRentRM)} - ${formatRM(
                    filteredSummary.maximumMonthlyRentRM,
                  )}`,
          },
          {
            label: "Avg RM / sqft",
            value:
              filteredSummary.averageRentPerSqftRM === null
                ? "Not stated"
                : `${filteredSummary.averageRentPerSqftRM.toFixed(2)}`,
          },
        ].map((metric) => (
          <motion.div
            key={metric.label}
            layout
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="border-y border-border py-4"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-subtle">
              {metric.label}
            </p>
            <p className="mt-2 font-mono text-lg text-foreground">
              {metric.value}
            </p>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 overflow-x-auto border-y border-border-strong">
        <table className="min-w-[1500px] w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Observed rental listings for {areaName}
          </caption>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border font-mono text-xs uppercase tracking-[0.12em] text-foreground-subtle"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-3 py-4 font-semibold"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                    }
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                        className="inline-flex items-center gap-2 text-left transition-colors enabled:hover:text-primary disabled:cursor-default"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() ? (
                          <SortIcon direction={header.column.getIsSorted()} />
                        ) : null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border transition-colors duration-150 hover:bg-surface/70 focus-within:bg-surface/70"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-4 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}

            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-10 text-center text-sm text-foreground-muted"
                >
                  No listings match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground-muted">
          Missing values are displayed as Not stated. Flagged records remain
          visible unless they are exact duplicate source URLs.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            type="button"
            onClick={handleFilteredCsvDownload}
            disabled={filteredListings.length === 0}
            whileHover={filteredListings.length > 0 ? { y: -1 } : undefined}
            whileTap={filteredListings.length > 0 ? { scale: 0.98 } : undefined}
            className="inline-flex h-10 items-center gap-2 border border-border-strong px-3 font-mono text-xs uppercase tracking-[0.12em] text-foreground-muted transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="size-4" aria-hidden="true" />
            Export Filtered CSV
          </motion.button>

          <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground-subtle">
            Rows
            <select
              value={table.getState().pagination.pageSize}
              onChange={(event) =>
                table.setPageSize(Number(event.target.value))
              }
              className="h-10 border border-border-strong bg-transparent px-2 text-foreground outline-none transition-colors focus:border-primary"
            >
              {[10, 20, 40, 80].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </label>

          <motion.button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            whileHover={table.getCanPreviousPage() ? { y: -1 } : undefined}
            whileTap={table.getCanPreviousPage() ? { scale: 0.98 } : undefined}
            className="inline-flex size-10 items-center justify-center border border-border-strong text-foreground-muted transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </motion.button>

          <span className="min-w-24 text-center font-mono text-xs uppercase tracking-[0.12em] text-foreground-subtle">
            {pageLabel}
          </span>

          <motion.button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            whileHover={table.getCanNextPage() ? { y: -1 } : undefined}
            whileTap={table.getCanNextPage() ? { scale: 0.98 } : undefined}
            className="inline-flex size-10 items-center justify-center border border-border-strong text-foreground-muted transition-colors enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </motion.button>
        </div>
      </div>

      <ListingDetailDrawer
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        returnFocusTo={returnFocusTo}
      />
    </section>
  );
}
