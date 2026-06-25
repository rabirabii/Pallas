import type { PropertyListing } from "@/features/area-intelligence";
import {
  formatNullableText,
  formatNumber,
  formatRM,
  formatSqft,
} from "@/shared/formatting/number-format";
import { SectionHeading } from "@/shared/ui/section-heading";

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

export function ListingRegistryTable({
  listings,
  areaName,
}: {
  listings: PropertyListing[];
  areaName: string;
}) {
  return (
    <section className="py-12">
      <SectionHeading
        marker="IV."
        eyebrow="Listing Registry"
        title="Observed Unit Listings"
      >
        Source links open SPEEDHOME listing pages for verification.
      </SectionHeading>

      <div className="mt-8 overflow-x-auto border-y border-border-strong">
        <table className="min-w-[1320px] w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            Observed rental listings for {areaName}
          </caption>
          <thead>
            <tr className="border-b border-border font-mono text-xs uppercase tracking-[0.12em] text-foreground-subtle">
              <th scope="col" className="px-3 py-4 font-semibold">
                Listing
              </th>
              <th scope="col" className="px-3 py-4 font-semibold">
                Property / Area
              </th>
              <th scope="col" className="px-3 py-4 font-semibold">
                Segment
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Beds
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Baths
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Parking
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Monthly
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Annual
              </th>
              <th scope="col" className="px-3 py-4 text-right font-semibold">
                Size
              </th>
              <th scope="col" className="px-3 py-4 font-semibold">
                Furnishing
              </th>
              <th scope="col" className="px-3 py-4 font-semibold">
                Quality Flags
              </th>
              <th scope="col" className="px-3 py-4 font-semibold">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr
                key={listing.id}
                className="border-b border-border transition-colors hover:bg-surface/70"
              >
                <th
                  scope="row"
                  className="max-w-[260px] px-3 py-4 align-top font-semibold text-foreground"
                >
                  {listing.title}
                </th>
                <td className="max-w-[220px] px-3 py-4 align-top text-foreground-muted">
                  {formatNullableText(listing.propertyName ?? listing.areaName)}
                </td>
                <td className="px-3 py-4 align-top font-mono">
                  {listing.segment}
                </td>
                <td className="px-3 py-4 text-right align-top font-mono">
                  {formatCount(listing.bedroomCount)}
                </td>
                <td className="px-3 py-4 text-right align-top font-mono">
                  {formatCount(listing.bathroomCount)}
                </td>
                <td className="px-3 py-4 text-right align-top font-mono">
                  {formatCount(listing.parkingCount)}
                </td>
                <td className="px-3 py-4 text-right align-top font-mono">
                  {formatRM(listing.monthlyRentRM)}
                </td>
                <td className="px-3 py-4 text-right align-top font-mono">
                  <span>{formatRM(listing.annualRentRM)}</span>
                  {listing.annualRentIsDerived ? (
                    <span className="mt-1 block text-[11px] uppercase tracking-[0.1em] text-foreground-subtle">
                      Derived
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-4 text-right align-top font-mono">
                  {formatSqft(listing.sizeSqft)}
                </td>
                <td className="px-3 py-4 align-top">{listing.furnishing}</td>
                <td className="max-w-[240px] px-3 py-4 align-top text-foreground-muted">
                  {formatFlags(listing.dataQualityFlags)}
                </td>
                <td className="px-3 py-4 align-top">
                  <a
                    href={listing.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs uppercase tracking-[0.12em] text-primary"
                  >
                    Verify →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-foreground-muted">
        Missing values are displayed as Not stated. Flagged records remain
        visible unless they are exact duplicate source URLs.
      </p>
    </section>
  );
}
