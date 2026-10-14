# Casa Moral 3D Printing Business Management System — Decision Log

Dokumen ini mencatat keputusan arsitektural, teknis, dan bisnis sepanjang proyek, beserta alasan, alternatif yang dipertimbangkan, dan status persetujuannya.

---

## Log Keputusan

### ADR-001: Penggunaan Next.js App Router & Supabase PostgreSQL
- **Tanggal**: 15 Oktober 2026
- **Status**: **PROPOSED (Menunggu Persetujuan Checkpoint 1)**
- **Konteks**: Diperlukan arsitektur web modern yang mendukung type-safety, performa cepat, dan database relasional dengan Row Level Security (RLS).
- **Keputusan**: Menggunakan **Next.js (App Router)** dengan **Supabase PostgreSQL** sebagai single source of truth data bisnis.
- **Alternatif yang Dipertimbangkan**:
  1. Next.js Pages Router: Lebih lama, App Router adalah standar modern Next.js.
  2. Prisma dengan SQLite lokal: Kurang cocok untuk cloud deployment dan audit multi-user.
- **Dampak**: Memastikan konsistensi data transaksional, integritas relasi foreign key, dan kemudahan deployment di Vercel/Supabase.

---

### ADR-002: Dual-Mode Engine untuk Perhitungan HPP
- **Tanggal**: 15 Oktober 2026
- **Status**: **PROPOSED**
- **Konteks**: Data historis Casa Moral (`HPP CASA MORAL V2.xlsx`) tidak mencatat waktu cetak (menit), melainkan menggunakan *flat multiplier* 1.2x. Sedangkan *Template ELS Studio* menggunakan metode presisi berbasis waktu cetak, watt listrik, reject rate, dan depresiasi per jam.
- **Keputusan**: Mengimplementasikan **Dual-Mode HPP Engine**:
  1. **Mode Standard (Multiplier 1.2x)**: Kompatibel dengan data lama Casa Moral.
  2. **Mode Advanced (Production Slicing)**: Menghitung listrik watt riil, depresiasi mesin per jam, dan reject rate saat data waktu cetak dari slicer tersedia.
- **Alternatif yang Dipertimbangkan**:
  - Memaksa hanya metode ELS Studio: Data lama Casa Moral tidak bisa dihitung karena tidak ada catatan waktu cetak.
  - Memaksa hanya metode 1.2x: Menghilangkan potensi akurasi tinggi saat Casa Moral ingin memperhitungkan listrik dan mesin secara presisi.
- **Dampak**: Sistem fleksibel, mendukung data historis sekaligus siap untuk operasional masa depan yang lebih matang.

---

### ADR-003: Pemisahan Tegas Markup vs Margin
- **Tanggal**: 15 Oktober 2026
- **Status**: **PROPOSED**
- **Konteks**: Di sheet Excel Casa Moral, formula `HPP * 50% + HPP` dinamai "Margin Keuntungan Target 50%". Padahal secara finansial ini adalah **Markup 50%** (yang menghasilkan Margin riil 33.33%).
- **Keputusan**: Sistem memisahkan label Markup dan Margin secara eksplisit. Form input menyediakan opsi untuk menetapkan harga berdasarkan Markup atau berdasarkan Margin, dan menampilkan kedua persentasenya secara berdampingan.
- **Alternatif yang Dipertimbangkan**: Membiarkan istilah rancu seperti di Excel.
- **Dampak**: Mencegah salah tafsir finansial yang fatal (margin 50% jauh lebih besar profitnya daripada markup 50%).

---

### ADR-004: Snapshot Harga & HPP pada `order_items`
- **Tanggal**: 15 Oktober 2026
- **Status**: **PROPOSED**
- **Konteks**: Harga filamen atau komponen dapat naik/turun di masa depan. Jika pesanan lama mengacu dinamis ke harga produk terkini, laporan penjualan masa lalu akan rusak.
- **Keputusan**: Setiap kali pesanan dibuat, nilai `unit_price`, `unit_hpp`, dan rincian diskon/add-on di-snapshot secara permanen ke dalam baris `order_items`.
- **Alternatif yang Dipertimbangkan**: Menghubungkan langsung foreign key `product_id` tanpa snapshot harga transaksi.
- **Dampak**: Integritas data historis terjamin 100% dan laporan keuangan masa lalu tidak akan pernah terdistorsi oleh perubahan master data.

---

### ADR-005: Pemisahan Metrik Omzet, Kas Diterima, dan Piutang
- **Tanggal**: 15 Oktober 2026
- **Status**: **PROPOSED**
- **Konteks**: Dari 9 transaksi awal Casa Moral senilai Rp945.000, sebanyak 7 transaksi (Rp655.000) masih berstatus "Belum Lunas".
- **Keputusan**: Dashboard dan modul finansial tidak boleh menganggap seluruh nilai pesanan sebagai uang kas masuk. Disediakan 3 metrik terpisah:
  1. Total Pesanan (Omzet Kotor)
  2. Total Kas Diterima (Realized Cash)
  3. Total Piutang Berjalan (Outstanding Receivables)
- **Alternatif yang Dipertimbangkan**: Mencampur seluruh pesanan sebagai pendapatan kas.
- **Dampak**: Arus kas riil bisnis terpantau akurat, mencegah pemilik merasa memiliki uang kas yang sebenarnya belum dibayar oleh pelanggan.
