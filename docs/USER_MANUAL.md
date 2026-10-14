# Panduan Pengguna (User Manual) — Casa Moral 3D Printing Business Management System

Selamat datang di sistem manajemen usaha **Casa Moral 3D Printing**. Aplikasi ini dirancang khusus untuk membantu pemilik usaha mengelola seluruh aspek operasional studio: modal awal, biaya produksi (HPP), penetapan harga jual, Break-Even Point (BEP), pesanan pelanggan omnichannel, pemotongan stok otomatis, pembayaran kas, pelacakan piutang, dan laporan laba rugi.

---

## 1. Ikhtisar Sistem & Navigasi Utama

Aplikasi dapat diakses melalui browser komputer (desktop/laptop) maupun smartphone. Menu navigasi terletak di bilah sisi kiri (*sidebar*):

| Menu Navigasi | Rute URL | Fungsi Utama |
|---|---|---|
| **Dashboard** | `/` | Monitoring metrik utama: Omzet, Kas Masuk, Piutang, Laba Kotor, dan Tracker Target BEP. |
| **Produk & HPP** | `/products` | Katalog 4 model lampu ambient, spesifikasi BOM, dan acuan HPP aktual. |
| **Pesanan (Orders)** | `/orders` | Pencatatan pesanan omnichannel, detail warna, add-on, dan status produksi. |
| **Piutang Usaha** | `/orders/receivables` | Tracking saldo piutang berjalan 7 pesanan belum lunas dan aksi pelunasan cepat. |
| **Bahan & Stok** | `/inventory` | Stok bahan baku (filamen & komponen), status alert stok minimum, dan kartu mutasi. |
| **Modal & Aset** | `/capital` | Rekonsiliasi modal awal Rp 11.440.748 dan inventaris mesin 3D printer. |
| **Pengeluaran** | `/expenses` | Pencatatan beban operasional tetap (sewa, wifi) dan variabel (iklan). |
| **Kalkulator HPP** | `/calculator` | Simulasi perhitungan HPP dual-mode, margin, markup, dan analisis BEP. |
| **Laporan & BEP** | `/reports` | Laporan Laba Rugi SAK EMKM, Arus Kas Metode Langsung, dan Ekspor Excel. |

---

## 2. Manajemen Modal Awal & Pembelian Aset Mesin (`/capital`)

Menu ini merekam **23 transaksi pembelian modal awal** senilai **Rp 11.440.748,00** persis sesuai data master Excel (*Tabel 3*):

1. **Aset Tetap (Fixed Assets)**:
   - Mesin Bambulab A1 Mini: Rp 3.589.221
   - Mesin Anycubic Kobra X: Rp 5.872.800
   - Jangka Sorong Digital: Rp 47.499
   - Magnet Neodium: Rp 47.000
2. **Persediaan Awal Bahan Baku**:
   - 8 Roll Filamen (eSUN PETG Clear, Blue, Pink, Black, Natural; IndoCart PLA Orange, Sakura Pink, Dark Blue, dll.).
   - Komponen Kelistrikan (Fitting E27, Kabel Sakelar On/Off, Bohlam Inlite 3W).
   - Kemasan (Kardus 20x20x20 dan Bubble Wrap Roll).

> [!NOTE]
> Modal awal dicatat sebagai aktivitas pendanaan dan **tidak langsung dikurangkan dari omzet penjualan**, menjamin pemisahan yang benar antara kekayaan modal dan laba bersih usaha.

---

## 3. Manajemen Master Data Produk & Bahan Baku (`/products` & `/inventory`)

### A. 4 Model Lampu Ambient Utama
Casa Moral memiliki 4 model lampu ambient standar dengan struktur Bill of Materials (BOM) terverifikasi:
- **Lumi Lamp** (`CM-LUMI-01`): 166.4g filamen, HPP Rp 81.182,40, Harga Jual Rp 120.000.
- **Ollie Lamp** (`CM-OLLIE-01`): 203.08g filamen, HPP Rp 89.705,28, Harga Jual Rp 130.000.
- **Kumo Lamp** (`CM-KUMO-01`): 174.24g filamen, HPP Rp 82.588,08, Harga Jual Rp 120.000.
- **Pomi Lamp** (`CM-POMI-01`): 281.8g filamen, HPP Rp 103.892,16, Harga Jual Rp 150.000.

### B. Pemantauan Stok & Peringatan Minimum
- Halaman `/inventory` menampilkan sisa stok bahan baku.
- Jika persediaan filamen atau komponen berada di bawah ambang batas (*min_stock_alert*), sistem menampilkan badge peringatan kuning/merah agar pemilik usaha segera melakukan pembelian ulang (*reorder*).
- Riwayat pergerakan stok dapat diaudit melalui tabel **Kartu Stok & Mutasi Real-time**.

---

## 4. Penggunaan Kalkulator Finansial HPP & BEP (`/calculator`)

Kalkulator menyediakan 2 mode perhitungan independen:

1. **Mode Standard (Multiplier 1.20x)**:
   - Cocok untuk estimasi cepat produk baru.
   - Formula: `Total HPP = Subtotal Material x 1.20` (+20% untuk kompensasi listrik dan depresiasi).
2. **Mode Advanced (Slicing Time-Based)**:
   - Menghitung HPP presisi berdasarkan parameter slicer: waktu cetak (menit), daya printer (watt), tarif PLN kWh, penyusutan mesin per jam, dan reject rate.
3. **Konversi Markup vs Margin**:
   - Mencegah tertukarnya istilah Markup dan Margin.
   - Contoh: Markup 50% menghasilkan Margin sejati sebesar 33.33%.

---

## 5. Alur Pemesanan & Alur Produksi Studio (`/orders`)

### A. Membuat Pesanan Baru (`/orders/new`)
1. Klik tombol **"+ Buat Pesanan Baru"**.
2. Masukkan nama pelanggan, nomor kontak, kota tujuan, dan kanal transaksi (*Direct WhatsApp* atau *Shopee*).
3. Pilih produk lampu dan tentukan kombinasi warna (*Base, Shade, Cap*).
4. Tambahkan **Add-On Kustomisasi** jika ada (misal: Figur karakter, grafir nama, dll.).
5. Sistem otomatis mengunci snapshot HPP dan menghitung total tagihan.

### B. Tahapan Alur Produksi (State Machine)
Pesanan bergerak melalui tahapan status yang terproteksi:
$$\text{PENDING} \longrightarrow \text{CONFIRMED} \longrightarrow \text{IN\_PRODUCTION} \longrightarrow \text{READY} \longrightarrow \text{SHIPPED} \longrightarrow \text{COMPLETED}$$

> [!IMPORTANT]
> **Otomasi Pemotongan Stok Bahan Baku**:
> Saat Anda mengubah status pesanan ke **`IN_PRODUCTION`**, sistem secara otomatis memotong stok filamen (gram) dan komponen lampu sesuai resep BOM produk!
> Jika pesanan dibatalkan (**`CANCELLED`**), seluruh bahan baku dikembalikan otomatis ke inventaris.

---

## 6. Manajemen Kas, Pembayaran DP, dan Piutang (`/orders/receivables`)

1. **Pencatatan Uang Muka (DP) & Termin**:
   - Buka pesanan terkait, pilih *"Catat Kas / DP / Riwayat Bayar"*.
   - Masukkan nominal pembayaran (misal DP 50%), pilih metode pembayaran (Transfer BCA, QRIS, Tunai).
   - Status pembayaran otomatis beralih dari `UNPAID` menjadi `PARTIALLY_PAID`.
2. **Pelunasan Sisa Tagihan**:
   - Ketika barang selesai dicetak atau siap kirim, catat sisa pembayaran hingga lunas (`PAID`).
   - Tersedia tombol **"Konfirmasi Pelunasan Cepat"** untuk pelunasan instan.
3. **Monitoring Piutang Berjalan**:
   - Pada halaman `/orders/receivables`, Anda dapat memantau saldo piutang 7 pesanan belum lunas senilai Rp 655.000 lengkap dengan analisis umur piutang (*aging*).

---

## 7. Pengelolaan Beban Operasional Studio (`/expenses`)

Catat seluruh biaya rutin operasional studio:
- **Biaya Tetap (Fixed Costs)**: Sewa tempat (Rp 500.000/bln), Internet WiFi (Rp 250.000/bln), Amortisasi mesin (Rp 70.000/bln).
- **Biaya Variabel**: Iklan promosi ads (Rp 55.000), kemasan tambahan, dll.

Biaya ini akan digunakan sistem untuk menghitung target Break-Even Point (BEP) dan laporan laba rugi bulanan.

---

## 8. Laporan Finansial & Analitik Bisnis (`/reports`)

Sistem menyediakan 3 laporan standar akuntansi yang saling terintegrasi:

1. **Laporan Laba Rugi (`/reports/profit-loss`)**:
   - Memperlihatkan Pendapatan Bersih setelah diskon dan potongan marketplace Shopee.
   - Menghitung Laba Kotor dan Laba Bersih setelah seluruh beban operasional.
2. **Laporan Arus Kas (`/reports/cash-flow`)**:
   - Menampilkan kas masuk riil dari pelanggan vs kas keluar beban operasional dan investasi mesin.
   - Melacak saldo likuiditas kas berjalan studio.
3. **Analitik Produk & Penjualan (`/reports/sales-analytics`)**:
   - Menampilkan model lampu terlaris, persentase margin kontribusi, dan akumulasi estimasi jam cetak mesin 3D printer (~104.5 jam).

---

## 9. Fitur Ekspor Data ke Excel (CSV UTF-8 BOM)

Pada halaman **Pusat Laporan** (`/reports`), Anda dapat mengunduh 4 jenis laporan spreadsheet:
1. **Rekap Pesanan Lengkap (9 Transaksi)**
2. **Laporan Laba Rugi Operasional**
3. **Laporan Arus Kas Multi-Aktivitas**
4. **Matriks Profitabilitas Model Lampu**

Seluruh file CSV dilengkapi dengan *UTF-8 Byte Order Mark (BOM)* sehingga dapat langsung dibuka di Microsoft Excel versi apa pun tanpa masalah karakter rusak atau kolom berantakan.
