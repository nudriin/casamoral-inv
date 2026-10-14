# Casa Moral 3D Printing Business Management System — Progress Log

## Status Proyek Terkini

- **Sprint Selesai**: **Sprint 6 — Dashboard dan Reporting**
- **Status Sprint 6**: **COMPLETED (Selesai & Terverifikasi 100%)**
- **Sprint Berikutnya**: **Sprint 7 — Quality Assurance, Security, dan Release**
- **Tanggal Selesai Sprint 6**: 15 Oktober 2026
- **Test Suite**: **57 passed dari 57 tests (100% Lulus)**
- **Production Build**: **16 Routes Pre-rendered / Dynamic (Sukses)**
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

## 3. Sprint 5: Sales, Expenses, dan Inventory (Selesai)

### Pencapaian Utama Sprint 5
1. **Pencatatan Pembayaran Kas & Termin DP (`/orders/[id]/payments`)**:
   - Skema pembayaran bertahap (DP dan Pelunasan) dengan metode Transfer Bank, Tunai, dan QRIS.
   - Otomasi pembaruan `paid_amount` dan `payment_status` (`UNPAID` -> `PARTIALLY_PAID` -> `PAID`).
   - Baseline pembayaran historis: Rp 290.000 (Wahyu Rp 160.000, Mama Rp 130.000).
2. **Manajemen Piutang Usaha Terintegrasi (`/orders/receivables`)**:
   - Tracking 7 pesanan belum lunas dengan total piutang berjalan tepat Rp 655.000.
   - Analitik aging piutang (Lancar 0-14 hari, Perhatian 15-30 hari, Jatuh Tempo >30 hari).
   - Fitur "Pelunasan Cepat" langsung dari tabel analitik piutang.
3. **Pengurangan Stok Otomatis Berbasis BOM saat `IN_PRODUCTION`**:
   - Otomatis mengurangi persediaan filamen (gram) dan komponen (LED, fitting, switch, box, bubble wrap).
   - Pengembalian stok otomatis jika pesanan dibatalkan (`CANCELLED`).
   - Mekanisme idempotensi mencegah pemotongan berganda.
4. **Modul Beban Operasional Studio (`/expenses`)**:
   - Pencatatan pengeluaran tetap (Sewa, Internet, Amortisasi) Rp 820.000 dan variabel Rp 55.000 (total baseline Rp 875.000).
   - Klasifikasi kategori beban operasional, filter tipe beban, dan ringkasan bulanan.
5. **Kartu Stok & Riwayat Mutasi (`/inventory`)**:
   - Visualisasi log pergerakan stok real-time (IN/OUT/ADJUSTMENT/RETURN) dan audit trail.

---

## 4. Hasil Pengujian & Verifikasi Kualitas Sprint 5

1. **Vitest Unit Test Suite**:
   - `tests/financial-engine.test.ts`: **14 passed**
   - `tests/foundation.test.ts`: **5 passed**
   - `tests/sprint2-master-data.test.ts`: **6 passed**
   - `tests/sprint4-orders.test.ts`: **15 passed**
   - `tests/sprint5-sales-expenses-inventory.test.ts`: **10 passed**
   - **Total Tests Passing**: **50 passed dari 50 tests (100%)**.
2. **TypeScript Compilation (`tsc --noEmit`)**:
   - Status: **0 errors**. Type safety ketat.
3. **ESLint Static Analysis (`eslint`)**:
   - Status: **0 errors, 0 warnings**.
4. **Next.js Production Build (`npm run build`)**:
   - Status: **Berhasil tanpa kompromi (12 route valid)**.
   - Route terverifikasi: `/`, `/_not-found`, `/calculator`, `/capital`, `/expenses`, `/inventory`, `/orders`, `/orders/[id]`, `/orders/[id]/payments`, `/orders/new`, `/orders/receivables`, `/products`.
5. **Live Dev Server Fetching**:
   - `/orders/receivables`: **200 OK**
   - `/expenses`: **200 OK**
   - `/orders/ord-01/payments`: **200 OK**

---

## 5. File yang Dibuat / Diubah pada Sprint 5

- `src/lib/services/payments-service.ts` (Baru)
- `src/lib/services/expenses-service.ts` (Baru)
- `src/app/expenses/actions.ts` (Baru)
- `src/app/expenses/page.tsx` (Baru)
- `src/app/expenses/expenses-client.tsx` (Baru)
- `src/app/orders/receivables/page.tsx` (Baru)
- `src/app/orders/receivables/receivables-client.tsx` (Baru)
- `src/app/orders/[id]/payments/page.tsx` (Baru)
- `src/app/orders/[id]/payments/payment-form-client.tsx` (Baru)
- `src/lib/data/initial-data.ts` (Diperbarui dengan `INITIAL_PAYMENTS`, `INITIAL_EXPENSE_CATEGORIES`, `INITIAL_EXPENSES`, `INITIAL_STOCK_MOVEMENTS`)
- `src/lib/services/materials-service.ts` (Diperbarui mutasi stok & kalkulasi BOM)
- `src/lib/services/orders-service.ts` (Diperbarui trigger mutasi stok otomatis)
- `src/app/orders/actions.ts` (Diperbarui server action payment)
- `src/app/orders/[id]/order-detail-client.tsx` (Diperbarui tautan pencatatan termin/DP)
- `src/app/inventory/page.tsx` (Diperbarui kartu stok & log mutasi)
- `src/components/layout/sidebar.tsx` (Diperbarui menu navigasi Piutang Usaha)
- `tests/sprint5-sales-expenses-inventory.test.ts` (Baru — 10 unit tests)
- `docs/PROGRESS.md` (Diperbarui)
- `docs/IMPLEMENTATION_PLAN.md` (Diperbarui)

---

## 6. Sprint 6: Dashboard dan Reporting (Selesai)

### Pencapaian Utama Sprint 6
1. **Laporan Laba Rugi Komprehensif (`/reports/profit-loss`)**:
   - Menghitung Pendapatan Kotor (Rp 945.000), Potongan Diskon Promo (Rp 15.000), Potongan Platform Shopee (Rp 15.600), menghasilkan Pendapatan Bersih (Rp 914.400).
   - Menghitung HPP Terkunci Riil (COGS), Laba Kotor (Rp 99.982,80) dengan Gross Margin 10.93%.
   - Rincian Beban Operasional Tetap (Rp 820.000) dan Variabel (Rp 55.000), serta Laba/(Rugi) Operasional Bersih secara presisi matematis tanpa floating point error.
2. **Laporan Arus Kas Metode Langsung (`/reports/cash-flow`)**:
   - Memetakan Arus Kas Masuk Operasi (Kas Pelanggan Rp 290.000).
   - Memetakan Arus Kas Keluar Operasi (Beban Kas Tunai & Pengadaan Bahan Baku).
   - Memetakan Arus Kas Investasi (Mesin Printer 3D Bambulab & Anycubic) dan Arus Kas Pendanaan (Setoran Modal Awal Rp 11.440.748).
   - Mematuhi Section 8.3 Master Prompt dengan membedakan secara tegas antara Saldo Kas, Modal Usaha, Nilai Aset Tetap, dan Keuntungan.
3. **Analitik Produk & Penjualan (`/reports/sales-analytics`)**:
   - Matriks profitabilitas 4 model lampu ambient (Lumi, Ollie, Kumo, Pomi) lengkap dengan HPP, Margin %, Pangsa Pasar %, dan estimasi jam cetak printer (total ~104.5 jam).
   - Analisis kontribusi kanal transaksi (Direct WhatsApp 8 pesanan vs Shopee 1 pesanan) dan add-on kustomisasi (Lee Jeno).
4. **Pusat Laporan & Ekspor Spreadsheet (`/reports`)**:
   - Hub pelaporan keuangan eksekutif dengan one-click export CSV/Excel UTF-8 BOM compliant.
   - Ekspor Laba Rugi, Arus Kas, Matriks Produk, dan Rekap 9 Pesanan.
5. **Dashboard Eksekutif Utama (`/`)**:
   - Terhubung 100% ke data transaksi riil (Omzet Rp 945.000, Kas Masuk Rp 290.000, Piutang Rp 655.000, Laba Kotor Rp 99.982,80).
   - Widget Tracker Target Break-Even Point (BEP) Bulanan (Target ~21 unit, progres 9 unit / 42.9%, sisa 12 unit menuju impas).
   - Visualisasi katalog lampu, status pesanan, dan warning piutang kritis.

---

## 7. Hasil Pengujian & Verifikasi Kualitas Sprint 6

1. **Vitest Unit & Integration Test Suite**:
   - `tests/financial-engine.test.ts`: **14 passed**
   - `tests/foundation.test.ts`: **5 passed**
   - `tests/sprint2-master-data.test.ts`: **6 passed**
   - `tests/sprint4-orders.test.ts`: **15 passed**
   - `tests/sprint5-sales-expenses-inventory.test.ts`: **10 passed**
   - `tests/sprint6-reports-and-analytics.test.ts`: **7 passed**
   - **Total Tests Passing**: **57 passed dari 57 tests (100% Lulus)**.
2. **TypeScript Compilation (`npx tsc --noEmit`)**:
   - Status: **0 errors**. Type safety terverifikasi ketat.
3. **ESLint Static Analysis (`npm run lint`)**:
   - Status: **0 errors, 0 warnings**.
4. **Next.js Production Build (`npm run build`)**:
   - Status: **Berhasil tanpa kompromi (16 route valid)**.
   - Route terverifikasi: `/`, `/_not-found`, `/calculator`, `/capital`, `/expenses`, `/inventory`, `/orders`, `/orders/[id]`, `/orders/[id]/payments`, `/orders/new`, `/orders/receivables`, `/products`, `/reports`, `/reports/cash-flow`, `/reports/profit-loss`, `/reports/sales-analytics`.
5. **Live Dev Server Fetching**:
   - `/`: **200 OK**
   - `/reports`: **200 OK**
   - `/reports/profit-loss`: **200 OK**
   - `/reports/cash-flow`: **200 OK**
   - `/reports/sales-analytics`: **200 OK**

---

## 8. File yang Dibuat / Diubah pada Sprint 6

- `src/lib/services/reports-service.ts` (Baru)
- `src/lib/export-csv.ts` (Baru)
- `src/app/reports/page.tsx` (Baru)
- `src/app/reports/reports-hub-client.tsx` (Baru)
- `src/app/reports/profit-loss/page.tsx` (Baru)
- `src/app/reports/profit-loss/profit-loss-client.tsx` (Baru)
- `src/app/reports/cash-flow/page.tsx` (Baru)
- `src/app/reports/cash-flow/cash-flow-client.tsx` (Baru)
- `src/app/reports/sales-analytics/page.tsx` (Baru)
- `src/app/reports/sales-analytics/sales-analytics-client.tsx` (Baru)
- `src/app/page.tsx` (Diperbarui dengan metrik eksekutif riil & BEP tracker)
- `tests/sprint6-reports-and-analytics.test.ts` (Baru — 7 unit tests)
- `docs/PROGRESS.md` (Diperbarui)
- `docs/IMPLEMENTATION_PLAN.md` (Diperbarui)

---

## 9. Langkah Berikutnya (Next Actions)

- **Sprint 7: Quality Assurance, Security, dan Release**:
  - End-to-End User Journey Verification: Alur lengkap input pesanan baru -> mutasi stok otomatis -> pelunasan kas -> verifikasi pembukuan laba rugi & arus kas.
  - Audit Keamanan & Database RLS Policies.
  - Pengujian responsivitas mobile (viewport smartphone 375px - 768px).
  - Penyusunan dokumentasi rilis final: `docs/USER_MANUAL.md` dan `docs/DEPLOYMENT_GUIDE.md`.

