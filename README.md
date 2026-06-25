# PALLAS - Malaysia Rental Market Intelligence

PALLAS adalah aplikasi Property Analytics & Listing-Level Assessment System untuk membaca snapshot listing rental publik dari SPEEDHOME, membersihkan datanya, menghitung statistik harga per segmen unit, lalu menampilkannya sebagai workspace Business Intelligence berbasis Next.js.

Project ini dibuat untuk technical assessment Jendela360. Data listing yang digunakan adalah data nyata dari snapshot publik SPEEDHOME, bukan mock data atau data buatan.

## Ringkasan Produk

Fitur utama:

- Search area atau paste URL SPEEDHOME area.
- Static market registry untuk area yang tersedia di snapshot.
- Area intelligence page dengan workspace `Overview`, `Listings`, `Insights`, dan `Data`.
- Segment rent comparison chart menggunakan Recharts.
- Listing explorer menggunakan TanStack Table dengan search, filter, sorting, pagination, dan drawer detail listing.
- Download dataset sebagai JSON, CSV, dan Excel.
- Methodology page untuk menjelaskan data source, cleansing, statistik, dan limitasi.
- Vercel-ready tanpa database, API route, authentication, atau runtime scraping.

Area snapshot saat ini:

| Area | Listing |
|---|---:|
| Bangsar | 30 |
| Cheras | 40 |
| KLCC | 40 |
| Mont Kiara | 40 |

Total: 150 listing.

## Arsitektur Snapshot-First

PALLAS memakai arsitektur static snapshot:

```text
SPEEDHOME public area pages
        |
        | local developer step
        v
Python pipeline
  - robots.txt validation
  - polite request client
  - saved HTML snapshot parser
  - cleansing and normalization
  - analytics and fair price calculation
  - JSON / CSV / Excel export
        |
        v
frontend/public/data
  - manifest.json
  - areas/{area-slug}.json
        |
        v
Next.js 16 static app
  - Server Components load static JSON
  - Client Components handle search, filters, charts, downloads
        |
        v
Vercel free-tier static deployment
```

Deployment tidak mengakses SPEEDHOME saat runtime atau saat Vercel build. Jika SPEEDHOME sedang tidak bisa diakses, aplikasi tetap berjalan karena dataset sudah committed sebagai static JSON.

## Struktur Repository

```text
.
├── backend/
│   ├── pipeline/
│   │   ├── speedhome/
│   │   │   ├── client.py
│   │   │   ├── models.py
│   │   │   ├── parser.py
│   │   │   └── robots.py
│   │   ├── analytics.py
│   │   ├── cleansing.py
│   │   ├── export.py
│   │   └── utils.py
│   ├── scripts/
│   │   ├── scrape_speedhome.py
│   │   ├── parse_saved_speedhome_html.py
│   │   ├── build_dataset.py
│   │   └── validate_dataset.py
│   ├── tests/
│   ├── data/
│   │   ├── raw/
│   │   ├── clean/
│   │   └── exports/
│   └── requirements.txt
│
├── frontend/
│   ├── public/data/
│   │   ├── manifest.json
│   │   └── areas/
│   ├── src/app/
│   ├── src/features/
│   ├── src/shared/
│   └── package.json
│
├── AI_USAGE.md
├── DATA_DICTIONARY.md
├── METHODOLOGY.md
└── README.md
```

## Frontend Architecture

Frontend menggunakan Next.js 16 App Router dengan Vertical Slice Architecture.

Feature ownership:

- `property-search`: SPEEDHOME URL parsing, area matching, search ranking, autocomplete.
- `area-intelligence`: dataset contracts, static dataset loading, market record page, overview, rental availability, metric dialogs.
- `listing-explorer`: TanStack Table, listing filters, filtered summary, listing detail drawer.
- `market-insights`: Recharts segment comparison, deterministic market observations.
- `dataset-export`: CSV mapping, Excel workbook generation, JSON/CSV browser downloads.
- `shared`: formatting helpers and reusable UI primitives.

Dependency direction yang dijaga:

```text
presentation -> application -> domain
infrastructure -> application/domain
app -> feature public APIs
features -> shared
```

Route files di `src/app` hanya menjadi composition layer. Business logic, parsing, filtering, export mapping, dan analytics ditempatkan di feature atau backend pipeline.

## Local Setup

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Catatan: development terakhir dijalankan dengan Python 3.14. Jika dependency native seperti `pydantic-core` gagal pada versi Python baru, gunakan versi dependency terbaru dari `requirements.txt` atau gunakan Python 3.12/3.13.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Local app:

```text
http://localhost:3000
```

## Dataset Generation

### Live scraping attempt

Live scraper tersedia dan tetap menghormati robots.txt:

```powershell
cd backend
python scripts/scrape_speedhome.py --area "Mont Kiara" --max-pages 5
```

SPEEDHOME mengembalikan Cloudflare challenge untuk request langsung dari `requests`. Pipeline tidak melakukan bypass terhadap challenge, CAPTCHA, rate-limit, authentication, atau access control.

Karena itu, dataset final assessment dibuat dari saved outerHTML snapshot publik yang disimpan manual dari browser, lalu diproses secara offline:

```powershell
cd backend
python scripts/parse_saved_speedhome_html.py --input pipeline/fixtures/mont-kiara-page1.html --area "Mont Kiara" --output-dir data/raw
python scripts/parse_saved_speedhome_html.py --input pipeline/fixtures/bangsar-page1.html --area "Bangsar" --output-dir data/raw
python scripts/parse_saved_speedhome_html.py --input pipeline/fixtures/klcc-page1.html --area "KLCC" --output-dir data/raw
python scripts/parse_saved_speedhome_html.py --input pipeline/fixtures/cheras-page1.html --area "Cheras" --output-dir data/raw
```

Build clean dataset dan export:

```powershell
cd backend
python scripts/build_dataset.py --input data/raw/mont-kiara.json --output data/clean/mont-kiara.json --exports-dir data/exports
python scripts/build_dataset.py --input data/raw/bangsar.json --output data/clean/bangsar.json --exports-dir data/exports
python scripts/build_dataset.py --input data/raw/klcc.json --output data/clean/klcc.json --exports-dir data/exports
python scripts/build_dataset.py --input data/raw/cheras.json --output data/clean/cheras.json --exports-dir data/exports
```

Validate dan copy ke frontend public data:

```powershell
cd backend
python scripts/validate_dataset.py --areas-dir data/clean --manifest-output data/clean/manifest.json --copy-to-public
```

Output frontend:

```text
frontend/public/data/manifest.json
frontend/public/data/areas/bangsar.json
frontend/public/data/areas/cheras.json
frontend/public/data/areas/klcc.json
frontend/public/data/areas/mont-kiara.json
```

## Testing dan Build

Backend:

```powershell
cd backend
python -m pytest
```

Frontend:

```powershell
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

Hasil terakhir:

- Backend: 47 pytest passed.
- Frontend: lint passed.
- Frontend: typecheck passed.
- Frontend: 34 Vitest tests passed.
- Frontend: production build passed.
- Area routes generated statically: `/area/bangsar`, `/area/cheras`, `/area/klcc`, `/area/mont-kiara`.

## Vercel Deployment

Project ini dapat deploy ke Vercel free tier tanpa environment variables.

Recommended settings:

```text
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Install Command: npm install
Output Directory: .next
```

Tidak perlu:

- database
- auth
- paid API
- backend runtime
- environment variables
- scraping saat deployment

Direct route seperti `/area/mont-kiara` akan bekerja karena menggunakan `generateStaticParams()` dari static manifest.

## Dataset Refresh

Untuk refresh dataset:

1. Cek robots.txt dan coba live scraper.
2. Jika SPEEDHOME tetap memberi Cloudflare challenge, jangan bypass.
3. Simpan outerHTML area page publik secara manual ke `backend/pipeline/fixtures/`.
4. Jalankan `parse_saved_speedhome_html.py`.
5. Jalankan `build_dataset.py`.
6. Jalankan `validate_dataset.py --copy-to-public`.
7. Jalankan backend dan frontend tests.
8. Commit perubahan JSON di `frontend/public/data`.

## Asumsi dan Limitasi

- SPEEDHOME live request via `requests` mengembalikan Cloudflare challenge. Pipeline menolak bypass dan menyimpan error sebagai `access_blocked`.
- Dataset assessment dibuat dari saved public HTML snapshot, bukan runtime scraping.
- Snapshot saat ini hanya memuat page yang tersedia di fixtures lokal.
- Harga listing dapat berubah setelah snapshot dibuat.
- Fair Price adalah estimasi representatif berbasis snapshot, bukan appraisal resmi.
- Daily rental tidak dihitung dari monthly rental karena tidak tersedia eksplisit pada source snapshot.
- Annual rent diturunkan dari monthly rent x 12 dan ditandai sebagai derived.
- Frontend boleh menghitung statistik untuk subset filter aktif, tetapi statistik canonical full dataset berasal dari Python pipeline.

## Assessment Checklist

- [x] Data SPEEDHOME nyata digunakan.
- [x] Tidak ada mock atau fabricated listing data.
- [x] Scraper mengecek robots.txt.
- [x] Request client memiliki retry, timeout, delay, dan jitter.
- [x] Cloudflare/access-control tidak dibypass.
- [x] Parser saved HTML snapshot tersedia untuk workflow offline.
- [x] Listing dideduplicate berdasarkan canonical source URL.
- [x] Missing value dipertahankan sebagai `null` / `Unknown`.
- [x] Segment classification tersedia.
- [x] Monthly, annual derived, dan daily unavailable ditangani eksplisit.
- [x] Average, median, mode, quartile, IQR, outlier, Fair Price dihitung di backend.
- [x] JSON, CSV, dan Excel export tersedia.
- [x] Static JSON committed di `frontend/public/data`.
- [x] Search menerima area name dan SPEEDHOME URL.
- [x] Area routes di-generate statically.
- [x] Unit listing table memakai TanStack Table.
- [x] Charts memakai Recharts.
- [x] Browser download memakai SheetJS.
- [x] Methodology page tersedia.
- [x] Frontend dan backend tests pass.
- [x] Production build pass.

## Disclaimer

PALLAS adalah aplikasi technical assessment independen dan tidak berafiliasi dengan atau didukung oleh SPEEDHOME. Harga berbasis snapshot listing publik dan dapat berubah setelah waktu pengumpulan data.
