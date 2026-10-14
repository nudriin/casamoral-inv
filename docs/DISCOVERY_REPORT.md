# Casa Moral 3D Printing Business Management System — Discovery Report

## 1. Executive Summary

Audit discovery telah dilakukan secara komprehensif terhadap direktori kerja `D:\Nurdin\00_PROJECT\casamoral-inv`, mencakup source code, dependensi lingkungan, dan seluruh file spreadsheet pada folder `Sheet\Data Casa Moral` dan `Sheet\Template`.

Kondisi proyek saat ini adalah repositori bersih (*fresh start*) yang belum memiliki framework Next.js atau skema database terpasang. Seluruh data bisnis aktual Casa Moral dan template acuan finansial berhasil dibaca dan dianalisis secara mendalam menggunakan tooling otomasi Python `openpyxl`.

Ditemukan bahwa Casa Moral memiliki data operasional yang sangat konkret untuk produk lampu 3D print (model Lumi, Ollie, Kumo, Pomi), modal belanja awal 23 item senilai Rp11.440.748, serta 9 transaksi pesanan awal. Selain itu, ditemukan perbedaan metodologis signifikan antara template referensi (*Template ELS STUDIO*) yang berbasis waktu cetak, watt listrik, reject rate, dan depresiasi mesin, dengan data aktual Casa Moral (*HPP CASA MORAL V2*) yang menggunakan faktor *multiplier overhead* empiris 1.2x.

---

## 2. Project & Environment Audit

### 2.1 Direktori Kerja
- Path Root: `D:\Nurdin\00_PROJECT\casamoral-inv`
- Struktur awal:
  - `INSTRUCTION.md` (Master Prompt, 946 baris)
  - `Sheet/` (Berisi 2 subfolder: `Data Casa Moral` dan `Template`)
- Status Kode Eksisting: Belum ada file `package.json`, source code React/Next.js, konfigurasi Git, atau migrasi database.

### 2.2 Lingkungan Eksekusi & Runtimes
- **Node.js**: v24.20.0 (tersedia via `node`)
- **NPM**: v11.19.0 (tersedia via `npm.cmd`)
- **Python**: v3.14.6 (tersedia via `py` dengan library `openpyxl`)
- **OS**: Windows (PowerShell environment)

---

## 3. Business Data Inventory

Tiga file spreadsheet utama telah diaudit secara menyeluruh:

| No | File | Lokasi | Ukuran | Worksheet | Status Audit |
|---|---|---|---|---|---|
| 1 | `HPP CASA MORAL V2.xlsx` | `Sheet\Data Casa Moral\` | 83.7 KB | `Sheet1` (max row: 58 aktif, max col: 13 aktif) | Diverifikasi 100% |
| 2 | `Orderan Casa Moral.xlsx` | `Sheet\Data Casa Moral\` | 16.7 KB | `Sheet1` (max row: 24 aktif, max col: 12 aktif) | Diverifikasi 100% |
| 3 | `Template ELS STUDIO.xlsx` | `Sheet\Template\` | 50.5 KB | `Ringkasan`, `Data Harga`, `Depresiasi`, `HPP per Produk`, `Biaya Operasional & BEP`, `Rekomendasi & Tips` | Diverifikasi 100% |

---

## 4. Temuan Detail Tiap Dokumen Sumber

### 4.1 Dokumen 1: `HPP CASA MORAL V2.xlsx`

Worksheet `Sheet1` terbagi atas 4 tabel utama:

#### Tabel 1: Database Komponen & Bahan Baku (Baris 1 - 12)
Master data harga acuan bahan baku dan perakitan lampu:
- Filamen PLA/PETG: Rp180.000 / kg (Rp180 / gram)
- Komponen cetak fisik: Base Lampu, Shade / Penutup Lampu, Cap / Tutup Atas
- Lampu LED Bulb / Module: Rp15.000 / pcs
- Fitting E27: Rp6.000 / pcs
- Kabel Sakelar: Rp10.000 / pcs
- Kardus Kemasan Custom: Rp4.500 / pcs
- Bubble Wrap: Rp1.500 / meter
- Sticker Label / Branding: Rp1.000 / pcs

#### Tabel 2: Kalkulasi HPP per Model Lampu (Baris 14 - 31)
Menampilkan 4 model lampu dengan rincian gramatur dan biaya:

| Komponen Biaya | Lumi | Ollie | Kumo | Pomi | Catatan Formula |
|---|---|---|---|---|---|
| Shade (gram) | 97.59 g | 66.66 g | 94.52 g | 153.72 g | Input slicer |
| Base (gram) | 68.81 g | 119.26 g | 70.16 g | 84.05 g | Input slicer |
| Cap (gram) | 0.00 g | 17.16 g | 5.45 g | 30.99 g | Input slicer (Lumi tanpa cap) |
| **Total Filamen (gram)** | **166.40 g** | **203.08 g** | **170.13 g** | **268.76 g** | `SUM(Shade, Base, Cap)` |
| Biaya Filamen | Rp29.952,00 | Rp36.554,40 | Rp30.623,40 | Rp48.376,80 | `(Gram/1000) * Rp180.000` |
| Lampu LED Bulb | Rp15.000,00 | Rp15.000,00 | Rp15.000,00 | Rp15.000,00 | Link ke Tabel 1 |
| Fitting E27 | Rp6.000,00 | Rp6.000,00 | Rp6.000,00 | Rp6.000,00 | Link ke Tabel 1 |
| Kabel Sakelar | Rp10.000,00 | Rp10.000,00 | Rp10.000,00 | Rp10.000,00 | Link ke Tabel 1 |
| Kabel Pelindung | Rp700,00 | Rp700,00 | Rp700,00 | Rp700,00 | Direct input |
| Kardus Kemasan | Rp4.000,00 | Rp4.500,00 | Rp4.500,00 | Rp4.500,00 | Direct input |
| Bubble Wrap | Rp2.000,00 | Rp2.000,00 | Rp2.000,00 | Rp2.000,00 | Direct input |
| Sticker Label | Rp0,00 | Rp0,00 | Rp0,00 | Rp0,00 | Belum dialokasikan |
| Subtotal Material | Rp67.652,00 | Rp74.754,40 | Rp68.823,40 | Rp86.576,80 | `SUM(B20:B27)` |
| **Alokasi Listrik & Depresiasi** | **1.2x (20%)** | **1.2x (20%)** | **1.2x (20%)** | **1.2x (20%)** | Multiplier overhead empiris |
| **TOTAL HPP** | **Rp81.182,40** | **Rp89.705,28** | **Rp82.588,08** | **Rp103.892,16** | `Subtotal Material * 1.2` |
| Margin Target (50%) | Rp40.591,20 | Rp44.852,64 | Rp41.294,04 | Rp51.946,08 | `HPP * 50%` (Markup!) |
| **Harga Jual Rekomendasi** | **Rp121.773,60** | **Rp134.557,92** | **Rp123.882,12** | **Rp155.838,24** | `HPP + Markup` |

#### Tabel 3: Modal Awal Pengadaan (Baris 33 - 58)
Mencatat 23 transaksi pembelian aset dan bahan baku via Shopee dengan tambahan biaya layanan platform Rp2.000 per transaksi:
- **Total Pengeluaran Modal**: **Rp11.440.748,00**
- Rekonsiliasi Kategori:
  1. **Mesin / Aset Tetap**: Bambulab A1 Mini (Rp3.589.221) + Anycubic Kobra X (Rp5.872.800) = **Rp9.462.021,00** (82.71% dari total modal)
  2. **Peralatan / Tools**: Jangka Sorong (Rp47.499) + Magnet Neodium 20Pcs x 3 (Rp47.000) = **Rp94.499,00**
  3. **Stok Filamen (Bahan Baku)**: 10 roll (eSUN PETG Clear, Blue, Pink, Black, PLA White, IndoCart Orange 2 roll, Sakura Pink, Dark Blue) = **Rp1.239.561,00**
  4. **Komponen Kelistrikan**: Fitting E27 (20 pcs), Kabel Sakelar (20 pcs), Karet Pelindung (30 pcs), Bohlam Inlite 3W (10 pcs) = **Rp442.450,00**
  5. **Bahan Kemasan**: Kardus Karton 20x20x20 (20 pcs) + Bubble Wrap Roll 30cmx50m (1 roll) = **Rp102.217,00**

#### Tabel 4: Dimensi Teknis Model Lampu (Kolom H - M, Baris 15 - 26)
Mencatat tinggi & lebar shade, tinggi & lebar base, tinggi mur, serta tinggi keseluruhan untuk model Lumi (150 mm) dan Ollie (180 mm).

---

### 4.2 Dokumen 2: `Orderan Casa Moral.xlsx`

Worksheet `Sheet1` mencatat pesanan penjualan:
- Rentang data: Baris 6 (Header) hingga Baris 15 (9 transaksi), Baris 24 (Total Summary).
- Total Volume Penjualan Tercatat: **Rp945.000,00** (9 unit produk).
- Rincian Transaksi:

| Baris | Nama Pelanggan | Produk | Rincian Warna | Harga Lampu | Add-On | Harga Add-On | Jml | Lokasi | Kanal | Status Bayar |
|---|---|---|---|---|---|---|---|---|---|---|
| R07 | Mahput | Ollie | Base Pink + Shade Putih + Cap Putih | Rp130.000 | - | - | 1 | Sukamara | Shopee | Belum Lunas |
| R08 | Gress | Ollie | Base Oren + Shade Putih + Cap Oren | Rp115.000 | - | - | 1 | Pky | Direct | Belum Lunas |
| R09 | Acil Ely | Ollie | Base Oren + Shade Putih + Cap Oren | Rp130.000 | - | - | 1 | Sukamara | Direct | Belum Lunas |
| R10 | *(Kosong)* | Pomi | Base Oren + Shade Putih + Cap Oren | Rp150.000 | - | - | 1 | Sukamara | Direct | Belum Lunas |
| R11 | Istri Om Ridwan | Ollie | Base Oren + Shade Putih + Cap Oren | Rp130.000 | - | - | 1 | Sukamara | Direct | Belum Lunas |
| R12 | Bang Dona | Ollie | Base Oren + Shade Putih + Cap Oren | Rp0 | - | - | 1 | Sukamara | Direct | Belum Lunas |
| R13 | *(Kosong)* | Kumo | Basi Oren + Shade Putih | Rp0 | - | - | 1 | Sukamara | Direct | Belum Lunas |
| R14 | Wahyu | Ollie | Basi Oren + Shade Putih + Cap Oren | Rp130.000 | Cap Custom Figur Lee Jeno | Rp30.000 | 1 | Palangka Raya | Direct | **Lunas** |
| R15 | Mama | Ollie | Basi Oren + Shade Putih No Cap | Rp130.000 | - | - | 1 | Sukamara | Direct | **Lunas** |

---

### 4.3 Dokumen 3: `Template ELS STUDIO.xlsx`

Template referensi industri 3D printing komprehensif, mencakup 6 sheet:
1. **Ringkasan**: Dashboard KPI (Total modal awal Rp35.617.000, estimasi balik modal 9.6 bulan, BEP unit 185 pcs/bulan, rata-rata margin 44.1%).
2. **Data Harga**: Master harga filamen per kg (Bambu Lab Rp180k, Indocart Rp125k, dll.), watt printer (A1 Mini: 60W, A1: 110W, P1S: 100W), tarif PLN (Rp1.666/kWh), reject rate (8%), biaya kemasan per pcs, biaya admin Shopee (8%), gratis ongkir xtra (4% max 10k), gaji staf packing (Rp1.000.000/bln), dan estimasi volume (450 pcs/bln).
3. **Depresiasi**: Depresiasi garis lurus mesin: `(Harga Beli - Nilai Residu) / Umur Bulan / Jam Pakai per Bulan`.
   - A1 Mini: Depresiasi Rp2.083,06 / jam operasional.
   - A1: Depresiasi Rp2.638,61 / jam operasional.
   - P1S: Depresiasi Rp2.933,11 / jam operasional.
4. **HPP per Produk**: 15 contoh produk dengan formula HPP per unit berbasis waktu cetak:
   - Filamen: `(Gram / 1000) * Harga_Kg * (1 + Purge_Rate)`
   - Listrik: `(Menit / 60) * (Watt / 1000) * Tarif_PLN`
   - Depresiasi: `(Menit / 60) * Depresiasi_per_Jam`
   - Biaya Gagal (Reject): `(Filamen + Listrik + Depresiasi) * (Reject_Rate / (1 - Reject_Rate))`
   - Aksesoris + Kemasan + Alokasi Staff Packing
   - Potongan Shopee: `Admin (8%) + Ongkir Xtra (4% max 10k)`
   - Profit Kotor & Margin Sejati
5. **Biaya Operasional & BEP**: Overhead bulanan (Gaji desainer Rp3jt, lisensi MakerWorld Rp150k, listrik non-produksi Rp150k, internet/software Rp300k, iklan Rp1.5jt, maintenance Rp200k, lain-lain Rp100k -> Total Rp2.563.000). Formula BEP: `Total Overhead / Rata-rata Profit Kotor per Unit`.
6. **Rekomendasi & Tips**: 9 pilar best-practice bisnis 3D printing (slicing hemat filamen, manajemen kelembapan, maintenance mesin, strategi harga, ads, sistem DP/PO, QC packing, lisensi komersial desain).

---

## 5. Analisis Kualitas Data & Rekonsiliasi Awal

Hasil audit menemukan sejumlah isu kualitas data pada file aktual Casa Moral yang memerlukan penanganan dan konfirmasi:

1. **Missing Data Pelanggan**: Baris 10 (Pomi Rp150.000) dan Baris 13 (Kumo Rp0) tidak memiliki nama pembeli.
2. **Transaksi Bernilai Rp0**: Baris 12 (Bang Dona, Ollie, Rp0) dan Baris 13 (Kumo, Rp0). Apakah ini tester, sampel promosi, atau pesanan gratis?
3. **Ketiadaan Data Tanggal**: File `Orderan Casa Moral.xlsx` tidak memiliki kolom tanggal transaksi. Kapan pesanan-pesanan ini dilakukan?
4. **Ketidakkonsistenan Nomenklatur Lokasi**: Penulisan lokasi pelanggan bercampur antara "Pky" dan "Palangka Raya".
5. **Typo pada Deskripsi Warna**: Ditemukan kata "Basi Oren" (baris 13, 14, 15) yang seharusnya "Base Oren".
6. **Variasi Harga Jual**: Produk Ollie dijual dengan harga berbeda: Mahput (Rp130k), Gress (Rp115k), Acil Ely (Rp130k), Bang Dona (Rp0). Sedangkan harga rekomendasi HPP sheet adalah Rp134.558.
7. **Pemisahan Kas vs Piutang**: Dari Rp945.000 total pesanan, hanya Rp290.000 yang berstatus Lunas (Wahyu & Mama), sedangkan Rp655.000 (73.5%) masih berupa piutang (Belum Lunas).
8. **Ketiadaan Waktu Cetak di Data Aktual**: Di `HPP CASA MORAL V2.xlsx`, produk lampu hanya mencatat gramatur filamen, tanpa mencatat durasi cetak (menit/jam), sehingga menggunakan faktor multiplier 1.2x.

---

## 6. Keterbatasan Akses & Informasi

- Tidak ada file spreadsheet lain yang tersembunyi selain ketiga file yang diinventarisir di atas.
- Riwayat pengeluaran operasional bulanan (biaya sewa, internet, iklan, listrik non-produksi riil) belum memiliki catatan pembukuan historis tersendiri di luar modal awal Tabel 3.
- Belum ada skema autentikasi Supabase dan project URL/key yang dikonfigurasi pada environment lokal.
