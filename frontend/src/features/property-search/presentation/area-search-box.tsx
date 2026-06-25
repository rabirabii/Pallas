"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import type { ManifestArea } from "@/features/area-intelligence";
import {
  findAreaBySlug,
  looksLikeUrl,
  parseSpeedhomeRentUrl,
  searchAreas,
} from "@/features/property-search";
import {
  formatDateTime,
  formatNumber,
} from "@/shared/formatting/number-format";

type AreaSearchBoxProps = {
  areas: ManifestArea[];
};

export function AreaSearchBox({ areas }: AreaSearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const matches = useMemo(() => searchAreas(areas, query), [areas, query]);
  const showSuggestions = query.trim().length > 0 && matches.length > 0;

  function navigateToArea(area: ManifestArea) {
    router.push(`/area/${area.slug}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = query.trim();
    setMessage(null);

    if (!trimmed) {
      setMessage("Enter an area name or paste a SPEEDHOME rental URL.");
      return;
    }

    if (looksLikeUrl(trimmed)) {
      const parsed = parseSpeedhomeRentUrl(trimmed);

      if (!parsed.ok) {
        setMessage(parsed.reason);
        return;
      }

      const area = findAreaBySlug(areas, parsed.slug);
      if (!area) {
        setMessage(
          "This area is not yet in the snapshot. Run the scraper locally to add it.",
        );
        return;
      }

      navigateToArea(area);
      return;
    }

    const [bestMatch] = matches;
    if (!bestMatch) {
      setMessage(
        "This area is not yet in the snapshot. Run the scraper locally to add it.",
      );
      return;
    }

    navigateToArea(bestMatch);
  }

  return (
    <div className="relative">
      <div className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-accent-dark">
        Market Query
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-y border-border-strong bg-surface-raised/60 py-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="area-search">
            Search area or paste SPEEDHOME URL
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-subtle"
            />
            <input
              id="area-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setMessage(null);
              }}
              placeholder="Search an area"
              className="h-14 w-full border-0 border-b border-border bg-transparent pl-8 pr-4 text-base text-foreground placeholder:text-foreground-subtle focus:border-primary focus:outline-none"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className="h-14 border border-primary-strong bg-primary px-6 text-sm font-semibold uppercase tracking-[0.14em] text-surface-raised transition hover:bg-primary-strong"
          >
            Open Record
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showSuggestions ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="absolute z-20 mt-2 w-full border border-border-strong bg-surface-raised shadow-[0_16px_50px_rgba(41,41,35,0.12)]"
          >
            <div className="border-b border-border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
              Snapshot Areas
            </div>
            <ul className="max-h-80 overflow-auto">
              {matches.map((area) => (
                <li key={area.slug}>
                  <button
                    type="button"
                    onClick={() => navigateToArea(area)}
                    className="grid w-full grid-cols-1 gap-1 border-b border-border px-4 py-3 text-left transition hover:bg-surface focus:bg-surface sm:grid-cols-[1fr_auto]"
                  >
                    <span>
                      <span className="block font-semibold text-foreground">
                        {area.name}
                      </span>
                      <span className="block text-sm text-foreground-muted">
                        {area.sourceUrl}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-foreground-muted sm:text-right">
                      {formatNumber(area.listingCount)} listings
                      <br />
                      {formatDateTime(area.scrapedAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {message ? (
        <p className="mt-3 border-l-2 border-primary bg-surface px-4 py-3 text-sm text-foreground-muted">
          {message}
        </p>
      ) : null}
    </div>
  );
}
