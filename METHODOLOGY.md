# METHODOLOGY

Dokumen ini menjelaskan metodologi pengumpulan, pembersihan, dan perhitungan statistik PALLAS.

## 1. Sumber Data

Data berasal dari listing rental publik SPEEDHOME area pages, contoh:

```text
https://speedhome.com/rent/mont-kiara
https://speedhome.com/rent/bangsar
https://speedhome.com/rent/klcc
https://speedhome.com/rent/cheras
```

Pipeline didesain untuk melakukan scraping lokal dengan `requests` dan `BeautifulSoup`, bukan scraping runtime di production.

Deployment Vercel tidak mengakses SPEEDHOME. Frontend hanya membaca static JSON di:

```text
frontend/public/data
```

## 2. Robots.txt dan Access Control

Sebelum live scraping, pipeline:

1. Mengambil `https://speedhome.com/robots.txt`.
2. Mengecek URL target dengan `urllib.robotparser`.
3. Menolak scraping jika robots.txt tidak mengizinkan target.
4. Menggunakan user agent:

```text
PropertyPriceIntelligenceAssessment/1.0
```

HTTP client memiliki:

- timeout
- retry untuk HTTP 429 dan 5xx
- exponential backoff
- delay antar request
- random jitter sekitar +/- 30%

Saat development, SPEEDHOME mengembalikan Cloudflare challenge untuk request langsung. Pipeline tidak melakukan bypass terhadap Cloudflare challenge, CAPTCHA, authentication, rate limit, atau access control.

Untuk assessment ini, data final dibangun dari saved public HTML snapshot yang disimpan manual melalui browser, lalu diproses offline. Ini menjaga aplikasi tetap memakai data nyata tanpa melanggar access control.

## 3. Snapshot Architecture

PALLAS memakai snapshot-first architecture:

```text
public SPEEDHOME page
        |
        v
saved HTML snapshot / local scraper
        |
        v
raw JSON
        |
        v
clean JSON + analytics
        |
        v
frontend/public/data
        |
        v
static Next.js dashboard
```

Keuntungan:

- Tidak ada runtime scraping.
- Tidak ada database.
- Tidak ada backend API.
- Tidak perlu environment variables untuk dashboard.
- App tetap berjalan walaupun SPEEDHOME unreachable.

## 4. Parsing Strategy

Parser menghindari ketergantungan tunggal pada generated CSS class.

Prioritas parsing:

1. Data terstruktur di `#__NEXT_DATA__` jika tersedia.
2. JSON-like listing data dari saved HTML snapshot.
3. Anchor/detail URL yang mengarah ke listing.
4. Pattern teks sebagai fallback.

Parser menyimpan warning jika field tertentu tidak bisa diekstrak dengan aman.

## 5. Cleansing dan Normalisasi

Pipeline cleansing melakukan:

- currency cleanup dari teks seperti `RM 3,500` menjadi `3500`
- comma dan whitespace normalization
- sqft parsing dari teks seperti `1,050 sqft`
- bedroom, bathroom, parking normalization
- furnishing normalization
- URL canonicalization
- duplicate removal by canonical source URL
- missing value preservation
- segment classification
- data quality flag generation

Missing value tidak difabrikasi. Jika field tidak tersedia, dataset memakai `null` atau `Unknown`.

## 6. Rental Period Handling

### Monthly

Monthly rent adalah observed price utama dari source snapshot.

### Annual

Jika annual rent tidak tersedia eksplisit tetapi monthly rent tersedia:

```text
annualRentRM = monthlyRentRM * 12
annualRentIsDerived = true
```

UI menandai annual value sebagai derived.

### Daily

Daily rent hanya diisi jika tersedia eksplisit dari source. PALLAS tidak mengubah monthly rent menjadi daily estimate karena itu akan menciptakan data yang tidak ada di sumber.

Jika daily tidak tersedia:

```json
{
  "dailyRentRM": null,
  "dailyRentAvailability": "unavailable"
}
```

## 7. Segment Classification

Segment normal:

| Bedroom Count | Segment |
|---:|---|
| 0 | Studio |
| 1 | 1BR |
| 2 | 2BR |
| 3 | 3BR |
| 4+ | 4BR+ |

Room listing diklasifikasikan dengan keyword matching dari title dan description:

- `small shared` -> `Room - Small Shared`
- `medium shared` -> `Room - Medium Shared`
- `master shared` -> `Room - Master Shared`
- `small private` -> `Room - Small Private`
- `medium private` -> `Room - Medium Private`
- `master private` atau `master bedroom` -> `Room - Master Private`

Jika tipe room tidak jelas, segment menjadi `Unknown` dan record diberi flag `ambiguous_room_type`.

## 8. Statistik Per Segment

Semua statistik harga per segment hanya menggunakan listing dengan `monthlyRentRM` valid.

### Average

Rata-rata aritmetik:

```text
average = sum(prices) / count(prices)
```

### Median

Median numerik standar:

- Jika jumlah data ganjil: nilai tengah.
- Jika jumlah data genap: rata-rata dua nilai tengah.

### Mode

Mode hanya dianggap valid jika ada harga yang muncul lebih dari satu kali.

Jika semua harga unik:

```json
{
  "modeMonthlyRentRM": null,
  "modeStatus": "no_repeated_price"
}
```

Jika ada beberapa mode:

```json
{
  "multipleModes": true,
  "allModes": [2500, 2800]
}
```

## 9. Quartile, IQR, dan Outlier

Untuk segment dengan data cukup:

```text
IQR = Q3 - Q1
lowerBound = Q1 - 1.5 * IQR
upperBound = Q3 + 1.5 * IQR
```

Harga di luar `[lowerBound, upperBound]` dihitung sebagai outlier untuk kebutuhan Fair Price dan insight. Record listing tetap dipertahankan di dataset dan tabel.

## 10. Fair Price

Fair Price adalah estimasi harga representatif berbasis snapshot. Ini bukan appraisal resmi.

Algorithm:

1. Ambil semua `monthlyRentRM` valid pada segment.
2. Jika jumlah data kurang dari 3:

```json
{
  "fairPriceRM": null,
  "fairPriceStatus": "insufficient_data"
}
```

3. Jika jumlah data 3:
   - Gunakan median langsung.
4. Jika jumlah data 4 atau lebih:
   - Hitung Q1, Q3, dan IQR.
   - Hapus harga di luar IQR bounds.
   - Hitung filtered median.
   - Hitung 10% trimmed mean dari filtered values.
   - Gabungkan:

```text
fairPrice = 0.5 * filteredMedian + 0.5 * trimmedMean
```

5. Round ke RM terdekat sesuai policy pipeline.

Alasan memakai Fair Price:

- Median tahan terhadap outlier.
- Trimmed mean tetap menangkap arah rata-rata pasar tanpa terlalu didominasi listing ekstrem.
- Gabungan keduanya memberi estimasi yang stabil untuk sample kecil-menengah.

## 11. Data Confidence

Confidence hanya berdasarkan sample size, bukan kepastian appraisal.

| Valid Price Count | Confidence |
|---:|---|
| 1-2 | Very Low |
| 3-4 | Low |
| 5-9 | Moderate |
| 10+ | Higher |

UI menampilkan confidence sebagai konteks kualitas sample, bukan rekomendasi investasi.

## 12. Price per Sqft

Price per sqft dihitung hanya jika:

- `monthlyRentRM` valid
- `sizeSqft` valid
- `sizeSqft > 0`

Formula:

```text
rentPerSqft = monthlyRentRM / sizeSqft
```

Pipeline menyimpan average dan median rent per sqft jika data cukup tersedia.

## 13. Furnishing Premium

Furnishing premium dihitung dengan membandingkan median:

```text
premiumRM = median(Fully Furnished) - median(Unfurnished)
premiumPercentage = premiumRM / median(Unfurnished) * 100
```

Premium hanya ditampilkan jika kedua kelompok memiliki sample yang cukup. Jika sample tidak cukup, dataset menyimpan `available: false` dan alasan unavailable.

## 14. Data Completeness

Completeness dihitung untuk membantu pembaca memahami kualitas snapshot:

```text
priceCompleteness = validPriceCount / totalListings * 100
sizeCompleteness = validSizeCount / totalListings * 100
furnishingKnown = knownFurnishingCount / totalListings * 100
```

## 15. Data Quality Flags

Flag digunakan untuk transparansi, bukan untuk menyembunyikan listing.

Contoh:

- `missing_price`
- `missing_size`
- `missing_furnishing`
- `suspicious_size`
- `duplicate_source_url`
- `inconsistent_bedroom_value`
- `detail_page_unavailable`
- `ambiguous_room_type`

Record tetap terlihat di listing table kecuali exact duplicate berdasarkan canonical source URL.

## 16. Frontend Filtered Statistics

Canonical full-dataset statistics berasal dari Python pipeline.

Frontend menghitung statistik tambahan hanya untuk subset filter aktif pada Listing Explorer, misalnya:

- jumlah matched records
- valid prices
- median rent subset
- observed range subset
- average RM per sqft subset

Perhitungan ini tidak mengganti statistik canonical dataset.

## 17. Limitasi

- Snapshot dapat menjadi stale setelah listing berubah di SPEEDHOME.
- Tidak semua field tersedia pada semua listing.
- Cloudflare challenge mencegah live `requests` scraping; pipeline tidak melakukan bypass.
- Saved HTML snapshot hanya mencakup halaman yang disimpan saat development.
- Fair Price bergantung pada kualitas dan ukuran sample.
- PALLAS bukan financial advice, valuation, atau appraisal resmi.

## Disclaimer

PALLAS adalah aplikasi technical assessment independen dan tidak berafiliasi dengan atau didukung oleh SPEEDHOME. Harga berbasis snapshot listing publik dan dapat berubah setelah waktu pengumpulan data.
