# AI USAGE

Dokumen ini menjelaskan penggunaan AI selama development PALLAS.

## Ringkasan

AI digunakan sebagai pair-programming assistant untuk membantu:

- merancang arsitektur snapshot-first
- membuat Python pipeline
- menyusun parser dan cleansing logic
- menulis test cases
- membangun frontend Next.js
- melakukan refactor UI/UX
- menyusun dokumentasi

AI tidak digunakan untuk membuat data listing palsu. Dataset yang digunakan berasal dari snapshot publik SPEEDHOME yang diproses oleh pipeline.

## Tools yang Digunakan

AI assistant:

- OpenAI Codex melalui workspace.
- Shell command untuk membaca file, menjalankan tests, dan build.
- Patch-based editing untuk perubahan file.

Library dan framework tetap dipilih berdasarkan requirement assessment:

- Python `requests`, `BeautifulSoup4`, `pandas`, `openpyxl`, `pydantic`, `tenacity`, `pytest`
- Next.js 16, React 19, TypeScript, Tailwind CSS
- TanStack Table, Recharts, SheetJS, Zod, Vitest

## Area yang Dibantu AI

### Backend

AI membantu membuat:

- robots.txt validation dengan `urllib.robotparser`
- polite HTTP client dengan delay, jitter, retry, timeout
- access-blocked detection untuk Cloudflare challenge
- saved HTML parser untuk snapshot offline
- normalized listing models
- cleansing pipeline
- segment classification
- analytics pipeline
- JSON, CSV, dan Excel export
- dataset validation script
- pytest coverage

### Frontend

AI membantu membuat:

- Next.js App Router structure
- Vertical Slice Architecture
- static dataset repository
- Zod contracts
- landing page PALLAS
- search/autocomplete
- area intelligence workspace
- listing explorer dengan TanStack Table
- Recharts segment chart
- metric dialog
- listing detail drawer
- dataset downloads
- methodology page
- Vitest tests

### Documentation

AI membantu menyusun:

- README
- Data Dictionary
- Methodology
- AI Usage disclosure

## Review dan Validasi Developer

AI output tidak diterima mentah-mentah.

Developer melakukan:

- membaca dan menantang pendekatan scraping
- mengecek Cloudflare challenge dan memutuskan tidak bypass
- menyimpan public outerHTML snapshot secara manual
- menjalankan parser terhadap fixture nyata
- menjalankan backend tests berkali-kali
- menjalankan frontend lint, typecheck, tests, dan build
- mengecek UI secara manual lewat browser lokal
- meminta adjustment visual dan UX
- memastikan generated data tetap static dan Vercel-compatible

Contoh validasi yang dilakukan:

```powershell
cd backend
python -m pytest
```

```powershell
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

## Keputusan Arsitektur Utama

Keputusan berikut dibuat oleh developer dengan bantuan AI:

1. Menggunakan snapshot-first architecture.
2. Tidak melakukan runtime scraping di Vercel.
3. Tidak memakai database atau API route.
4. Menolak bypass Cloudflare/access control.
5. Menggunakan saved public HTML snapshot sebagai fallback yang etis.
6. Menjadikan Python pipeline sebagai source of truth untuk full-dataset analytics.
7. Mengizinkan frontend menghitung statistik hanya untuk filtered subset.
8. Menggunakan Next.js 16 App Router dan Server Components untuk route composition.
9. Mengisolasi Client Components hanya untuk interaksi seperti chart, filter, drawer, download.
10. Menggunakan feature-first Vertical Slice Architecture.

## Hal yang Tidak Dilakukan AI

AI tidak:

- membuat atau mengarang listing data
- mengklaim data sebagai live jika sebenarnya snapshot
- bypass CAPTCHA, Cloudflare, authentication, atau access control
- menjalankan external paid APIs
- menambahkan database atau backend runtime
- mengganti hasil test tanpa memperbaiki penyebabnya

## Known AI-Assisted Risks

Beberapa bagian yang perlu tetap direview manusia saat pengembangan lanjutan:

- parser HTML dapat berubah jika struktur SPEEDHOME berubah
- visual layout perlu manual QA di berbagai viewport
- saved HTML snapshot perlu diperbarui jika ingin dataset lebih baru
- statistik frontend untuk filtered subset harus tetap dibedakan dari canonical backend analytics

## Verifikasi Terakhir

Status verifikasi terakhir:

- Backend pytest: passed.
- Frontend lint: passed.
- Frontend typecheck: passed.
- Frontend Vitest: passed.
- Frontend production build: passed.

AI output dianggap valid hanya setelah command-command tersebut berhasil dan hasil UI diperiksa secara manual.
