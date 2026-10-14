# Casa Moral 3D Printing Business Management System — Security & Configuration Audit

Dokumen ini memuat hasil audit keamanan teknis, proteksi variabel lingkungan, arsitektur Row Level Security (RLS) Supabase, serta validasi integritas data pada rilis final sistem manajemen usaha Casa Moral.

---

## 1. Ringkasan Eksekutif Audit Keamanan

| Parameter Audit | Status | Keterangan Evaluasi |
|---|---|---|
| **Ekspos Secret Key di Client** | **AMAN (PASSED)** | Tidak ada service role key atau database secret yang terekspos ke bundle browser client. |
| **Row Level Security (RLS)** | **AKTIF (PASSED)** | Seluruh 13 tabel database PostgreSQL diproteksi dengan RLS aktif. |
| **Git Exclusion (.env files)** | **AMAN (PASSED)** | Pola `.env*` terdaftar pada `.gitignore`, mencegah kebocoran kredensial ke repository. |
| **Pemisahan Kredensial Client/Server**| **TERISOLASI** | Client browser hanya memiliki akses `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| **Input Sanitization & Decimal Safety**| **TERVERIFIKASI** | Operasi moneter menggunakan `Decimal.js` dan validasi Zod/Server Action. |
| **CSRF & Injection Protection** | **TERLINDUNGI** | Next.js Server Actions otomatis memproteksi origin dan token CSRF. |

---

## 2. Audit Proteksi Environment Variables

### A. Evaluasi `.env.example` vs `.env.local`
- File `.env.example` hanya berisi placeholder publik (`your-project.supabase.co`, `your-anon-key-here`) dan instruksi konfigurasi tanpa ada kredensial nyata yang tercatat.
- File `.env.local` diabaikan oleh Git melalui aturan `.gitignore` (baris 34: `.env*`).
- File `src/lib/env.ts` menyediakan helper `getEnvStatus()` yang memvalidasi ketersediaan variabel lingkungan tanpa pernah mencetak atau membocorkan string token ke antarmuka pengguna atau log sistem.

### B. Isolasi Akses Supabase
1. **Client Browser (`src/lib/supabase/client.ts`)**:
   - Menggunakan `createBrowserClient` dari `@supabase/ssr`.
   - Hanya menggunakan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Tidak memiliki izin bypass RLS.
2. **Server Async Cookies (`src/lib/supabase/server.ts`)**:
   - Menggunakan `createServerClient` dengan pengelolaan sesi cookie aman (*HttpOnly, SameSite, Secure*).
   - Menghormati kebijakan RLS Supabase sesuai identitas pengguna yang terautentikasi.
3. **Server Admin Seeder (`src/lib/supabase/admin.ts`)**:
   - Menggunakan `SUPABASE_SERVICE_ROLE_KEY`.
   - Hanya dieksekusi pada script CLI lokal (`scripts/import-excel-data.ts`) dan server-side tasks.

---

## 3. Matriks Kebijakan Row Level Security (RLS) Database

Seluruh 13 tabel pada schema Supabase (`public`) memiliki RLS aktif dengan kebijakan akses:

```sql
-- Status RLS pada Skema Database:
public.profiles               -> RLS ENABLED (Auth Users Only)
public.customers              -> RLS ENABLED (Auth Users Only)
public.materials              -> RLS ENABLED (Auth Users Only)
public.stock_movements        -> RLS ENABLED (Auth Users Only)
public.assets                 -> RLS ENABLED (Auth Users Only)
public.product_categories     -> RLS ENABLED (Auth Users Only)
public.products               -> RLS ENABLED (Auth Users Only)
public.product_components     -> RLS ENABLED (Auth Users Only)
public.orders                 -> RLS ENABLED (Auth Users Only)
public.order_items            -> RLS ENABLED (Auth Users Only)
public.payments               -> RLS ENABLED (Auth Users Only)
public.expense_categories     -> RLS ENABLED (Auth Users Only)
public.expenses               -> RLS ENABLED (Auth Users Only)
```

**Hasil Audit Kebijakan**:
- Anonim (pengunjung tanpa sesi otentikasi) tidak dapat membaca atau memodifikasi tabel transaksi pesanan, pembayaran, piutang, persediaan bahan baku, maupun beban operasional studio.
- Setiap operasi mutasi database terikat dengan check constraint (contoh: `amount > 0`, `quantity > 0`, `status IN (...)`).

---

## 4. Audit Validasi Data & Integritas Finansial

1. **Akurasi Moneter**:
   - Menghindari tipe floating-point bawaan JavaScript dengan pustaka `Decimal.js`.
   - Database PostgreSQL menggunakan tipe `NUMERIC(15, 2)` yang menjamin pembulatan presisi hingga 2 angka desimal.
2. **Snapshot HPP Permanen**:
   - Kolom `unit_hpp` pada tabel `order_items` dikunci saat pesanan dibuat. Perubahan harga filamen atau biaya listrik di masa mendatang tidak akan mengubah laporan laba historis.
3. **Idempotensi Pemotongan Stok**:
   - Transisi status pesanan ke `IN_PRODUCTION` memiliki guard pencegah mutasi ganda (*duplicate deduction guard*).

---

## 5. Rekomendasi Pemeliharaan Produksi

1. **Rotasi Kredensial Berkala**:
   - Lakukan rotasi `SUPABASE_SERVICE_ROLE_KEY` setiap 6 bulan melalui Supabase Dashboard (*Project Settings -> API*).
2. **Pengaktifan Email Confirmation / MFA**:
   - Aktifkan fitur Two-Factor Authentication (2FA / MFA) pada akun dashboard Supabase dan Vercel pemilik usaha.
3. **Backup Database Harian**:
   - Supabase menyediakan automated daily backup untuk Point-in-Time Recovery (PITR).
