# Panduan Deployment Produksi — Casa Moral 3D Printing Business Management System

Dokumen ini memandu proses deployment sistem manajemen usaha Casa Moral ke lingkungan cloud production menggunakan **Vercel** (untuk frontend Next.js) dan **Supabase** (untuk database PostgreSQL, otentikasi, dan storage).

---

## 1. Arsitektur Lingkungan Produksi

```
[ Pengguna Browser / Smartphone ]
               │
               ▼
   [ Vercel Edge Network ]
   Next.js 16 App Router (Turbopack)
   - React 19 Server Components
   - Server Actions (Input Sanitization & CSRF Protection)
               │
               ▼ (SSL/TLS HTTPS)
     [ Supabase Cloud ]
   Managed PostgreSQL 15+
   - Row Level Security (RLS) Active
   - Tables, Indexes, & Check Constraints
   - Realtime / Automated Daily Backups (PITR)
```

---

## 2. Checklist Variabel Lingkungan (Environment Variables)

Siapkan variabel berikut di dashboard penyedia hosting (Vercel Project Settings $\rightarrow$ Environment Variables):

| Nama Variabel | Kebutuhan Lingkungan | Deskripsi & Contoh Nilai |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | URL endpoint API Supabase: `https://[project-ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production & Preview | Kunci anonim publik Supabase (Aman digunakan di browser client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Only (Secret) | Kunci admin rahasia Supabase untuk seeding dan migrasi. **JANGAN centang expose to client!** |
| `NEXT_PUBLIC_APP_URL` | Production & Preview | Domain publik aplikasi (contoh: `https://casamoral.vercel.app` atau domain custom) |

---

## 3. Langkah Penyediaan Database Supabase

### Langkah 3.1: Membuat Proyek Supabase
1. Masuk ke [Supabase Dashboard](https://supabase.com).
2. Klik **"New Project"**, beri nama proyek (misal: `casamoral-production`).
3. Pilih region terdekat (misal: **Singapore / `ap-southeast-1`** untuk latensi optimal dari Indonesia).
4. Buat kata sandi database yang kuat dan simpan di password manager.

### Langkah 3.2: Eksekusi Migrasi Skema Database
1. Buka menu **SQL Editor** pada Supabase Dashboard.
2. Salin seluruh isi file migrasi lokal:
   [`supabase/migrations/20261015000001_initial_schema.sql`](file:///D:/Nurdin/00_PROJECT/casamoral-inv/supabase/migrations/20261015000001_initial_schema.sql).
3. Jalankan query (*Run*). Query ini akan secara otomatis:
   - Membuat 13 tabel database relasional.
   - Mengaktifkan Row Level Security (RLS) pada seluruh tabel.
   - Membuat indeks performa query (`orders`, `stock_movements`, `materials`, `expenses`).
   - Mendaftarkan check constraint integritas harga dan kuantitas.

### Langkah 3.3: Inisialisasi Data Master & Historis (Seeding)
1. Buka kembali SQL Editor pada Supabase.
2. Salin dan jalankan isi file seed lokal:
   [`supabase/seed.sql`](file:///D:/Nurdin/00_PROJECT/casamoral-inv/supabase/seed.sql).
3. Data 4 model lampu ambient, 8 bahan baku, 4 aset printer, 9 pesanan historis, pembayaran, dan beban operasional baseline akan langsung terisi.

---

## 4. Langkah Deployment ke Vercel

### Langkah 4.1: Import Git Repository
1. Masuk ke [Vercel Dashboard](https://vercel.com).
2. Klik **"Add New..."** $\rightarrow$ **"Project"**.
3. Hubungkan akun GitHub/GitLab Anda dan pilih repositori `casamoral-inv`.

### Langkah 4.2: Konfigurasi Proyek di Vercel
1. **Framework Preset**: Terdeteksi otomatis sebagai **Next.js**.
2. **Root Directory**: `./` (default).
3. **Build Command**: `next build` (atau `npm run build`).
4. **Output Directory**: `.next` (default).

### Langkah 4.3: Masukkan Environment Variables
Pada accordion **Environment Variables**, tambahkan:
- `NEXT_PUBLIC_SUPABASE_URL` = (URL dari Supabase Project Settings -> API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Anon key dari Supabase Project Settings -> API)
- `SUPABASE_SERVICE_ROLE_KEY` = (Service role key dari Supabase)
- `NEXT_PUBLIC_APP_URL` = `https://casamoral.vercel.app` (atau domain Anda)

### Langkah 4.4: Klik Deploy!
1. Klik tombol **"Deploy"**.
2. Vercel akan menjalankan build Turbopack, typecheck TypeScript, dan static page generation untuk seluruh 16 route aplikasi.
3. Setelah proses build selesai (~1 menit), aplikasi aktif dengan status **Ready**.

---

## 5. Deployment Alternatif Menggunakan Docker / Node.js Server

Jika studio ingin melakukan self-hosting pada VPS (Ubuntu/Debian):

```bash
# 1. Clone repository
git clone <repo-url> casamoral-inv
cd casamoral-inv

# 2. Pasang dependencies
npm install

# 3. Siapkan environment file
cp .env.example .env.local
nano .env.local # Masukkan kredensial Supabase

# 4. Build aplikasi produksi
npm run build

# 5. Jalankan aplikasi menggunakan PM2 (Process Manager)
npm install -g pm2
pm2 start npm --name "casamoral-app" -- start -- -p 3000
pm2 save
pm2 startup
```

---

## 6. Prosedur Pemeliharaan & Backup Berkala

1. **Automated Database Backup**:
   - Supabase menyediakan automated daily backup. Anda dapat mengunduh snapshot database secara berkala melalui menu *Database $\rightarrow$ Backups*.
2. **Pencatatan Audit Trail**:
   - Seluruh mutasi stok dan pembayaran kas tersimpan dengan timestamp presisi pada tabel `stock_movements` dan `payments`.
3. **Ekspor Manual Spreadsheet**:
   - Pemilik usaha disarankan mengunduh rekap spreadsheet bulanan melalui menu **Pusat Laporan** (`/reports`) sebagai arsip offline studio.
