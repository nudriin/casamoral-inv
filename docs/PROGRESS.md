# Casa Moral 3D Printing Business Management System — Progress Log

## Status Proyek Terkini

- **Sprint Aktif**: **Sprint 3 — Financial Calculation Engine**
- **Status Sprint 3**: **COMPLETED (Selesai & Terverifikasi 100%)**
- **Tanggal Selesai Sprint 3**: 15 Oktober 2026
- **Lead Engineer / Architect**: AI Senior Full-Stack Agent

---

## 1. Pekerjaan yang Telah Selesai (Completed Work)

### Sprint 0 (Discovery & Audit) — COMPLETED
- Audit dokumen dan inventarisasi 3 file spreadsheet.
- Penyusunan 8 dokumen blueprint arsitektur di direktori `docs/`.

### Sprint 1 (Foundation & Database Architecture) — COMPLETED
- Next.js 16 (App Router), React 19, TypeScript strict mode, Tailwind CSS v4.
- Integrasi Supabase client (browser, server async cookies, server-only admin).
- Migrasi database 13 tabel PostgreSQL dengan constraint, index, dan RLS aktif.
- UI component system dan layout responsif studio (`Sidebar`, `Header`, `DashboardShell`).

### Sprint 2 (Import Data & Master Data Management) — COMPLETED
- Dataset master terverifikasi [src/lib/data/initial-data.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/src/lib/data/initial-data.ts): 4 model lampu, 8 bahan baku, 4 aset printer, dan 23 transaksi modal Rp11.440.748 (Delta: Rp 0,00).
- Skrip migrasi terproteksi [scripts/import-excel-data.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/scripts/import-excel-data.ts).
- Tiga antarmuka master data: `/products`, `/inventory`, dan `/capital`.

### Sprint 3 (Financial Calculation Engine) — COMPLETED
1. **Modul HPP Dual-Mode ([src/lib/financial/hpp-calculator.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/src/lib/financial/hpp-calculator.ts))**:
   - **Mode Standard**: Perhitungan berbasis multiplier overhead 1.20x Casa Moral untuk kompatibilitas data historis tanpa waktu cetak slicer.
   - **Mode Advanced**: Perhitungan engineering presisi berbasis waktu cetak (menit), daya printer (watt), tarif PLN (Rp/kWh), depresiasi mesin per jam, reject rate multiplier `r / (1 - r)`, komponen aksesoris, kemasan, dan alokasi staf packing.
   - Perhitungan depresiasi mesin per jam garis lurus `calculateDepreciationPerHour()`.
   - Menggunakan `Decimal.js` untuk mencegah kesalahan pembulatan desimal JavaScript floating-point.
2. **Modul Pricing & Profitability ([src/lib/financial/pricing-calculator.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/src/lib/financial/pricing-calculator.ts))**:
   - Konverter dua arah: `convertMarkupToMargin()` dan `convertMarginToMarkup()`.
   - Generator harga rekomendasi: `calculatePriceFromMarkup()` dan `calculatePriceFromMargin()`.
   - Simulasi potongan platform Shopee: Admin fee (8%) dan Gratis Ongkir Xtra (4% capped di Rp 10.000).
   - Analisis laba kotor riil dan margin bersih setelah potongan platform.
3. **Modul Break-Even Point & Balik Modal ([src/lib/financial/bep-calculator.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/src/lib/financial/bep-calculator.ts))**:
   - BEP Unit per bulan (`Math.ceil(Overhead / Margin Kontribusi)`) dan per hari.
   - BEP Omzet bulanan (`BEP Unit * Harga Rata-rata`).
   - Estimasi Laba Bersih Bulanan dan Payback Period (Waktu Balik Modal).
   - Penanganan protektif jika margin kontribusi nol atau negatif.
4. **Antarmuka Kalkulator Interaktif ([src/app/calculator/page.tsx](file:///D:/Nurdin/00_PROJECT/casamoral-inv/src/app/calculator/page.tsx))**:
   - Tool simulator live dengan toggle Mode Standard vs Advanced, slider markup/margin, opsi fee Shopee, dan kartu hasil real-time.
   - Terintegrasi pada navigasi sidebar studio.

---

## 2. Pengujian & Hasil Verifikasi (Testing & Verification)

1. **Automated Unit Testing (`npm test` via Vitest)**:
   - Status: **PASSED (25/25 tests across 3 test suites in 506ms)**.
   - [tests/financial-engine.test.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/tests/financial-engine.test.ts): 14 unit tests lulus:
     - 4 Model Casa Moral (Lumi, Ollie, Kumo, Pomi) cocok 100% dengan HPP dan harga jual Excel.
     - Template ELS Studio BTS Arirang 4 Cap cocok presisi dengan sheet `HPP per Produk`.
     - Konversi dua arah Markup dan Margin (50% markup = 33.33% margin; 50% margin = 100% markup).
     - Shopee admin 8% dan Gratis Ongkir Xtra 4% (capped max Rp 10.000).
     - BEP template ELS Studio dan Casa Moral Ollie (50 unit/bln pada overhead Rp 2.000.000).
     - Penanganan margin kontribusi negatif tanpa crash.
   - [tests/sprint2-master-data.test.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/tests/sprint2-master-data.test.ts): 6 tests lulus (rekonsiliasi Rp 11.440.748).
   - [tests/foundation.test.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/tests/foundation.test.ts): 5 tests lulus.
2. **TypeScript Typecheck (`npx tsc --noEmit`)**:
   - Status: **PASSED (0 Errors)**.
3. **ESLint Code Quality (`npm run lint`)**:
   - Status: **PASSED (0 Errors, 0 Warnings)**.
4. **Production Build (`npm run build`)**:
   - Status: **PASSED (Turbopack compiled in 2.7s)**.
   - Route yang terverifikasi: `/`, `/calculator`, `/products`, `/inventory`, `/capital`.
5. **Live Dev Server Fetching (`http://localhost:3000/calculator`)**:
   - Status: **200 OK**, interaksi live kalkulasi berjalan lancar.

---

## 3. File yang Dibuat / Diubah pada Sprint 3

- `src/lib/financial/hpp-calculator.ts` (Baru)
- `src/lib/financial/pricing-calculator.ts` (Baru)
- `src/lib/financial/bep-calculator.ts` (Baru)
- `src/app/calculator/page.tsx` (Baru)
- `src/components/layout/sidebar.tsx` (Diperbarui navigasi)
- `tests/financial-engine.test.ts` (Baru)
- `docs/PROGRESS.md` (Diperbarui)
- `docs/IMPLEMENTATION_PLAN.md` (Diperbarui)

---

## 4. Langkah Berikutnya (Next Actions)

- **Sprint 4: Order dan Production Management**:
  - Memigrasikan 9 transaksi pesanan awal dari `Orderan Casa Moral.xlsx`.
  - Membangun halaman daftar pesanan (`/orders`) dengan filter status produksi dan pembayaran.
  - Membangun form pembuatan pesanan baru (`/orders/new`) dengan pemilihan varian warna (*Base, Shade, Cap*) dan add-on kustom.
  - Membangun detail pesanan (`/orders/[id]`) yang menyimpan snapshot HPP dan harga jual permanen.
