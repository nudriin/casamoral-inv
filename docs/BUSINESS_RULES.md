# Casa Moral 3D Printing Business Management System — Business Rules

Dokumen ini mendefinisikan aturan bisnis yang mengatur sistem manajemen usaha Casa Moral, dipisahkan berdasarkan tingkat validitasnya sesuai Master Prompt Bagian 4.5.

---

## 1. Confirmed Rules (Aturan yang Sudah Terkonfirmasi dari Dokumen Sumber)

### 1.1 Struktur Produk Lampu Casa Moral
- Setiap produk lampu utama terdiri dari komponen cetak fisik 3D: **Base** (dudukan), **Shade** (penutup lampu), dan **Cap** (tutup atas, opsional seperti pada model Lumi yang tidak memiliki cap).
- Setiap unit lampu wajib menyertakan komponen kelistrikan standar:
  - 1 unit Fitting E27
  - 1 unit Lampu LED Bulb / Module (Inlite 3W Warm White / Putih)
  - 1 unit Kabel Sakelar On/Off
  - Karet Pelindung Kabel
- Setiap unit lampu menggunakan kemasan standar: Kardus Kemasan Custom (20x20x20 cm), Bubble Wrap, dan Sticker Label (opsional).

### 1.2 Pembelian Modal & Pengeluaran Awal
- Pembelian printer 3D (`Bambulab A1 Mini` dan `Anycubic Kobra X`) diklasifikasikan sebagai **Aset Tetap (Fixed Assets)**, bukan beban operasional langsung pada periode pembelian.
- Biaya layanan transaksi marketplace (Rp2.000 per transaksi belanja di Shopee) dikapitalisasi ke dalam total biaya perolehan barang terkait.
- Pembelian filamen, komponen perakitan, dan kardus kemasan diklasifikasikan sebagai **Persediaan (Inventory)**.

### 1.3 Manajemen Pesanan & Kanal Penjualan
- Sistem mendukung setidaknya dua kanal checkout: **Shopee** dan **Direct** (penjualan langsung/WhatsApp/offline).
- Sistem mendukung pencatatan **Add-On kustom** (seperti *Cap Custom Figur Lee Jeno* seharga Rp30.000) yang menambah nilai pesanan di luar harga lampu standar.
- Status pembayaran minimal mencakup: **Belum Lunas** dan **Lunas**.

### 1.4 Pemisahan Metrik Finansial
- Omzet/Nilai Pesanan tidak boleh disamakan dengan Kas Diterima. Pesanan berstatus "Belum Lunas" dicatat sebagai **Piutang Pelanggan (Accounts Receivable)**.
- Transaksi historis tidak boleh berubah nilainya saat harga produk atau biaya bahan baku diperbarui di masa depan.

---

## 2. Proposed Rules (Usulan Aturan Berdasarkan Standar Industri & Template)

### 2.1 Mode Perhitungan HPP Ganda (Dual-Mode HPP Engine)
1. **Mode Standard (Multiplier 1.2x - Casa Moral Historical)**:
   - Digunakan untuk produk yang tidak memiliki data waktu cetak slicer.
   - HPP = `(Total Biaya Bahan Baku + Komponen Listrik + Kemasan) * 1.2`.
   - Faktor 1.2x merepresentasikan alokasi listrik, depresiasi mesin, dan risiko kegagalan cetak secara empiris.
2. **Mode Advanced (Template ELS Studio - Time & Depresiasi Presisi)**:
   - Digunakan jika pengguna memasukkan waktu cetak (menit) dan watt printer dari slicer (Bambu Studio / Anycubic Slicer).
   - Menghitung secara eksplisit:
     - Biaya Filamen aktual + faktor purge
     - Biaya Listrik: `(Menit / 60) * (Watt / 1000) * Tarif PLN`
     - Depresiasi Mesin: `(Menit / 60) * Depresiasi per Jam`
     - Biaya Kegagalan: `(Bahan + Listrik + Depresiasi) * (Reject Rate / (1 - Reject Rate))`
     - Alokasi staf packing per unit

### 2.2 Distingsi Terminologi Keuangan: Markup vs Margin
- **Markup**: Persentase keuntungan di atas HPP:
  $$\text{Markup} = \frac{\text{Harga Jual} - \text{HPP}}{\text{HPP}} \times 100\%$$
- **Margin**: Persentase keuntungan dari Harga Jual:
  $$\text{Margin} = \frac{\text{Harga Jual} - \text{HPP}}{\text{Harga Jual}} \times 100\%$$
- Jika Casa Moral memasukkan angka 50% pada formula lama (`HPP * 50% + HPP`), sistem akan melabelinya secara akurat sebagai **Markup 50%** (yang menghasilkan Margin riil 33.33%).

### 2.3 Status Siklus Hidup Pesanan (Order Lifecycle)
Disarankan alur status pesanan standar:
1. `DRAFT` / `PENDING`: Pesanan masuk, belum dikonfirmasi.
2. `CONFIRMED`: Pesanan dikonfirmasi pelanggan.
3. `IN_PRODUCTION`: Model sedang dicetak atau dirakit.
4. `READY`: Selesai dirakit dan dikemas, siap kirim.
5. `SHIPPED`: Sedang dikirim via kurir / COD.
6. `COMPLETED`: Diterima pelanggan dan lunas.
7. `CANCELLED`: Dibatalkan (tidak dihitung dalam omzet).

### 2.4 Aturan Pergerakan Stok (Inventory Movements)
- Setiap kali pesanan beralih ke status `IN_PRODUCTION` atau `COMPLETED`, sistem secara otomatis mengurangi stok filamen (gram) dan stok komponen perakitan (pcs) melalui tabel `stock_movements`.
- Jika pesanan dibatalkan (`CANCELLED`) setelah sempat memotong stok, sistem membuat jurnal pembalik mutasi stok (*void/return movement*).

---

## 3. Needs Confirmation (Hal-hal yang Memerlukan Keputusan Pengguna)

Berikut adalah pertanyaan bisnis kritis yang membutuhkan arahan resmi dari pemilik Casa Moral:

1. **Perlakuan Pesanan Bernilai Rp0 (Bang Dona & Kumo)**:
   - Apakah dicatat sebagai biaya sampel/marketing (beban promosi), hadiah keluarga/teman, atau data testing yang harus dikecualikan dari omzet riil?
2. **Data Pelanggan Kosong pada File Excel**:
   - Untuk baris 10 (Pomi Rp150.000) dan baris 13 (Kumo Rp0), apakah ada nama pelanggan yang bisa dilengkapi, atau diberi default label "Pelanggan Umum (Sukamara)"?
3. **Tanggal Transaksi Historis**:
   - Karena file `Orderan Casa Moral.xlsx` tidak memiliki kolom tanggal, tanggal berapa yang harus dijadikan referensi pencatatan transaksi awal ini (misalnya estimasi bulan/tahun awal operasi)?
4. **Kebijakan Pembayaran & Piutang (Belum Lunas)**:
   - Dari 9 pesanan, 7 berstatus "Belum Lunas" senilai Rp655.000. Apakah sebagian sudah dibayarkan sebagian (DP/Down Payment), atau memang sistem bayar belakangan (konsinyasi / keluarga)?
5. **Kebijakan Potongan Platform Shopee**:
   - Untuk pesanan yang checkout via Shopee (contoh pesanan Mahput Rp130.000), apakah sistem harus otomatis memotong biaya administrasi Shopee (misalnya 8% + 4% ongkir xtra) dari omzet yang diakui?

---

## 4. Out of Scope (Di Luar Ruang Lingkup Proyek Saat Ini)

1. **Integrasi API Langsung ke Shopee Open Platform**:
   - Sinkronisasi API resmi Shopee memerlukan akun developer korporat dan audit verifikasi kompleks. Pada fase ini, pesanan Shopee diinput melalui form atau import CSV/Excel.
2. **Payment Gateway Otomatis (Midtrans/Xendit)**:
   - Pembayaran dicatat secara manual oleh admin (upload bukti transfer, konfirmasi status Lunas/Belum Lunas).
3. **E-Commerce Publik untuk Konsumen**:
   - Aplikasi ini berfokus 100% sebagai sistem manajemen operasional internal (*Internal Business Management & ERP System*), bukan toko online frontend untuk pembeli publik.
