# Casa Moral 3D Printing Business Management System — Implementation Plan

Dokumen ini adalah rencana kerja bertahap berbasis Sprint dari Sprint 0 hingga Sprint 7 sesuai spesifikasi Master Prompt Bagian 5.

---

## Sprint Overview

| Sprint | Nama Sprint | Fokus Utama | Target Deliverable | Status |
|---|---|---|---|---|
| **Sprint 0** | **Discovery & Financial Specification** | Audit repositori, spreadsheet data aktual, formula finansial | Laporan discovery, spesifikasi formula, database design | **COMPLETED** |
| **Sprint 1** | **Foundation & Database Architecture** | Inisialisasi Next.js, TypeScript, Tailwind, Supabase schema & RLS | Fondasi aplikasi, koneksi Supabase, migrasi database | **COMPLETED** |
| **Sprint 2** | **Data Migration & Master Data** | Import data modal, bahan baku, produk lampu, dan seeding | Skrip migrasi terverifikasi, halaman master data | **COMPLETED** |
| **Sprint 3** | **Financial Calculation Engine** | Modul kalkulasi HPP, markup, margin, BEP, dan fee platform | Unit test calculation engine tervalidasi 100% | **COMPLETED** |
| **Sprint 4** | **Order & Production Management** | Pencatatan pesanan omnichannel, varian warna, add-on kustom | Modul pesanan, pelacakan status produksi | **COMPLETED** |
| **Sprint 5** | **Sales, Expenses & Inventory** | Pembayaran kas, piutang, mutasi stok filamen, biaya operasional | Manajemen pembayaran, jurnal stok otomatis | **COMPLETED** |
| **Sprint 6** | **Dashboard & Reporting** | Dashboard analitik KPI, performa produk, BEP tracker, export | Dashboard data riil, filter tanggal, ekspor CSV/XLSX | **COMPLETED** |
| **Sprint 7** | **QA, Security & Release** | E2E testing, financial regression test, responsive review, docs | Aplikasi rilis production-ready, manual book | **COMPLETED** |

---

## Detail Rencana Per Sprint

### Sprint 0 — Discovery, Audit, dan Financial Specification
- **Sprint Goal**: Memahami kondisi riil proyek, membongkar seluruh spreadsheet Excel, memverifikasi formula keuangan, dan menyusun blueprint arsitektur yang disetujui.
- **Tasks**:
  1. [x] Audit working directory, runtimes (`Node v24.20`, `Python v3.14`).
  2. [x] Audit dan ekstraksi data `HPP CASA MORAL V2.xlsx`.
  3. [x] Audit dan ekstraksi data `Orderan Casa Moral.xlsx`.
  4. [x] Audit dan ekstraksi formula `Template ELS STUDIO.xlsx`.
  5. [x] Penyusunan 8 dokumen fondasi di direktori `docs/`.
  6. [ ] Presentasi Checkpoint 1 dan menunggu persetujuan pengguna.
- **Deliverables**: Laporan Discovery, Financial Formulas Specification, Business Rules, Database Schema Proposal, Implementation Plan.
- **Acceptance Criteria**: Seluruh formula Excel terpetakan, anomali data teridentifikasi, dan tidak ada implementasi destruktif tanpa izin.

---

### Sprint 1 — Foundation dan Database Architecture
- **Sprint Goal**: Membangun fondasi Next.js App Router dengan Tailwind CSS, shadcn/ui, koneksi Supabase PostgreSQL, dan skema database terversi.
- **User Stories**:
  - Sebagai Developer, saya memiliki repositori Next.js yang terkonfigurasi dengan TypeScript strict mode, linting, dan UI components modern.
  - Sebagai System Administrator, saya memiliki skema database PostgreSQL terstruktur dengan constraint relasional dan RLS aktif.
- **Technical Tasks**:
  - Inisialisasi Next.js 15 (App Router) + TypeScript + Tailwind CSS.
  - Setup dependensi UI (`lucide-react`, `clsx`, `tailwind-merge`, komponen shadcn/ui).
  - Setup konfigurasi Supabase client (browser client, server client, middleware).
  - Penulisan migrasi SQL (`001_initial_schema.sql`) untuk tabel: `profiles`, `customers`, `materials`, `stock_movements`, `assets`, `product_categories`, `products`, `product_components`, `orders`, `order_items`, `payments`, `expense_categories`, `expenses`.
  - Penerapan RLS policies pada seluruh tabel.
  - Setup layout navigasi aplikasi: Sidebar responsif (Desktop & Mobile drawer), header, breadcrumb.
- **Acceptance Criteria**:
  - Aplikasi Next.js berjalan tanpa error di `npm run dev`.
  - Migrasi Supabase berhasil dieksekusi tanpa syntax error.
  - RLS aktif melindungi semua tabel dari akses publik tidak sah.
- **Test Strategy**: Validasi koneksi Supabase via script tes, type check (`tsc`), lint check.

---

### Sprint 2 — Import Data dan Master Data Management
- **Sprint Goal**: Memigrasikan data modal awal, bahan baku, komponen, dan produk lampu Casa Moral ke dalam Supabase, serta menyediakan antarmuka CRUD master data.
- **User Stories**:
  - Sebagai Pemilik Usaha, saya dapat melihat dan mengelola katalog produk lampu (Lumi, Ollie, Kumo, Pomi), bahan baku filamen, dan komponen kelistrikan yang sudah terisi dari data riil.
  - Sebagai Pemilik Usaha, saya dapat melihat inventaris aset printer dan modal awal Rp11.440.748 tercatat rapi di sistem.
- **Technical Tasks**:
  - Skrip migrasi/seeding idempotent untuk mengimpor:
    - 23 item modal belanja awal dari Tabel 3 `HPP CASA MORAL V2.xlsx`.
    - Master komponen bahan baku dari Tabel 1.
    - 4 Master produk lampu (Lumi, Ollie, Kumo, Pomi) beserta Bill of Materials (BOM) gramatur dan komponen perakitannya dari Tabel 2.
  - CRUD UI untuk Manajemen Bahan Baku & Stok (`/inventory/materials`).
  - CRUD UI untuk Manajemen Aset & Printer (`/capital/assets`).
  - CRUD UI untuk Manajemen Produk & Komponen (`/products`).
- **Acceptance Criteria**:
  - Nilai modal awal pas tepat Rp11.440.748,00.
  - Seluruh komponen BOM tiap model lampu cocok 100% dengan data Excel.
  - Tidak terjadi duplikasi data saat script import dijalankan ulang.
- **Test Strategy**: Script rekonsiliasi otomatis membandingkan row count dan nominal sum antara Excel dan Supabase.

---

### Sprint 3 — Financial Calculation Engine
- **Sprint Goal**: Membangun modul kalkulasi finansial independen (pure TypeScript) untuk HPP, margin, markup, BEP, dan potongan marketplace, lengkap dengan unit test otomatis.
- **User Stories**:
  - Sebagai Pemilik Usaha, saya mendapatkan kalkulasi HPP dan harga jual yang akurat secara instan ketika menambah produk baru atau mengubah harga bahan baku.
  - Sebagai Pemilik Usaha, saya dapat mengetahui titik impas (BEP) dan estimasi balik modal berdasarkan biaya tetap bulanan.
- **Technical Tasks**:
  - Implementasi `src/lib/financial/hpp-calculator.ts` (Dual mode: Standard Multiplier 1.2x & Advanced Production Slicing).
  - Implementasi `src/lib/financial/pricing-calculator.ts` (Markup vs Margin converter, Shopee fee deduction).
  - Implementasi `src/lib/financial/bep-calculator.ts` (BEP unit, BEP omzet, Payback period).
  - Unit test suite menggunakan Vitest/Jest untuk memverifikasi kalkulasi terhadap 4 model lampu Casa Moral dan 15 produk template ELS Studio.
- **Acceptance Criteria**:
  - Hasil HPP Lumi, Ollie, Kumo, Pomi persis sama dengan Excel hingga 2 desimal.
  - Rumus Markup dan Margin terbukti tidak saling tertukar.
  - Test suite lulus 100% tanpa floating point error.
- **Test Strategy**: Automated unit testing dengan data acuan `FINANCIAL_FORMULAS.md`.

---

### Sprint 4 — Order dan Production Management (COMPLETED)
- **Status**: **COMPLETED (Selesai & Terverifikasi 100%)**
- **Sprint Goal**: Membangun modul pencatatan pesanan omnichannel (Direct & Shopee), dukungan kustomisasi warna dan add-on, serta alur status produksi.
- **User Stories**:
  - Sebagai Pemilik Usaha, saya dapat mencatat pesanan baru dengan cepat, memilih warna dudukan/penutup/tutup lampu, dan menambahkan add-on kustom.
  - Sebagai Operator Produksi, saya dapat melihat daftar pesanan yang harus dicetak dan memperbarui status produksi dari pending hingga siap kirim.
- **Technical Tasks**:
  - Migrasi 9 pesanan historis dari `Orderan Casa Moral.xlsx` (termasuk penanganan data unconfirmed).
  - UI Form Pembuatan Pesanan (`/orders/new`): Pemilihan produk, input variasi warna (*Base, Shade, Cap*), add-on kustom, kanal transaksi.
  - UI Daftar Pesanan (`/orders`): Filter status pesanan, filter kanal, status pembayaran.
  - Detail Pesanan (`/orders/[id]`): Snapshot HPP dan harga jual, riwayat perubahan status.
  - Transisi status pesanan terproteksi (*state machine validation*).
- **Acceptance Criteria**:
  - 9 pesanan historis terimpor dengan total Rp945.000,00.
  - Snapshot HPP tersimpan permanen di `order_items`.
  - Pesanan dengan Add-On (seperti Lee Jeno Rp30.000) terhitung akurat.
- **Test Strategy**: Integration test alur pemesanan dan verifikasi snapshot.

---

### Sprint 5 — Sales, Expenses, dan Inventory (COMPLETED)
- **Status**: **COMPLETED (Selesai & Terverifikasi 100%)**
- **Sprint Goal**: Menghubungkan pesanan dengan pencatatan pembayaran kas, tracking piutang, mutasi stok filamen otomatis, dan pencatatan biaya operasional rutin.
- **User Stories**:
  - Sebagai Pemilik Usaha, saya dapat mencatat pembayaran pelunasan pesanan dan langsung melihat saldo piutang berkurang.
  - Sebagai Pemilik Usaha, stok filamen dan fitting lampu otomatis berkurang saat pesanan mulai diproduksi.
  - Sebagai Pemilik Usaha, saya dapat mencatat pengeluaran operasional (iklan, internet, sewa).
- **Technical Tasks**:
  - Modul Pembayaran (`/orders/[id]/payments`): Input pembayaran parsial (DP) atau lunas, pilihan metode transfer/cash.
  - Halaman Manajemen Piutang (`/orders/receivables`): Daftar pesanan yang belum lunas dengan aging analysis & aksi pelunasan cepat.
  - Server Action mutasi stok: Pengurangan otomatis stok bahan saat pesanan berstatus `IN_PRODUCTION`, serta pengembalian stok saat `CANCELLED`.
  - Modul Pengeluaran (`/expenses`): Pencatatan biaya operasional tetap (Rp 820.000) dan variabel (Rp 55.000).
  - Kartu Stok & Riwayat Mutasi (`/inventory`): Visualisasi pergerakan log stok bahan baku.
- **Acceptance Criteria**:
  - Piutang awal Rp655.000 terpetakan dengan jelas pada 7 pesanan belum lunas.
  - Stok berkurang secara konsisten dan mutasi tercatat di `stock_movements`.
  - Tidak ada pencatatan ganda pada transaksi pembayaran maupun pemotongan stok (idempotent).
- **Test Strategy**: Pengujian mutasi stok saat perubahan status, uji pembatalan pesanan, dan integrasi pembayaran (`tests/sprint5-sales-expenses-inventory.test.ts` - 10 tests passed).

---

### Sprint 6 — Dashboard dan Reporting (COMPLETED)
- **Status**: **COMPLETED (Selesai & Terverifikasi 100%)**
- **Sprint Goal**: Membangun dashboard eksekutif berbasis data riil dan modul laporan laba rugi, performa produk, BEP tracker, serta ekspor CSV/XLSX.
- **User Stories**:
  - Sebagai Pemilik Usaha, saat membuka dashboard saya langsung melihat total omzet, uang kas masuk, total piutang, estimasi laba kotor, dan posisi pencapaian BEP.
  - Sebagai Pemilik Usaha, saya dapat mengekspor laporan penjualan dan pengeluaran ke format spreadsheet.
- **Technical Tasks**:
  - Komponen KPI Card Eksekutif: Total Omzet (Rp 945.000), Kas Diterima (Rp 290.000), Piutang Berjalan (Rp 655.000), Laba Kotor (Rp 99.982,80), Unit Terjual (9 Unit).
  - Tracker BEP & Balik Modal: Target BEP bulanan (21 unit / Rp 2.1 juta omzet) terhadap fixed overhead (Rp 820.000/bln).
  - Modul Laporan Lengkap:
    - Laporan Laba Rugi Komprehensif (`/reports/profit-loss`)
    - Laporan Arus Kas Metode Langsung (`/reports/cash-flow`)
    - Analitik Penjualan & Margin per Model Lampu (`/reports/sales-analytics`)
    - Pusat Laporan & Ekspor Spreadsheet (`/reports`)
  - Fitur Ekspor Data CSV/Excel UTF-8 BOM compliant.
- **Acceptance Criteria**:
  - Semua angka di dashboard terhubung ke transaksi riil tanpa data mock.
  - Nilai omzet, kas masuk, piutang, dan laba ditampilkan terpisah tanpa saling tercampur sesuai Section 8.3 Master Prompt.
  - Ekspor CSV/XLSX menghasilkan data yang valid dengan encoding UTF-8 BOM.
- **Test Strategy**: Pengujian integrasi agregasi finansial `tests/sprint6-reports-and-analytics.test.ts` (7 tests passed, total 57 tests passed).

---

### Sprint 7 — Quality Assurance, Security, dan Release (COMPLETED)
- **Status**: **COMPLETED (Selesai & Terverifikasi 100%)**
- **Sprint Goal**: Melakukan pengujian integrasi menyeluruh, audit keamanan, pengujian responsivitas mobile, penyusunan dokumentasi rilis, dan penyerahan aplikasi siap pakai.
- **User Stories**:
  - Sebagai Pengguna, saya dapat menggunakan aplikasi secara lancar melalui layar smartphone maupun desktop browser.
  - Sebagai Pemilik Usaha, saya memiliki panduan instalasi dan deployment yang jelas untuk menjalankan aplikasi di lingkungan production (Vercel + Supabase).
- **Technical Tasks**:
  - [x] End-to-End Testing alur lengkap: Tambah Bahan -> Buat Produk HPP -> Input Order -> Catat Pembayaran -> Verifikasi Dashboard & Stok (`tests/sprint7-e2e-journey.test.ts`).
  - [x] Security Audit: Verifikasi penutupan public key, pengujian RLS policies, pencegahan kebocoran environment variable (`docs/SECURITY_AUDIT.md`).
  - [x] Responsive Testing: Penyesuaian layout tabel dan form pada viewport smartphone (375px - 768px).
  - [x] Error Handling & Loading State: Penambahan skeleton loader (`src/app/loading.tsx`), empty state, 404 (`src/app/not-found.tsx`), dan global error boundary (`src/app/error.tsx`).
  - [x] Dokumentasi Rilis: `docs/USER_MANUAL.md` dan `docs/DEPLOYMENT_GUIDE.md`.
- **Acceptance Criteria**:
  - [x] Zero critical regression (59/59 tests passed, 0 tsc error, 0 lint error).
  - [x] Responsif di mobile dan desktop.
  - [x] Build produksi lulus (`npm run build` - 16 routes valid).
  - [x] Dokumentasi panduan lengkap (Panduan Pengguna & Deployment).
- **Test Strategy**: E2E integration test, security audit, TypeScript strict mode, ESLint, production build validation.

