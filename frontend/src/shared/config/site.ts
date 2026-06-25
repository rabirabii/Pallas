const vercelUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const siteConfig = {
  name: "PALLAS",
  title: "PALLAS | Malaysia Rental Market Intelligence",
  description:
    "Property Analytics & Listing-Level Assessment System for public SPEEDHOME rental listing snapshots.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (vercelUrl ? `https://${vercelUrl}` : undefined) ??
    "https://pallas-rental-intelligence.vercel.app",
  locale: "en_MY",
  creator: "PALLAS",
};

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
