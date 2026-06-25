import type { Metadata } from "next";
import { Geist_Mono, Josefin_Sans } from "next/font/google";

import "./globals.css";

const josefinSans = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PALLAS | Malaysia Rental Market Intelligence",
  description:
    "Property Analytics & Listing-Level Assessment System for public rental listing snapshots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${josefinSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://use.typekit.net" />
        <link
          rel="preconnect"
          href="https://p.typekit.net"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href="https://use.typekit.net/efm1gfs.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
