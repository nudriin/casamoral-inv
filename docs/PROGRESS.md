# Casa Moral 3D Printing Business Management System — Progress Log

## Status Proyek Terkini

- **Sprint Aktif**: **Sprint 4 — Order and Production Management**
- **Status Sprint 4**: **COMPLETED (Selesai & Terverifikasi 100%)**
- **Tanggal Selesai Sprint 4**: 15 Oktober 2026
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

### Sprint 4 (Order and Production Management) — COMPLETED
1. **Migrasi Data 9 Pesanan Historis (`Orderan Casa Moral.xlsx`)**:
   - Total Volume Pesanan: **Rp 945.000,00** (9 pesanan).
   - Realisasi Kas Masuk: **Rp 290.000,00** (Wahyu Rp 160.000 + Mama Rp 130.000).
   - Piutang Berjalan: **Rp 655.000,00** (7 pesanan belum lunas).
   - Pesanan Add-On Lee Jeno (+Rp 30.000) pada Wahyu terhitung akurat (Total: Rp 160.000).
   - Unit promosi/sampel Rp 0 (Bang Dona & Studio Kumo) terpetakan dengan catatan khusus.
2. **Service & State Machine Alur Produksi ([src/lib/services/orders-service.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/src/lib/services/orders-service.ts))**:
   - Alur status berurutan: `PENDING` -> `CONFIRMED` -> `IN_PRODUCTION` -> `READY` -> `SHIPPED` -> `COMPLETED`, atau `CANCELLED`.
   - Proteksi State Machine mencegah loncatan status tidak sah.
   - Snapshot HPP & Harga Jual otomatis terkunci di `order_items` saat pesanan dibuat.
3. **Antarmuka Modul Pesanan**:
   - `/orders`: Daftar pesanan omnichannel dengan 4 KPI card terintegrasi, filter kanal (`Direct`, `Shopee`), filter pembayaran, dan filter status alur produksi.
   - `/orders/new`: Formulir pesanan interaktif dengan live simulator laba, varian warna (*Base, Shade, Cap*), add-on kustom, dan estimasi fee Shopee.
   - `/orders/[id]`: Detail pesanan dengan visual production stepper, tombol transisi status terproteksi, tombol konfirmasi pelunasan, dan rekonsiliasi finansial.
4. **Server Actions & Paritas Database**:
   - Server Actions: `createOrderAction`, `updateOrderStatusAction`, `updateOrderPaymentAction`.
   - Skrip migrasi `scripts/import-excel-data.ts` dan `supabase/seed.sql` diperbarui dengan 9 pelanggan dan 9 pesanan terverifikasi.

---

## 2. Pengujian & Hasil Verifikasi (Testing & Verification)

1. **Automated Unit Testing (`npm test` via Vitest)**:
   - Status: **PASSED (39/39 tests across 4 test suites in 882ms)**.
   - [tests/sprint4-orders.test.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/tests/sprint4-orders.test.ts): 14 unit tests lulus:
     - 9 pesanan historis total Rp 945.000 tervalidasi.
     - Kas masuk Rp 290.000 dan piutang Rp 655.000 tervalidasi.
     - Pesanan Wahyu Add-on Lee Jeno Rp 160.000 tervalidasi.
     - Validasi transisi state machine sah vs tidak sah.
     - Pemotongan Shopee fee (8% admin + 4% ongkir xtra max 10k).
     - Integritas snapshot HPP permanen.
   - [tests/financial-engine.test.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/tests/financial-engine.test.ts): 14 unit tests lulus.
   - [tests/sprint2-master-data.test.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/tests/sprint2-master-data.test.ts): 6 tests lulus (rekonsiliasi modal Rp 11.440.748).
   - [tests/foundation.test.ts](file:///D:/Nurdin/00_PROJECT/casamoral-inv/tests/foundation.test.ts): 5 tests lulus.
2. **TypeScript Typecheck (`npx tsc --noEmit`)**:
   - Status: **PASSED (0 Errors)**.
3. **ESLint Code Quality (`npm run lint`)**:
   - Status: **PASSED (0 Errors, 0 Warnings)**.
4. **Production Build (`npm run build`)**:
   - Status: **PASSED (Turbopack compiled successfully in 3.1s)**.
   - Route yang terverifikasi: `/`, `/orders`, `/orders/[id]`, `/orders/new`, `/calculator`, `/products`, `/inventory`, `/capital`.
5. **Live Dev Server Fetching (`http://localhost:3000/orders`)**:
   - Status: **200 OK**, data 9 pesanan historis ter-render lengkap dengan tautan dinamis.

---

## 3. File yang Dibuat / Diubah pada Sprint 4

- `src/lib/services/orders-service.ts` (Baru)
- `src/app/orders/actions.ts` (Baru)
- `src/app/orders/page.tsx` (Baru)
- `src/app/orders/order-list-client.tsx` (Baru)
- `src/app/orders/new/page.tsx` (Baru)
- `src/app/orders/[id]/page.tsx` (Baru)
- `src/app/orders/[id]/order-detail-client.tsx` (Baru)
- `src/lib/data/initial-data.ts` (Diperbarui dengan `INITIAL_CUSTOMERS` & `INITIAL_ORDERS`)
- `src/lib/utils.ts` (Diperbarui dengan export `formatDateIndo`)
- `src/app/page.tsx` (Diperbarui menghubungkan KPI dashboard ke data riil pesanan)
- `scripts/import-excel-data.ts` (Diperbarui migrasi pelanggan & pesanan)
- `supabase/seed.sql` (Diperbarui seed pelanggan & pesanan historis)
- `tests/sprint4-orders.test.ts` (Baru — 14 tests)
- `docs/PROGRESS.md` (Diperbarui)
- `docs/IMPLEMENTATION_PLAN.md` (Diperbarui)

---

## 4. Langkah Berikutnya (Next Actions)

- **Sprint 5: Sales, Expenses, dan Inventory**:
  - Modul Pembayaran Kas (`/orders/[id]/payments`): Pencatatan pelunasan parsial (DP) atau lunas penuh.
  - Halaman Manajemen Piutang (`/orders/receivables`): Tracking khusus saldo piutang 7 pesanan belum lunas senilai Rp 655.000.
  - Mutasi Stok Filamen & Komponen Otomatis: Pengurangan stok bahan baku saat pesanan beralih ke status `IN_PRODUCTION`.
  - Modul Pengeluaran Operasional (`/expenses`): Pencatatan biaya operasional tetap dan variabel (iklan, internet, sewa, maintenance).

