# Casa Moral 3D Printing Business Management System — Project Context

## 1. Tujuan dan Ruang Lingkup Proyek

**Casa Moral** adalah usaha manufaktur dan penjualan produk berbasis 3D printing (khususnya lampu hias/ambient lighting estetis, ornamen, dan aksesori dekoratif kustom).

Tujuan proyek ini adalah membangun aplikasi manajemen bisnis berbasis web yang andal, aman, terintegrasi, dan presisi secara finansial untuk mengelola:
1. **Modal Usaha & Investasi Awal**: Pembelian mesin 3D printer, peralatan, dan stok bahan baku.
2. **Kalkulasi Biaya & HPP (Harga Pokok Produksi)**: Perhitungan HPP per unit produk secara presisi berdasarkan filamen, komponen kelistrikan, kemasan, depresiasi mesin, dan konsumsi energi.
3. **Harga Jual & Profitabilitas**: Penetapan harga jual dengan pemisahan tegas antara margin laba dan markup, serta estimasi potongan platform marketplace (Shopee).
4. **Analisis Break-Even Point (BEP) & Balik Modal (ROI)**: Perhitungan titik impas per unit, per hari, dan omzet bulanan terhadap biaya tetap/overhead.
5. **Manajemen Pesanan (Orders)**: Pencatatan pesanan omnichannel (Shopee & Direct), kustomisasi add-on, status produksi, dan status pembayaran.
6. **Arus Kas & Piutang**: Pemisahan jelas antara nilai pesanan (omzet kotor), uang kas diterima (pembayaran lunas/DP), dan piutang pelanggan belum lunas.
7. **Pengelolaan Stok & Inventaris**: Pelacakan persediaan filamen (roll/gram), komponen perakitan (fitting, kabel, bohlam), kemasan, dan produk jadi.
8. **Dashboard & Pelaporan**: Ringkasan performa finansial dan operasional berbasis data riil tanpa mock statis.

---

## 2. Teknologi yang Digunakan

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Framework Frontend & Server** | **Next.js (App Router)** + React | Server Components, Server Actions, Route Handlers |
| **Bahasa Pemrograman** | **TypeScript** (Strict Mode) | Type safety penuh, pencegahan runtime bug |
| **Styling & UI Kit** | **Tailwind CSS** + **shadcn/ui** | Desain modern, minimalis, profesional, responsif (Desktop & Mobile) |
| **Form Handling & Validation** | **React Hook Form** + **Zod** | Validasi skema ketat di client dan server |
| **Database & Auth** | **Supabase (PostgreSQL)** | RLS (Row Level Security), transactional consistency, schema migrations |
| **Handling Angka & Finansial** | **Decimal.js** / Decimal formatting util | Menghindari floating-point precision error pada kalkulasi uang |
| **Testing** | **Vitest** / **Jest** + Integration test | Pengujian unit formula finansial dan rekonsiliasi data |

---

## 3. Arsitektur Aktual dan Struktur Modul

Arsitektur aplikasi dirancang modular dengan pemisahan tanggung jawab yang ketat (*Separation of Concerns*):

```
casamoral-inv/
├── docs/                      # Dokumentasi hidup & single source of truth arsitektur
├── Sheet/                     # Data bisnis asli & template Excel referensi
│   ├── Data Casa Moral/       # HPP CASA MORAL V2.xlsx, Orderan Casa Moral.xlsx
│   └── Template/              # Template ELS STUDIO.xlsx
├── src/ (atau root Next.js)
│   ├── app/                   # Next.js App Router (Pages, Layouts, Route Handlers)
│   │   ├── (auth)/            # Autentikasi Supabase
│   │   ├── (dashboard)/       # Layout dashboard utama
│   │   │   ├── page.tsx       # Ringkasan KPI Finansial & Operasional
│   │   │   ├── products/      # Master Produk & Kalkulator HPP
│   │   │   ├── orders/        # Manajemen Pesanan & Piutang
│   │   │   ├── inventory/     # Stok Filamen & Komponen
│   │   │   ├── capital/       # Modal Awal & Pembelian Aset
│   │   │   ├── expenses/      # Pengeluaran Overhead & Operasional
│   │   │   └── reports/       # Laporan Laba Rugi, BEP, dan Ekspor
│   ├── components/            # Reusable UI Components (shadcn/ui)
│   ├── lib/                   # Utility functions & Supabase client instances
│   │   ├── supabase/          # Client, server, and middleware Supabase helpers
│   │   ├── financial/         # Calculation engine (murni TypeScript, decoupled dari UI)
│   │   └── validations/       # Zod schemas untuk form dan API payloads
│   ├── types/                 # TypeScript interfaces and database types
│   └── tests/                 # Unit tests untuk formula finansial & kalkulator
└── supabase/                  # Supabase migrations, seeders, and config
```

---

## 4. Lokasi Dokumen Sumber

Semua dokumen sumber berada di direktori lokal dan **tidak boleh dimodifikasi langsung**:
1. `D:\Nurdin\00_PROJECT\casamoral-inv\Sheet\Data Casa Moral\HPP CASA MORAL V2.xlsx`
   - Berisi master komponen bahan baku lampu, kalkulasi HPP 4 model lampu (Lumi, Ollie, Kumo, Pomi), daftar belanja modal awal (23 item senilai Rp11.440.748), dan dimensi teknis lampu.
2. `D:\Nurdin\00_PROJECT\casamoral-inv\Sheet\Data Casa Moral\Orderan Casa Moral.xlsx`
   - Berisi 9 transaksi pesanan awal Casa Moral (total volume Rp945.000, 2 lunas, 7 belum lunas/piutang).
3. `D:\Nurdin\00_PROJECT\casamoral-inv\Sheet\Template\Template ELS STUDIO.xlsx`
   - Berisi metodologi finansial 3D printing komprehensif: depresiasi mesin per jam, konsumsi watt listrik, reject rate multiplier, biaya packing, alokasi staf, fee marketplace Shopee, overhead bulanan, dan formula BEP unit/omzet.

---

## 5. Aturan Penting yang Wajib Dipatuhi

1. **Financial Accuracy First**:
   - Jangan pernah menggunakan floating point sembarangan untuk nominal uang dan gramatur presisi.
   - Jangan mencampuradukkan omzet kotor, uang kas yang diterima, modal investasi, dan laba bersih.
   - Bedakan dengan tegas antara **Markup** (`(Harga - HPP) / HPP`) dan **Margin** (`(Harga - HPP) / Harga`).
2. **Data Integrity & Traceability**:
   - Snapshot harga, HPP, kuantitas, dan diskon harus tersimpan permanen pada setiap item pesanan (`order_items`) agar perubahan HPP di masa depan tidak mendistorsi laporan transaksi historis.
   - Seluruh mutasi stok harus tercatat dalam jurnal mutasi (`stock_movements`), bukan sekadar menimpa angka saldo akhir.
3. **Pemisahan Logika Bisnis dari UI**:
   - Logika kalkulasi HPP, margin, BEP, dan fee platform berada dalam modul tersendiri (`src/lib/financial/`) dengan unit test mandiri.
4. **Security & Data Safety**:
   - Supabase Service Role Key dilarang terekspos ke sisi browser.
   - Seluruh tabel database wajib dilindungi oleh Row Level Security (RLS).
   - Seluruh mutasi data multi-tabel wajib menggunakan transaksi database (PostgreSQL transaction / RPC).

---

## 6. Protokol Melanjutkan Pekerjaan (Session Resume)

1. Baca kembali [INSTRUCTION.md](file:///D:/Nurdin/00_PROJECT/casamoral-inv/INSTRUCTION.md).
2. Periksa [PROJECT_CONTEXT.md](file:///D:/Nurdin/00_PROJECT/casamoral-inv/docs/PROJECT_CONTEXT.md) dan [PROGRESS.md](file:///D:/Nurdin/00_PROJECT/casamoral-inv/docs/PROGRESS.md).
3. Periksa status repository dan hasil pengujian terkini.
4. Lanjutkan tugas aktif sesuai sprint plan tanpa membuat asumsi di luar dokumentasi tervalidasi.
