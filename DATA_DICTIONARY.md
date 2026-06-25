# DATA DICTIONARY

Dokumen ini menjelaskan struktur dataset canonical yang dikonsumsi frontend PALLAS.

Lokasi dataset:

```text
frontend/public/data/manifest.json
frontend/public/data/areas/{area-slug}.json
```

## Manifest

`manifest.json` menjadi daftar area yang tersedia untuk search, autocomplete, dan static route generation.

| Field | Type | Deskripsi |
|---|---|---|
| `generatedAt` | string ISO 8601 | Waktu manifest dibuat oleh validation script. |
| `areas` | array | Daftar area snapshot yang tersedia. |

### Manifest Area

| Field | Type | Deskripsi |
|---|---|---|
| `name` | string | Nama area untuk UI, contoh `Mont Kiara`. |
| `slug` | string | Slug URL area, contoh `mont-kiara`. |
| `sourceUrl` | string | URL SPEEDHOME area page. |
| `listingCount` | number | Jumlah listing canonical pada snapshot area. |
| `scrapedAt` | string ISO 8601 | Waktu snapshot area diambil/diproses. |

## Area Dataset

Setiap file `areas/{area-slug}.json` memiliki struktur utama berikut:

| Field | Type | Deskripsi |
|---|---|---|
| `metadata` | object | Metadata snapshot area. |
| `rentalTypes` | object | Ketersediaan daily, monthly, annual rental. |
| `summaries` | array | Statistik harga per segmen unit. |
| `listings` | array | Listing canonical yang sudah dibersihkan. |
| `marketInsights` | object | Insight agregat tambahan untuk UI. |
| `qualityReport` | object | Ringkasan kualitas data. |

## Metadata

| Field | Type | Deskripsi |
|---|---|---|
| `areaName` | string | Nama area. |
| `areaSlug` | string | Slug area. |
| `sourceUrl` | string | URL SPEEDHOME area page. |
| `scrapedAt` | string ISO 8601 | Waktu snapshot diproses. |
| `listingCount` | number | Jumlah listing setelah deduplication. |
| `validPriceCount` | number | Jumlah listing dengan `monthlyRentRM` valid. |
| `currency` | `"MYR"` | Currency canonical dataset. |
| `sizeUnit` | `"sqft"` | Unit ukuran luas canonical dataset. |
| `dataMode` | `"snapshot"` | Menandakan data bersifat static snapshot. |
| `methodologyVersion` | string | Versi metodologi pipeline. |

## PropertyListing

| Field | Type | Deskripsi |
|---|---|---|
| `id` | string | ID deterministic dari canonical source URL. |
| `title` | string | Judul listing. |
| `propertyName` | string \| null | Nama properti jika tersedia. |
| `areaName` | string | Nama area listing. |
| `areaSlug` | string | Slug area listing. |
| `segment` | string | Segment unit, contoh `Studio`, `1BR`, `2BR`, `3BR`, `4BR+`, room segment, atau `Unknown`. |
| `bedroomCount` | number \| null | Jumlah bedroom canonical. |
| `bathroomCount` | number \| null | Jumlah bathroom canonical. |
| `parkingCount` | number \| null | Jumlah parking canonical. |
| `monthlyRentRM` | number \| null | Harga rental bulanan dalam RM. Null jika tidak valid atau tidak tersedia. |
| `annualRentRM` | number \| null | Harga rental tahunan. Biasanya `monthlyRentRM * 12`. |
| `annualRentIsDerived` | boolean | `true` jika annual rent diturunkan dari monthly rent. |
| `dailyRentRM` | number \| null | Harga rental harian jika eksplisit tersedia dari source. |
| `dailyRentAvailability` | `"available"` \| `"unavailable"` \| `"unknown"` | Status ketersediaan daily rent. |
| `sizeSqft` | number \| null | Luas unit dalam sqft. |
| `furnishing` | `"Fully Furnished"` \| `"Partially Furnished"` \| `"Unfurnished"` \| `"Unknown"` | Status furnishing canonical. |
| `minimumTenureMonths` | number \| null | Minimum tenure dalam bulan jika tersedia. |
| `moveInStatus` | string \| null | Status move-in jika tersedia. |
| `moveInDate` | string \| null | Tanggal move-in jika tersedia. |
| `verified` | boolean \| null | Status verified dari listing/source text jika tersedia. |
| `zeroDeposit` | boolean \| null | Status zero deposit jika tersedia. |
| `sourceUrl` | string | Canonical SPEEDHOME listing URL. |
| `sourcePage` | number | Halaman source area tempat listing ditemukan. |
| `scrapedAt` | string ISO 8601 | Waktu snapshot listing diproses. |
| `parseWarnings` | string[] | Warning parser per listing. |
| `dataQualityFlags` | string[] | Flag kualitas data per listing. |

## Segment Rules

| Kondisi | Segment |
|---|---|
| `bedroomCount = 0` | `Studio` |
| `bedroomCount = 1` | `1BR` |
| `bedroomCount = 2` | `2BR` |
| `bedroomCount = 3` | `3BR` |
| `bedroomCount >= 4` | `4BR+` |
| Room keyword: `small shared` | `Room - Small Shared` |
| Room keyword: `medium shared` | `Room - Medium Shared` |
| Room keyword: `master shared` | `Room - Master Shared` |
| Room keyword: `small private` | `Room - Small Private` |
| Room keyword: `medium private` | `Room - Medium Private` |
| Room keyword: `master private` atau `master bedroom` | `Room - Master Private` |
| Tidak dapat ditentukan | `Unknown` |

## Rental Types

| Field | Type | Deskripsi |
|---|---|---|
| `available` | boolean | Apakah rental period tersedia. |
| `derived` | boolean \| null | Apakah nilai rental diturunkan dari rental period lain. |
| `formula` | string \| null | Formula derivasi, contoh `monthlyRentRM * 12`. |
| `reason` | string \| null | Alasan unavailable atau catatan tambahan. |

Monthly adalah observed price utama. Annual diturunkan dari monthly jika tidak tersedia eksplisit. Daily hanya diisi jika tersedia eksplisit; tidak dihitung dari monthly.

## PriceSummary

Statistik dihitung per `segment` menggunakan listing dengan `monthlyRentRM` valid.

| Field | Type | Deskripsi |
|---|---|---|
| `segment` | string | Segment unit. |
| `unitCount` | number | Jumlah listing pada segment. |
| `validPriceCount` | number | Jumlah listing segment dengan harga valid. |
| `averageMonthlyRentRM` | number \| null | Rata-rata monthly rent. |
| `medianMonthlyRentRM` | number \| null | Median monthly rent. |
| `minimumMonthlyRentRM` | number \| null | Harga minimum observed. |
| `maximumMonthlyRentRM` | number \| null | Harga maksimum observed. |
| `priceRangeRM` | number \| null | Selisih harga maksimum dan minimum. |
| `q1MonthlyRentRM` | number \| null | Kuartil pertama. |
| `q3MonthlyRentRM` | number \| null | Kuartil ketiga. |
| `iqrMonthlyRentRM` | number \| null | Interquartile range. |
| `averageRentPerSqftRM` | number \| null | Rata-rata RM per sqft. |
| `medianRentPerSqftRM` | number \| null | Median RM per sqft. |
| `outlierCount` | number | Jumlah outlier berdasarkan IQR bounds. |
| `lowerOutlierBoundRM` | number \| null | Lower outlier bound. |
| `upperOutlierBoundRM` | number \| null | Upper outlier bound. |
| `meanMedianGapRM` | number \| null | Selisih mean dan median. |
| `meanMedianGapPercentage` | number \| null | Selisih mean dan median dalam persen terhadap median. |
| `listingSharePercentage` | number | Share listing segment terhadap total listing area. |
| `modeMonthlyRentRM` | number \| null | Mode harga jika ada harga yang berulang. |
| `modeStatus` | `"available"` \| `"no_repeated_price"` \| `"insufficient_data"` | Status mode. |
| `multipleModes` | boolean | `true` jika ada lebih dari satu mode. |
| `allModes` | number[] | Semua mode yang ditemukan. |
| `fairPriceRM` | number \| null | Estimasi harga representatif. |
| `fairPriceStatus` | `"available"` \| `"insufficient_data"` | Status Fair Price. |
| `averageSizeSqft` | number \| null | Rata-rata luas unit. |
| `dataConfidence` | `"Very Low"` \| `"Low"` \| `"Moderate"` \| `"Higher"` | Confidence berbasis sample size. |

## MarketInsights

| Field | Type | Deskripsi |
|---|---|---|
| `dataCompleteness` | object | Persentase kelengkapan price, size, furnishing. |
| `furnishingBreakdown` | array | Distribusi listing berdasarkan furnishing. |
| `furnishingPremium` | object | Selisih median Fully Furnished vs Unfurnished jika sample cukup. |

### DataCompleteness

| Field | Type | Deskripsi |
|---|---|---|
| `totalListings` | number | Total listing area. |
| `priceCompletenessPercentage` | number | Persentase listing dengan monthly price valid. |
| `sizeCompletenessPercentage` | number | Persentase listing dengan size valid. |
| `furnishingKnownPercentage` | number | Persentase listing dengan furnishing bukan `Unknown`. |

### FurnishingBreakdownItem

| Field | Type | Deskripsi |
|---|---|---|
| `furnishing` | string | Furnishing category. |
| `listingCount` | number | Jumlah listing pada category. |
| `listingSharePercentage` | number | Share category terhadap total listing. |
| `medianMonthlyRentRM` | number \| null | Median rent category. |

### FurnishingPremium

| Field | Type | Deskripsi |
|---|---|---|
| `available` | boolean | Apakah premium dapat dihitung. |
| `fullyFurnishedMedianRM` | number \| null | Median Fully Furnished. |
| `unfurnishedMedianRM` | number \| null | Median Unfurnished. |
| `premiumRM` | number \| null | Selisih median dalam RM. |
| `premiumPercentage` | number \| null | Selisih median dalam persen. |
| `reason` | string \| null | Alasan unavailable jika sample tidak cukup. |

## QualityReport

| Field | Type | Deskripsi |
|---|---|---|
| `missingPriceCount` | number | Jumlah listing tanpa monthly price valid. |
| `missingSizeCount` | number | Jumlah listing tanpa size valid. |
| `unknownFurnishingCount` | number | Jumlah listing dengan furnishing `Unknown`. |
| `warningCount` | number | Total parser warning. |

## Data Quality Flags

| Flag | Deskripsi |
|---|---|
| `missing_price` | Monthly rent tidak tersedia atau gagal dinormalisasi. |
| `missing_size` | Size tidak tersedia atau gagal dinormalisasi. |
| `missing_furnishing` | Furnishing tidak tersedia sehingga menjadi `Unknown`. |
| `suspicious_size` | Size terlihat tidak wajar tetapi record tetap dipertahankan. |
| `duplicate_source_url` | Listing duplicate berdasarkan canonical source URL. |
| `inconsistent_bedroom_value` | Bedroom value tidak konsisten atau gagal diparse dengan aman. |
| `detail_page_unavailable` | Detail page tidak tersedia saat pipeline berjalan. |
| `ambiguous_room_type` | Room listing terdeteksi tetapi tipe room tidak jelas. |
