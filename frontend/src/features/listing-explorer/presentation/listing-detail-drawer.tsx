"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { PropertyListing } from "@/features/area-intelligence";
import {
  formatDateTime,
  formatNullableText,
  formatNumber,
  formatRM,
  formatSqft,
} from "@/shared/formatting/number-format";

function formatCount(value: number | null): string {
  return value === null ? "Not stated" : formatNumber(value);
}

function formatBoolean(value: boolean | null): string {
  if (value === null) {
    return "Not stated";
  }

  return value ? "Yes" : "No";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[1fr_1.2fr] sm:gap-4">
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-subtle">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function ListingDetailDrawer({
  listing,
  onClose,
  returnFocusTo,
}: {
  listing: PropertyListing | null;
  onClose: () => void;
  returnFocusTo: HTMLElement | null;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!listing) {
      return;
    }

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      returnFocusTo?.focus();
    };
  }, [listing, onClose, returnFocusTo]);

  return (
    <AnimatePresence>
      {listing ? (
        <motion.div
          className="fixed inset-0 z-50 bg-foreground/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-drawer-title"
            aria-describedby="listing-drawer-description"
            className="absolute bottom-0 right-0 flex h-[88vh] w-full flex-col border-l border-border-strong bg-surface-raised shadow-2xl sm:h-full sm:max-w-xl"
            initial={{
              opacity: 0,
              x: reduceMotion ? 0 : 24,
              y: reduceMotion ? 0 : 16,
            }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{
              opacity: 0,
              x: reduceMotion ? 0 : 24,
              y: reduceMotion ? 0 : 16,
            }}
            transition={{ duration: reduceMotion ? 0.01 : 0.24 }}
          >
            <div className="flex items-start justify-between gap-5 border-b border-border px-5 py-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-dark">
                  Listing Record
                </p>
                <h2
                  id="listing-drawer-title"
                  className="mt-3 text-2xl font-semibold text-foreground"
                >
                  {listing.title}
                </h2>
                <p
                  id="listing-drawer-description"
                  className="mt-2 text-sm text-foreground-muted"
                >
                  Snapshot listing metadata from the current static dataset.
                </p>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close listing detail"
                className="inline-flex size-10 shrink-0 items-center justify-center border border-border-strong text-foreground-muted transition-colors hover:border-primary hover:text-primary"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <dl>
                <DetailRow
                  label="Property / Area"
                  value={`${formatNullableText(listing.propertyName)} / ${
                    listing.areaName
                  }`}
                />
                <DetailRow label="Segment" value={listing.segment} />
                <DetailRow
                  label="Bedrooms"
                  value={formatCount(listing.bedroomCount)}
                />
                <DetailRow
                  label="Bathrooms"
                  value={formatCount(listing.bathroomCount)}
                />
                <DetailRow
                  label="Parking"
                  value={formatCount(listing.parkingCount)}
                />
                <DetailRow
                  label="Monthly Rent"
                  value={formatRM(listing.monthlyRentRM)}
                />
                <DetailRow
                  label="Annual Rent"
                  value={`${formatRM(listing.annualRentRM)}${
                    listing.annualRentIsDerived ? " (derived)" : ""
                  }`}
                />
                <DetailRow label="Size" value={formatSqft(listing.sizeSqft)} />
                <DetailRow label="Furnishing" value={listing.furnishing} />
                <DetailRow
                  label="Minimum Tenure"
                  value={
                    listing.minimumTenureMonths === null
                      ? "Not stated"
                      : `${listing.minimumTenureMonths} months`
                  }
                />
                <DetailRow
                  label="Verified"
                  value={formatBoolean(listing.verified)}
                />
                <DetailRow
                  label="Zero Deposit"
                  value={formatBoolean(listing.zeroDeposit)}
                />
                <DetailRow
                  label="Quality Flags"
                  value={
                    listing.dataQualityFlags.length === 0
                      ? "None"
                      : listing.dataQualityFlags.join(", ")
                  }
                />
                <DetailRow
                  label="Snapshot"
                  value={formatDateTime(listing.scrapedAt)}
                />
              </dl>
            </div>

            <div className="border-t border-border p-5">
              <a
                href={listing.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 border border-primary-strong bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-foreground-inverse transition-colors hover:bg-primary-strong"
              >
                Open on SPEEDHOME
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
