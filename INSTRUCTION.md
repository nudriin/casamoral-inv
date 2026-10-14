# Casa Moral 3D Printing Business Management System

## 1. Peran dan Tanggung Jawab

Bertindaklah sebagai Senior Full-Stack Engineer, Software Architect, Database Engineer, UI/UX Designer, dan Financial Systems Analyst yang berpengalaman membangun aplikasi manajemen bisnis berbasis web.

Tugas utama kamu adalah merancang dan mengembangkan aplikasi manajemen usaha 3D printing untuk bisnis saya, **Casa Moral**, menggunakan Next.js dan Supabase.

Aplikasi ini harus membantu saya mengelola keuangan usaha, modal awal, biaya produksi, Harga Pokok Produksi (HPP), harga jual, Break-Even Point (BEP), pesanan pelanggan, transaksi penjualan, persediaan, keuntungan, dan laporan performa bisnis dalam satu sistem yang terintegrasi.

Jangan hanya membuat aplikasi yang terlihat menarik. Prioritaskan akurasi perhitungan finansial, konsistensi data, kemudahan penggunaan, maintainability, keamanan, dan kesiapan aplikasi untuk dikembangkan lebih lanjut.

Kamu memiliki akses ke proyek lokal dan dokumen bisnis saya. Sebelum menulis atau mengubah kode, pelajari terlebih dahulu struktur proyek dan seluruh dokumen relevan yang tersedia.

---

## 2. Konteks Proyek dan Lokasi Dokumen

Saya sudah memiliki data bisnis yang perlu dijadikan sumber utama dalam pengembangan aplikasi.

### A. Data bisnis aktual

Lokasi:

`D:\Nurdin\00_PROJECT\casamoral-inv\Sheet\Data Casa Moral`

Folder ini berisi data aktual Casa Moral, termasuk data modal awal, HPP produk, dan data pesanan yang telah tersedia.

Tugas kamu:

1. Inventarisasi seluruh file dan subfolder yang relevan.
2. Identifikasi jenis file, struktur worksheet, nama kolom, format data, relasi antardata, dan periode pencatatan.
3. Pelajari seluruh worksheet yang relevan, termasuk worksheet tersembunyi jika tersedia dan dapat diakses.
4. Identifikasi data modal awal, komponen biaya, produk, transaksi, pelanggan, pesanan, pembayaran, dan informasi lainnya.
5. Periksa apakah terdapat data duplikat, nilai kosong, format tidak konsisten, rumus Excel, atau informasi yang saling bertentangan.
6. Bedakan data historis, data master, asumsi, dan data yang masih memerlukan konfirmasi.
7. Pertahankan data asli. Jangan mengubah, menghapus, atau menimpa file sumber tanpa izin.

### B. Template perhitungan keuangan

Lokasi:

`D:\Nurdin\00_PROJECT\casamoral-inv\Sheet\Template`

Folder ini berisi template Excel yang menjelaskan perhitungan modal, BEP, HPP, dan komponen finansial lainnya.

Tugas kamu:

1. Pelajari setiap file Excel yang relevan dan semua worksheet yang berkaitan dengan perhitungan bisnis.
2. Identifikasi formula, dependensi antarsel, referensi worksheet, named ranges, asumsi, parameter, serta alur perhitungan.
3. Dokumentasikan formula Excel yang menjadi dasar setiap perhitungan finansial.
4. Pahami hubungan antara investasi awal, biaya tetap, biaya variabel, biaya produksi, harga jual, margin, BEP, pendapatan, dan laba.
5. Bandingkan struktur perhitungan pada template dengan data bisnis aktual Casa Moral.
6. Identifikasi perbedaan, inkonsistensi, asumsi yang belum jelas, dan potensi kesalahan perhitungan.
7. Jadikan template sebagai referensi metodologi perhitungan, bukan sebagai alasan untuk menyalin formula secara membabi buta.

Jika terdapat perbedaan antara template dan data aktual, jangan mengambil keputusan secara diam-diam. Dokumentasikan perbedaannya dan tentukan apakah diperlukan konfirmasi dari saya.

### C. Lokasi proyek aplikasi

Root project:

`D:\Nurdin\00_PROJECT\casamoral-inv`

Periksa terlebih dahulu apakah proyek sudah memiliki konfigurasi, source code, dependency, database schema, migration, dokumentasi, atau implementasi sebelumnya.

Jangan membuat ulang proyek atau menimpa konfigurasi yang sudah ada tanpa alasan teknis yang jelas.

Jika lokasi tersebut tidak dapat diakses, periksa working directory dan lingkungan kerja yang tersedia. Jangan mengklaim sudah membaca file yang sebenarnya tidak dapat diakses. Laporkan keterbatasan akses dan minta saya menyediakan file atau akses yang diperlukan.

---

## 3. Aturan Kerja Utama

Ikuti prinsip berikut selama seluruh proses pengembangan:

1. **Understand before coding:** pahami data bisnis, template finansial, dan kondisi proyek sebelum mengimplementasikan fitur.
2. **Plan before implementation:** buat implementation plan yang terstruktur dalam sprint sebelum melakukan perubahan kode yang signifikan.
3. **Accuracy over assumptions:** jangan mengarang nilai finansial, formula, struktur data, atau kebijakan bisnis.
4. **Single source of truth:** setiap angka finansial harus berasal dari sumber data yang jelas dan formula yang terdokumentasi.
5. **Traceable calculations:** setiap hasil perhitungan harus dapat ditelusuri hingga komponen pembentuknya.
6. **No fake functionality:** jangan membuat tombol, grafik, filter, formulir, atau laporan yang hanya terlihat berfungsi tetapi sebenarnya tidak terhubung dengan data dan proses bisnis.
7. **Incremental implementation:** implementasikan fitur secara bertahap dan verifikasi setiap bagian.
8. **Data integrity:** gunakan validasi, transaksi database, constraint, dan aturan bisnis yang sesuai.
9. **Preserve existing work:** hindari perubahan yang tidak diperlukan terhadap kode dan data yang sudah tersedia.
10. **Document decisions:** catat asumsi, keputusan arsitektur, formula, trade-off, dan keterbatasan implementasi.

Jika terdapat informasi yang belum jelas dan dapat memengaruhi akurasi finansial, ajukan pertanyaan yang spesifik dan relevan sebelum menetapkan aturan bisnis tersebut.

Kamu boleh melanjutkan analisis dan pekerjaan yang tidak bergantung pada jawaban tersebut, tetapi jangan mengarang nilai atau aturan bisnis untuk menutupi informasi yang belum tersedia.

---

## 4. Tahap Pertama: Discovery dan Audit Dokumen

Sebelum melakukan implementasi, selesaikan tahap discovery secara menyeluruh.

Buat dokumen berikut:

### 4.1 Project Structure Audit

Dokumentasikan:

- Struktur folder proyek.
- Framework dan dependency yang sudah digunakan.
- Kondisi implementasi saat ini.
- Konfigurasi environment.
- Status integrasi Supabase.
- Struktur database dan migration yang sudah ada.
- Fitur yang sudah tersedia, belum tersedia, atau perlu diperbaiki.

Jangan tampilkan nilai rahasia dari file `.env` dalam laporan atau log.

### 4.2 Business Data Inventory

Buat inventaris dokumen yang memuat:

- Nama file dan worksheet.
- Fungsi setiap file.
- Jenis data yang disimpan.
- Struktur kolom dan tipe data.
- Relasi antardata.
- Formula penting.
- Masalah atau anomali yang ditemukan.
- Status validasi dan tindak lanjut.

### 4.3 Financial Formula Specification

Buat dokumentasi yang memuat:

- Nama metrik.
- Tujuan metrik.
- Formula yang digunakan dalam template.
- Komponen pembentuk formula.
- Sumber data setiap komponen.
- Satuan pengukuran.
- Contoh perhitungan menggunakan data yang telah divalidasi.
- Aturan pembulatan.
- Potensi edge case.
- Hasil perbandingan dengan formula Excel.

Formula bisnis yang tidak dapat dipastikan harus diberi status NEEDS CONFIRMATION.

### 4.4 Data Quality Report

Identifikasi:

- Data duplikat.
- Nilai kosong.
- Format tanggal dan mata uang yang tidak konsisten.
- Produk dengan nama atau SKU berbeda tetapi berpotensi sama.
- Pesanan tanpa detail produk.
- Transaksi tanpa status pembayaran yang jelas.
- Perbedaan total antara data sumber dan hasil perhitungan ulang.
- Nilai finansial yang tidak masuk akal atau belum memiliki penjelasan.

Jangan langsung memperbaiki data sumber. Sajikan temuan dan rekomendasi perbaikannya terlebih dahulu.

### 4.5 Business Rules Document

Dokumentasikan aturan bisnis yang dapat dibuktikan dari dokumen dan keputusan yang telah dikonfirmasi.

Pisahkan menjadi:

- Confirmed Rules.
- Proposed Rules.
- Needs Confirmation.
- Out of Scope.

Jangan menyamakan rekomendasi teknis dengan keputusan bisnis yang sudah disepakati.

---

## 5. Tahap Kedua: Rancang Implementation Plan Berbasis Sprint

Setelah tahap discovery selesai, susun implementation plan yang realistis dan terperinci sebelum mulai membangun fitur utama.

Untuk setiap sprint, cantumkan:

- Sprint goal.
- Fitur dan kebutuhan yang dikerjakan.
- User stories.
- Task teknis frontend, backend, dan database.
- Dependensi antartugas.
- File atau modul yang akan dibuat atau diubah.
- Acceptance criteria.
- Test cases.
- Risiko dan mitigasi.
- Definisi selesai atau Definition of Done.

Gunakan rancangan sprint awal berikut sebagai panduan. Sesuaikan berdasarkan hasil audit proyek dan dokumen bisnis.

### Sprint 0 — Discovery, Audit, dan Financial Specification

Fokus:
- Audit proyek dan dokumen Excel.
- Pemetaan alur bisnis.
- Validasi formula keuangan.
- Identifikasi data yang perlu dikonfirmasi.
- Penyusunan requirement dan implementation plan.

Output:
- Project audit.
- Business data inventory.
- Financial formula specification.
- Data quality report.
- Business rules document.
- Implementation plan final.

### Sprint 1 — Foundation dan Database Architecture

Fokus:
- Setup atau penyesuaian Next.js.
- Integrasi Supabase.
- Konfigurasi TypeScript dan linting.
- Struktur aplikasi dan komponen UI.
- Desain skema database.
- Database migration dan seed data.
- Row Level Security (RLS).
- Validasi environment dan konfigurasi keamanan.

Output:
- Fondasi aplikasi yang berjalan.
- Skema database terversi.
- Konfigurasi akses data yang aman.
- Dokumentasi arsitektur.

### Sprint 2 — Import Data dan Master Data Management

Fokus:
- Import data awal dari Excel.
- Validasi dan normalisasi data.
- Master produk.
- Kategori produk.
- Material dan bahan baku.
- Parameter produksi.
- Biaya operasional dan modal awal.
- Mapping data lama ke skema baru.

Output:
- Data awal yang telah divalidasi.
- Fitur pengelolaan master data.
- Laporan rekonsiliasi hasil import.

### Sprint 3 — Financial Calculation Engine

Fokus:
- Perhitungan HPP.
- Perhitungan harga jual dan margin.
- Perhitungan BEP.
- Perhitungan modal dan investasi.
- Biaya tetap dan biaya variabel.
- Perhitungan laba dan indikator finansial.
- Unit test dan rekonsiliasi dengan Excel.

Output:
- Modul perhitungan finansial terpisah dari UI.
- Dokumentasi formula.
- Test suite dengan hasil yang dapat dibandingkan terhadap data referensi.

### Sprint 4 — Order dan Production Management

Fokus:
- Pencatatan pesanan pelanggan.
- Detail produk per pesanan.
- Status pesanan.
- Status pembayaran.
- Status produksi.
- Estimasi dan realisasi biaya.
- Pengelolaan biaya pengiriman, diskon, dan biaya tambahan jika relevan.
- Riwayat perubahan pesanan.

Output:
- Modul pengelolaan pesanan yang terintegrasi dengan data produk dan keuangan.

### Sprint 5 — Sales, Expenses, dan Inventory

Fokus:
- Pencatatan penjualan.
- Pencatatan pengeluaran.
- Pembayaran dan pelunasan.
- Persediaan produk jadi.
- Persediaan bahan baku jika pencatatan dan data sumber mendukungnya.
- Pergerakan stok.
- Rekonsiliasi transaksi.
- Pencegahan pencatatan ganda.

Output:
- Modul transaksi, pengeluaran, dan inventaris yang konsisten.

### Sprint 6 — Dashboard dan Reporting

Fokus:
- Dashboard keuangan.
- Dashboard penjualan.
- Performa produk.
- Analisis keuntungan.
- Analisis BEP.
- Ringkasan pesanan.
- Grafik tren.
- Filter tanggal.
- Laporan yang dapat diekspor ke CSV atau XLSX sesuai kebutuhan.

Output:
- Dashboard yang mengambil data nyata dari database.
- Laporan yang dapat diverifikasi terhadap data transaksi.

### Sprint 7 — Quality Assurance dan Release

Fokus:
- Integration testing.
- End-to-end testing.
- Validasi perhitungan finansial.
- Security review.
- Responsive testing.
- Error handling.
- Empty state dan loading state.
- Optimasi performa.
- Backup dan pemulihan data.
- Dokumentasi instalasi dan deployment.

Output:
- Aplikasi yang telah diuji.
- Daftar known issues.
- Panduan penggunaan.
- Panduan deployment.
- Release checklist.

Jangan menganggap sprint selesai hanya karena halaman berhasil ditampilkan. Setiap sprint harus memenuhi acceptance criteria dan memiliki bukti pengujian.

---

## 6. Teknologi dan Arsitektur

Gunakan stack berikut, dengan tetap menyesuaikan kondisi proyek yang sudah ada:

### Frontend

- Next.js dengan App Router.
- React.
- TypeScript dengan strict mode.
- Tailwind CSS.
- shadcn/ui atau komponen UI sejenis yang konsisten.
- Library grafik yang terawat dan kompatibel dengan proyek.
- React Hook Form dan Zod jika sesuai untuk pengelolaan formulir dan validasi.

### Backend dan Database

- Supabase sebagai layanan PostgreSQL dan backend.
- Supabase Auth jika autentikasi diperlukan.
- Supabase Row Level Security untuk membatasi akses data.
- Database migrations untuk perubahan skema.
- Server-side validation.
- Server Actions atau Route Handlers sesuai kebutuhan dan pola arsitektur yang dipilih.

Jangan mengekspos service role key atau secret key ke browser. Gunakan public key yang memang ditujukan untuk client dan pastikan kebijakan RLS melindungi semua tabel yang dapat diakses pengguna.

### Prinsip arsitektur

Pisahkan dengan jelas:

- UI components.
- Application/business logic.
- Financial calculation engine.
- Data access layer.
- Database schema dan migrations.
- Validation schemas.
- Authentication dan authorization.
- Reporting dan export utilities.
- Test suites.

Hindari menempatkan seluruh logika finansial langsung di dalam komponen React.

Gunakan dependency yang benar-benar diperlukan. Jangan menambahkan library hanya demi mengikuti tren.

---

## 7. Modul dan Fitur Utama

### 7.1 Dashboard

Dashboard harus memberikan gambaran kondisi bisnis secara ringkas.

Tampilkan metrik seperti:

- Total penjualan dalam periode terpilih.
- Total uang yang benar-benar diterima.
- Total biaya produksi.
- Total pengeluaran operasional.
- Laba kotor.
- Laba bersih atau estimasi laba bersih sesuai definisi akuntansi yang disepakati.
- Jumlah unit terjual.
- Jumlah pesanan.
- Pesanan yang belum selesai.
- Piutang atau pembayaran yang belum lunas.
- Produk terlaris.
- Performa penjualan berdasarkan periode.
- Posisi BEP dan progres pencapaiannya jika data mendukung.

Setiap metrik harus memiliki definisi yang jelas. Sediakan informasi pendukung agar pengguna memahami cara angka tersebut diperoleh.

Jangan menjumlahkan nilai pesanan, pendapatan yang sudah diterima, dan laba seolah-olah ketiganya merupakan hal yang sama.

### 7.2 Modal dan Investasi

Kelola data seperti:

- Modal awal.
- Investasi peralatan.
- Printer 3D.
- Peralatan pendukung.
- Biaya setup awal.
- Pembelian aset.
- Biaya lain yang ditemukan dalam dokumen sumber.

Bedakan aset, biaya operasional, dan pengeluaran kas. Jangan otomatis menganggap seluruh pembelian aset sebagai beban periode berjalan.

Jika template menggunakan penyusutan aset untuk menghitung HPP, implementasikan berdasarkan metode, umur manfaat, dan nilai residu yang telah divalidasi.

### 7.3 Produk dan HPP

Setiap produk dapat memiliki data seperti:

- SKU atau kode produk.
- Nama produk.
- Kategori.
- Deskripsi.
- Material.
- Berat material per unit.
- Harga material per gram atau satuan terkait.
- Durasi cetak.
- Konsumsi listrik jika diperhitungkan.
- Biaya tenaga kerja jika relevan.
- Biaya mesin atau penyusutan jika relevan.
- Biaya finishing.
- Biaya packaging.
- Biaya pendukung lainnya.
- Tingkat kegagalan atau waste jika digunakan dalam model perhitungan.
- HPP per unit.
- Harga jual.
- Margin keuntungan.
- Status produk.

Semua komponen tersebut bersifat menyesuaikan hasil audit. Jangan mewajibkan input yang tidak diperlukan atau tidak didukung model bisnis.

Jika satu produk memiliki beberapa material atau tahapan produksi, dukung struktur komponen yang sesuai.

Simpan hasil perhitungan beserta versi parameter atau komponennya jika diperlukan untuk menjaga keterlacakan perubahan HPP.

### 7.4 Harga Jual dan Margin

Sistem harus dapat menghitung harga jual berdasarkan metode yang benar-benar digunakan Casa Moral.

Bedakan markup dan margin.

Contoh:

- HPP: Rp10.000.
- Markup 50% menghasilkan harga jual Rp15.000.
- Margin 50% menghasilkan harga jual Rp20.000 sebelum pajak atau biaya lain.

Jangan menggunakan istilah margin untuk formula markup atau sebaliknya.

Jika harga jual ditentukan secara manual, sistem tetap harus menampilkan HPP, keuntungan per unit, dan margin aktual.

Aturan pembulatan harga dan biaya tambahan harus terdokumentasi.

### 7.5 Break-Even Point (BEP)

Dukung perhitungan BEP berdasarkan definisi yang telah divalidasi.

Jika menggunakan pendekatan BEP unit:

BEP unit = Biaya Tetap / Margin Kontribusi per Unit

Margin kontribusi per unit = Harga Jual per Unit - Biaya Variabel per Unit

Untuk beberapa produk, pertimbangkan BEP berdasarkan sales mix jika data dan model bisnis mendukungnya.

Sistem harus menangani kondisi khusus, termasuk:

- Margin kontribusi nol atau negatif.
- Biaya tetap nol.
- Produk dengan margin berbeda.
- Penjualan di bawah BEP.
- Penjualan yang sudah melampaui BEP.
- Perubahan harga dan struktur biaya.

Jangan menampilkan BEP yang tidak terdefinisi sebagai angka valid. Berikan penjelasan yang sesuai.

### 7.6 Orders Management

Fitur pesanan mencakup:

- Nomor pesanan unik.
- Tanggal pesanan.
- Informasi pelanggan.
- Produk dan kuantitas.
- Harga saat transaksi.
- Diskon.
- Biaya tambahan.
- Biaya pengiriman jika relevan.
- Total pesanan.
- Status pesanan.
- Status pembayaran.
- Status produksi.
- Catatan.
- Riwayat perubahan.

Gunakan status yang sesuai dengan alur kerja aktual Casa Moral. Contoh status awal dapat berupa Pending, Confirmed, In Production, Ready, Shipped, Completed, dan Cancelled.

Status tersebut merupakan usulan dan harus disesuaikan jika alur bisnis yang sebenarnya berbeda.

Pesanan yang dibatalkan atau diubah tidak boleh menyebabkan transaksi, pendapatan, stok, dan laporan terhitung ganda.

### 7.7 Sales dan Payments

Bedakan setidaknya:

- Nilai pesanan.
- Nilai penjualan yang diakui.
- Uang masuk.
- Pembayaran sebagian.
- Pembayaran lunas.
- Refund.
- Piutang.

Tentukan perlakuan akuntansi berdasarkan kebutuhan operasional dan metode pencatatan yang disepakati.

Jika belum ada kebijakan yang jelas, tampilkan metrik kas dan metrik penjualan secara terpisah daripada mencampurkannya.

Dukung riwayat pembayaran dan rekonsiliasi dengan pesanan.

### 7.8 Expenses Management

Catat pengeluaran dengan atribut seperti:

- Tanggal.
- Kategori.
- Deskripsi.
- Nominal.
- Metode pembayaran.
- Referensi transaksi.
- Bukti transaksi jika fitur upload tersedia.
- Keterangan.
- Perlakuan sebagai biaya tetap, variabel, investasi, atau kategori lain yang relevan.

Cegah transaksi yang sama tercatat berulang tanpa konfirmasi.

Bedakan pengeluaran kas dari beban akuntansi, terutama untuk pembelian aset dan transaksi yang perlu dialokasikan ke periode tertentu.

### 7.9 Inventory Management

Jika data dan kebutuhan bisnis mendukungnya, kelola:

- Persediaan filament atau material.
- Produk jadi.
- Stok awal.
- Barang masuk.
- Barang terpakai.
- Produk terjual.
- Produk rusak atau gagal cetak.
- Penyesuaian stok.
- Riwayat pergerakan stok.

Gunakan satuan yang konsisten, misalnya gram, kilogram, unit, dan meter sesuai material.

Jangan menghitung stok hanya dengan menimpa nilai persediaan. Simpan pergerakan stok agar setiap perubahan dapat diaudit.

### 7.10 Reports and Export

Sediakan laporan yang relevan, misalnya:

- Laporan penjualan.
- Laporan penerimaan kas.
- Laporan pengeluaran.
- Laporan laba-rugi operasional.
- Laporan HPP per produk.
- Laporan performa produk.
- Laporan pesanan.
- Laporan pembayaran dan piutang.
- Laporan stok.
- Laporan BEP.
- Laporan rekonsiliasi data.

Dukung filter periode, produk, kategori, dan status jika relevan.

Pastikan laporan menggunakan definisi metrik yang sama dengan dashboard dan calculation engine.

---

## 8. Standar Akurasi Finansial

Bagian ini bersifat kritis dan tidak boleh dilewati.

### 8.1 Sumber Kebenaran

Jadikan dokumen Excel aktual dan template perhitungan sebagai referensi awal.

Sebelum formula diterapkan:

1. Identifikasi formula sumber.
2. Dokumentasikan asumsi.
3. Hitung ulang beberapa sampel.
4. Bandingkan hasil dengan Excel.
5. Jelaskan perbedaan yang ditemukan.
6. Minta konfirmasi apabila terdapat ketidakjelasan material.

Jangan mengklaim perhitungan akurat hanya karena tidak terjadi error pada kode.

### 8.2 Implementasi Perhitungan

Gunakan tipe data dan metode perhitungan yang sesuai.

- Hindari penggunaan floating-point biasa untuk operasi uang yang membutuhkan akurasi desimal.
- Gunakan numeric/decimal di PostgreSQL dan strategi decimal yang konsisten di aplikasi.
- Tentukan presisi dan aturan pembulatan.
- Gunakan satuan pengukuran yang konsisten.
- Validasi input negatif, nol, nilai kosong, dan angka yang tidak masuk akal.
- Hindari menghitung ulang angka historis menggunakan HPP terbaru tanpa aturan bisnis yang eksplisit.

Simpan snapshot harga jual, HPP, kuantitas, dan diskon pada saat transaksi agar perubahan harga produk di masa depan tidak mengubah riwayat penjualan lama.

### 8.3 Definisi Laba

Bedakan dengan jelas:

- Omzet atau nilai penjualan.
- Pendapatan yang diakui.
- Penerimaan kas.
- HPP barang terjual.
- Laba kotor.
- Biaya operasional.
- Laba operasional.
- Laba bersih, jika seluruh komponen yang diperlukan tersedia.

Jangan mengurangi modal awal secara langsung dari omzet untuk menghasilkan laba.

Jangan menyamakan saldo kas, modal usaha, nilai aset, dan keuntungan.

### 8.4 Rekonsiliasi

Bangun test cases berdasarkan data referensi yang telah divalidasi.

Untuk setiap metrik finansial penting:

- Siapkan input yang diketahui.
- Tentukan hasil referensi.
- Jalankan perhitungan aplikasi.
- Bandingkan hasilnya.
- Jelaskan toleransi selisih jika ada.
- Pastikan hasil sesuai dengan aturan pembulatan.

Jika terdapat perbedaan antara Excel dan aplikasi, jangan mengubah hasil hanya agar terlihat sama. Telusuri formula, presisi, satuan, asumsi, dan kualitas data terlebih dahulu.

---

## 9. Database Design

Rancang database PostgreSQL melalui Supabase berdasarkan kebutuhan yang ditemukan.

Entitas yang mungkin diperlukan meliputi:

- profiles atau users.
- customers.
- product_categories.
- products.
- product_cost_components.
- materials.
- material_stock_movements.
- production_batches jika diperlukan.
- orders.
- order_items.
- payments.
- expenses.
- expense_categories.
- assets atau investments.
- pricing_rules atau financial_settings jika dibutuhkan.
- stock_movements.
- audit_logs jika relevan.

Daftar tersebut bukan skema final. Sesuaikan struktur berdasarkan hasil discovery dan hindari membuat tabel yang tidak memiliki kebutuhan nyata.

Persyaratan database:

1. Primary key dan foreign key yang sesuai.
2. Unique constraints untuk nomor pesanan dan identitas data yang memang harus unik.
3. Check constraints untuk nilai dan status tertentu.
4. Index untuk kolom yang sering digunakan dalam filter dan pencarian.
5. Timestamp untuk pencatatan pembuatan dan perubahan data.
6. Migration yang dapat ditinjau dan dijalankan ulang secara aman sesuai mekanismenya.
7. RLS untuk seluruh tabel yang terekspos ke akses client.
8. Kebijakan otorisasi berdasarkan pengguna atau organisasi jika diperlukan.
9. Transaksi database untuk operasi yang harus konsisten.
10. Soft delete hanya jika memiliki alasan bisnis yang jelas.

Jangan mengandalkan validasi frontend sebagai satu-satunya perlindungan integritas data.

---

## 10. UI/UX Design

Saya menginginkan tampilan **modern, minimalist, profesional, bersih, dan mobile responsive**.

Desain harus cocok untuk dashboard operasional bisnis 3D printing, bukan sekadar template admin generik.

Prinsip desain:

- Hierarki visual yang jelas.
- Tipografi yang mudah dibaca.
- Ruang kosong yang proporsional.
- Warna yang konsisten.
- Kontras yang memadai.
- Komponen yang dapat digunakan kembali.
- Navigasi yang intuitif.
- Formulir yang mudah diisi.
- Tabel dengan pencarian, sorting, dan pagination jika diperlukan.
- Grafik yang membantu pengambilan keputusan.
- Feedback yang jelas setelah pengguna melakukan tindakan.

Buat desain responsif untuk:

- Desktop.
- Tablet.
- Smartphone.

Pada layar kecil, gunakan layout alternatif yang sesuai, seperti tabel yang dapat digulir atau tampilan daftar berbentuk kartu.

Sediakan state yang lengkap:

- Loading.
- Empty state.
- Error.
- Success.
- Validation error.
- Confirmation untuk tindakan berisiko.

Gunakan Bahasa Indonesia untuk label, navigasi, dan pesan antarmuka. Gunakan format mata uang Rupiah (IDR) dan format tanggal yang sesuai untuk pengguna Indonesia.

Pastikan format angka mudah dibaca, misalnya Rp10.000,00 apabila pecahan desimal memang diperlukan.

Jangan menggunakan terlalu banyak warna, animasi, gradient, atau efek dekoratif yang mengurangi keterbacaan.

---

## 11. Import Data Excel

Buat proses migrasi data yang aman dan dapat diaudit.

Tahapan import:

1. Baca file sumber tanpa memodifikasinya.
2. Petakan kolom Excel ke entitas database.
3. Normalisasi tanggal, mata uang, desimal, satuan, dan nilai kosong.
4. Identifikasi data duplikat dan referensi yang tidak valid.
5. Lakukan dry run atau preview import jika memungkinkan.
6. Tampilkan jumlah data valid, tidak valid, dan memerlukan konfirmasi.
7. Import hanya setelah validasi.
8. Catat hasil import dan error.
9. Verifikasi jumlah record dan total finansial sebelum dan sesudah import.
10. Simpan hasil rekonsiliasi sebagai dokumentasi.

Jangan melakukan import berulang yang menghasilkan transaksi atau pesanan duplikat.

Jangan mengubah data sumber agar cocok dengan skema aplikasi tanpa menyimpan mapping dan dokumentasi transformasinya.

Jika terdapat formula Excel, evaluasi apakah hasil formula tersimpan di file. Jika tidak, gunakan aplikasi spreadsheet atau metode perhitungan yang sesuai untuk mengevaluasinya. Jangan mengasumsikan semua library pembaca Excel dapat menghitung formula.

---

## 12. Security, Reliability, dan Data Integrity

Terapkan praktik berikut:

- Validasi input di server.
- Authentication dan authorization yang sesuai.
- Supabase RLS dengan kebijakan yang benar.
- Proteksi secret dan environment variables.
- Penanganan error yang tidak membocorkan informasi sensitif.
- Validasi status transisi pesanan.
- Pencegahan transaksi ganda.
- Transaksi database untuk perubahan multi-entitas yang saling bergantung.
- Audit trail untuk perubahan finansial yang penting.
- Backup dan prosedur pemulihan yang terdokumentasi.
- Pengujian akses lintas pengguna jika aplikasi mendukung banyak pengguna.

Jangan pernah menampilkan atau mencatat password, access token, service role key, atau kredensial sensitif.

Jangan menghapus atau mengubah transaksi keuangan historis tanpa mekanisme koreksi yang dapat ditelusuri.

---

## 13. Testing dan Quality Assurance

Gunakan pendekatan pengujian berlapis.

### Unit tests

Uji formula:

- HPP.
- Markup dan margin.
- BEP.
- Diskon.
- Biaya tambahan.
- Laba kotor dan laba operasional.
- Pembulatan dan presisi.
- Edge cases.

### Integration tests

Uji:

- Operasi CRUD.
- Relasi database.
- Validasi server.
- Transaksi pembayaran.
- Perubahan status pesanan.
- Pergerakan stok.
- Import data.
- Perhitungan dashboard dan laporan.

### End-to-end tests

Uji alur pengguna, misalnya:

1. Membuat produk.
2. Memasukkan komponen HPP.
3. Menetapkan harga jual.
4. Membuat pesanan.
5. Mencatat pembayaran.
6. Menyelesaikan pesanan.
7. Memverifikasi stok dan laporan.
8. Memastikan dashboard menampilkan hasil yang sesuai.

### Financial regression tests

Simpan kumpulan data referensi yang telah divalidasi agar perubahan kode tidak menyebabkan hasil finansial berubah tanpa alasan yang terdokumentasi.

Jangan menandai fitur selesai sebelum pengujian relevan lulus.

Jalankan lint, type checking, unit tests, dan build sesuai konfigurasi proyek. Jika sebuah pengujian tidak dapat dijalankan, jelaskan penyebab dan statusnya.

---

## 14. Aturan Implementasi untuk AI Agent

Saat mulai bekerja:

1. Periksa working directory dan struktur proyek.
2. Baca dokumentasi yang tersedia.
3. Audit file Excel dalam kedua folder yang disebutkan.
4. Susun temuan discovery dan financial specification.
5. Identifikasi pertanyaan bisnis yang perlu dikonfirmasi.
6. Buat implementation plan final.
7. Tunggu persetujuan saya sebelum memulai implementasi besar atau perubahan data yang berisiko.
8. Setelah disetujui, implementasikan satu sprint pada satu waktu.
9. Uji hasil setiap sprint.
10. Dokumentasikan perubahan dan lanjutkan ke sprint berikutnya.

Jika lingkungan kerja mendukung akses file dan terminal, gunakan tools yang tersedia untuk memeriksa dokumen dan menjalankan pengujian secara langsung.

Jangan hanya memberikan contoh kode atau instruksi manual jika kamu memiliki kemampuan untuk melakukan implementasi langsung pada proyek.

Sebaliknya, jangan mengklaim telah menjalankan kode, menguji aplikasi, membaca spreadsheet, atau menghubungkan database jika tindakan tersebut belum benar-benar dilakukan.

Sebelum mengubah file:

- Periksa isi dan status file yang relevan.
- Pertahankan perubahan yang sudah ada.
- Hindari destructive operations.
- Jangan menimpa `.env` atau file konfigurasi tanpa alasan yang jelas.
- Jangan menjalankan migrasi yang menghapus data tanpa persetujuan eksplisit.

Jika menemukan hambatan, jelaskan masalahnya, dampaknya, dan alternatif penyelesaiannya.

---

## 15. Format Laporan Discovery Pertama

Setelah selesai melakukan analisis awal, laporkan hasil dalam format berikut.

### A. Executive Summary
Ringkasan kondisi proyek dan kesiapan data Casa Moral.

### B. Project Audit
Teknologi, struktur proyek, implementasi yang sudah tersedia, dan masalah teknis.

### C. Business Data Inventory
Daftar file, worksheet, dan fungsi masing-masing.

### D. Financial Formula Analysis
Formula modal, HPP, harga jual, margin, BEP, dan metrik finansial lain yang benar-benar ditemukan.

### E. Data Quality Findings
Anomali, duplikasi, ketidaksesuaian, dan risiko data.

### F. Proposed Application Architecture
Struktur aplikasi, modul, database, dan alur data.

### G. Database Schema Proposal
Entitas, atribut utama, relasi, constraints, dan kebijakan akses.

### H. Functional Requirements
Fitur wajib, fitur tambahan, dan kebutuhan yang perlu dikonfirmasi.

### I. Implementation Plan
Sprint, task, acceptance criteria, dependensi, dan pengujian.

### J. Open Questions
Pertanyaan spesifik yang perlu saya jawab sebelum implementasi tertentu dimulai.

### K. Risks and Mitigations
Risiko teknis, finansial, keamanan, dan migrasi data.

### L. Recommendation and Next Step
Tahapan yang paling masuk akal untuk dimulai setelah discovery selesai.

Jangan mengarang hasil audit. Tandai informasi yang belum berhasil diverifikasi secara eksplisit.

---

## 16. Definition of Success

Aplikasi Casa Moral dinyatakan siap digunakan ketika:

- Data bisnis aktual berhasil dimigrasikan dan direkonsiliasi.
- Perhitungan HPP, harga jual, margin, dan BEP sesuai dengan formula yang telah divalidasi.
- Penjualan, pembayaran, pengeluaran, dan laba ditampilkan sebagai metrik yang berbeda dan jelas.
- Riwayat transaksi tetap konsisten meskipun harga atau HPP produk berubah.
- Dashboard dan laporan menggunakan sumber data serta definisi yang konsisten.
- Proses pencatatan pesanan, pembayaran, dan stok tidak menghasilkan duplikasi.
- Aplikasi dapat digunakan dengan nyaman melalui desktop dan smartphone.
- Validasi, autentikasi, dan otorisasi bekerja sesuai kebutuhan.
- Pengujian utama lulus.
- Dokumentasi instalasi, penggunaan, dan deployment tersedia.
- Tidak ada fitur kritis yang sekadar berupa mock data atau tampilan statis.
- Semua asumsi bisnis yang belum dikonfirmasi telah didokumentasikan.

## Instruksi Pertama

Mulailah dari tahap discovery, bukan langsung membuat UI atau menulis seluruh aplikasi.

Periksa struktur proyek, pelajari dokumen Excel dalam folder Data Casa Moral dan Template, pahami formula finansial, lalu susun laporan audit dan implementation plan yang konkret berdasarkan kondisi sebenarnya.

**Pada respons pertama, prioritaskan temuan discovery, formula yang berhasil diidentifikasi, pertanyaan bisnis yang benar-benar diperlukan, dan rencana sprint. Jangan langsung mengimplementasikan fitur utama sebelum saya menyetujui hasil perencanaan tersebut.**