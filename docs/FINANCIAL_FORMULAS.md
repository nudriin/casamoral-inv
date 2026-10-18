# Casa Moral 3D Printing Business Management System — Financial Formulas

Dokumen ini adalah spesifikasi matematis formal untuk seluruh perhitungan finansial pada aplikasi Casa Moral.

---

## 1. Definisi Metrik Finansial

| Nama Metrik | Simbol / Kode | Definisi Bisnis | Satuan |
|---|---|---|---|
| **Biaya Bahan Baku** | `C_material` | Total biaya filamen terpakai (termasuk purge/waste) | IDR (Rp) |
| **Biaya Komponen Kelistrikan** | `C_electrical` | Total fitting, lampu LED, kabel sakelar, dan protektor | IDR (Rp) |
| **Biaya Kemasan & Finishing** | `C_packaging` | Total kardus box, bubble wrap, stiker, dan aksesoris | IDR (Rp) |
| **Biaya Energi Listrik** | `C_electricity` | Biaya daya listrik selama jam cetak mesin | IDR (Rp) |
| **Depresiasi Mesin per Unit** | `C_depreciation` | Alokasi keausan aset mesin berdasarkan jam cetak | IDR (Rp) |
| **Biaya Risiko Kegagalan** | `C_failure` | Biaya kompensasi cetak gagal / reject rate | IDR (Rp) |
| **Harga Pokok Produksi (HPP)** | `HPP` | Total modal produksi langsung untuk menghasilkan 1 unit produk | IDR (Rp) |
| **Harga Jual** | `P_sell` | Harga transaksi yang ditagihkan kepada konsumen | IDR (Rp) |
| **Markup** | `Markup_pct` | Persentase laba kotor di atas nilai HPP | Persen (%) |
| **Margin Laba Kotor** | `Margin_pct` | Rasio laba kotor terhadap harga jual | Persen (%) |
| **Fee Platform Marketplace** | `Fee_platform` | Potongan admin Shopee + Gratis Ongkir Xtra | IDR (Rp) |
| **Laba Kotor per Unit** | `Profit_gross` | Keuntungan per unit setelah HPP dan potongan marketplace | IDR (Rp) |
| **Biaya Tetap / Overhead Bulanan**| `FC` | Biaya operasional rutin di luar HPP per unit (iklan, internet, sewa, gaji desainer) | IDR (Rp) / bln |
| **Break-Even Point (Unit)** | `BEP_unit` | Jumlah unit produk yang harus terjual per bulan agar laba = 0 | Unit / bln |
| **Break-Even Point (Omzet)** | `BEP_revenue` | Nilai omzet penjualan bulanan minimal untuk menutup seluruh biaya | IDR (Rp) / bln |
| **Estimasi Waktu Balik Modal** | `Payback_period` | Estimasi durasi (bulan) hingga akumulasi laba bersih menutup total modal awal | Bulan |

---

## 2. Formula Sumber & Perbandingan

### 2.1 Formula HPP: Casa Moral Aktual vs Template ELS Studio

#### A. Formula Casa Moral Aktual (`HPP CASA MORAL V2.xlsx`)
$$\text{Subtotal Material} = \text{Biaya Filamen} + \text{LED} + \text{Fitting} + \text{Kabel Sakelar} + \text{Kabel Pelindung} + \text{Kardus} + \text{Bubble Wrap}$$
$$\text{Biaya Filamen} = \frac{\text{Total Gram Filamen}}{1000} \times \text{Harga Filamen per Kg}$$
$$\text{TOTAL HPP} = \text{Subtotal Material} \times 1.20$$

*Catatan*: Multiplier `1.20` merupakan penambahan `20%` untuk mengompensasi konsumsi listrik dan penyusutan mesin.

#### B. Formula Template ELS Studio (`Template ELS STUDIO.xlsx`)
$$\text{Biaya Filamen} = \left(\frac{\text{Berat Filamen (gram)}}{1000}\right) \times \text{Harga Filamen/kg} \times (1 + \text{Faktor Purge})$$
$$\text{Biaya Listrik} = \left(\frac{\text{Waktu Print (menit)}}{60}\right) \times \left(\frac{\text{Daya Watt Mesin}}{1000}\right) \times \text{Tarif PLN per kWh}$$
$$\text{Depresiasi per Jam} = \frac{\frac{\text{Harga Beli Mesin} - \text{Nilai Residu}}{\text{Umur Ekonomis (bulan)}}}{\text{Estimasi Jam Pakai per Bulan}}$$
$$\text{Biaya Depresiasi Mesin} = \left(\frac{\text{Waktu Print (menit)}}{60}\right) \times \text{Depresiasi per Jam}$$
$$\text{Biaya Kegagalan} = (\text{Biaya Filamen} + \text{Biaya Listrik} + \text{Biaya Depresiasi}) \times \left(\frac{\text{Reject Rate}}{1 - \text{Reject Rate}}\right)$$
$$\text{Alokasi Staff Packing} = \frac{\text{Gaji Staff Packing Bulanan}}{\text{Target Unit Terjual Bulanan}}$$
$$\text{TOTAL HPP} = \text{Biaya Filamen} + \text{Biaya Listrik} + \text{Biaya Depresiasi} + \text{Biaya Kegagalan} + \text{Aksesoris} + \text{Kemasan} + \text{Alokasi Staff}$$

---

### 2.2 Formula Penetapan Harga Jual, Markup, dan Margin

#### Hubungan Matematis Antara Markup dan Margin:
$$\text{Markup} = \frac{\text{Harga Jual} - \text{HPP}}{\text{HPP}}$$
$$\text{Harga Jual (berdasarkan Markup)} = \text{HPP} \times (1 + \text{Markup})$$

$$\text{Margin} = \frac{\text{Harga Jual} - \text{HPP}}{\text{Harga Jual}}$$
$$\text{Harga Jual (berdasarkan Margin)} = \frac{\text{HPP}}{1 - \text{Margin}}$$

#### Hubungan Konversi:
$$\text{Margin} = \frac{\text{Markup}}{1 + \text{Markup}} \quad \Longleftrightarrow \quad \text{Markup} = \frac{\text{Margin}}{1 - \text{Margin}}$$

*Contoh Perbandingan Kritis*:
- Pada `HPP CASA MORAL V2.xlsx`, tertulis "Margin Keuntungan Target 50%", namun rumusnya adalah `B29 * 50% + B29`. Ini adalah **Markup 50%**.
- HPP Ollie = Rp89.705,28.
- Harga dengan Markup 50% = Rp89.705,28 * 1.50 = **Rp134.557,92**.
- Margin sejati dari harga ini adalah: `(134.557,92 - 89.705,28) / 134.557,92 = 33.33%`.
- Jika menginginkan **Margin 50% murni**, harga jual seharusnya: `89.705,28 / (1 - 0.50) = Rp179.410,56`.

---

### 2.3 Formula Potongan Platform Marketplace (Shopee) & Omzet Riil Diterima Kas

#### A. Struktur Biaya Marketplace Presisi Toko Casa Moral:
1. **Biaya Administrasi Shopee**: $9.5\%$ dari harga jual produk
2. **Biaya Proses Pesanan**: $\text{Rp } 1.250$ (flat per order)
3. **Pajak Penghasilan (PPh 22 Marketplace)**: $0.5\%$ dari harga jual produk

$$\text{Potongan Platform Shopee} = (\text{Harga Jual} \times 9.5\%) + 1.250 + (\text{Harga Jual} \times 0.5\%)$$

#### B. Perlakuan Akuntansi Omzet (Cash Inflow vs Gross Invoice):
Karena potongan Shopee langsung dipotong di awal sebelum dana masuk ke Saldo Penjual/rekening kas pemilik toko, maka aplikasi mencatat:
$$\text{Omzet Riil Diterima Kas} = \text{Harga Jual Tagihan} - \text{Potongan Platform Shopee} - \text{Diskon}$$
$$\text{Laba Bersih Riil} = \text{Omzet Riil Diterima Kas} - \text{Total HPP (Bahan + Kemasan)}$$

*Contoh Kasus Model Ollie (Rp 130.000 via Shopee)*:
- Harga Jual Tagihan: $\text{Rp } 130.000$
- Biaya Admin ($9.5\%$): $\text{Rp } 12.350$
- Biaya Proses: $\text{Rp } 1.250$
- PPh 22 ($0.5\%$): $\text{Rp } 650$
- **Total Potongan Platform**: $\text{Rp } 14.250$
- **Omzet Riil Diterima Kas**: $130.000 - 14.250 = \mathbf{\text{Rp } 115.750}$
- Total Modal HPP: $\text{Rp } 89.705$
- **Laba Bersih Riil**: $115.750 - 89.705 = \mathbf{\text{Rp } 26.045}$ (Margin: $22.5\%$)

---

### 2.4 Formula Break-Even Point (BEP) dan Payback Period

#### A. BEP Unit per Bulan:
$$\text{BEP}_{\text{unit}} = \left\lceil \frac{\text{Total Biaya Overhead Bulanan}}{\text{Rata-rata Margin Kontribusi per Unit}} \right\rceil$$
Di mana:
$$\text{Margin Kontribusi per Unit} = \text{Harga Jual per Unit} - \text{Biaya Variabel per Unit (HPP)}$$

#### B. BEP Omzet per Bulan:
$$\text{BEP}_{\text{omzet}} = \text{BEP}_{\text{unit}} \times \text{Rata-rata Harga Jual per Unit}$$

#### C. Estimasi Balik Modal (Payback Period):
$$\text{Estimasi Laba Bersih Bulanan} = (\text{Estimasi Unit Terjual/Bulan} \times \text{Margin Kontribusi}) - \text{Total Overhead Bulanan}$$
$$\text{Payback Period (Bulan)} = \begin{cases} 
\frac{\text{Total Modal Awal}}{\text{Estimasi Laba Bersih Bulanan}}, & \text{jika Laba Bersih} > 0 \\ 
\infty, & \text{jika Laba Bersih} \le 0 
\end{cases}$$

---

## 3. Contoh Perhitungan Tervalidasi (Test Reference Cases)

### Test Case 1: Model Lampu Ollie (Standard Mode - Casa Moral)
- **Input**:
  - Shade: 66.66 g
  - Base: 119.26 g
  - Cap: 17.16 g
  - Harga Filamen: Rp180.000 / kg
  - LED 3W: Rp15.000
  - Fitting E27: Rp6.000
  - Kabel Sakelar: Rp10.000
  - Pelindung Kabel: Rp700
  - Kardus: Rp4.500
  - Bubble Wrap: Rp2.000
  - Overheads Multiplier: 1.20x
  - Markup Target: 50%
- **Hasil Perhitungan**:
  - Total Filamen = 203.08 gram
  - Biaya Filamen = 203.08 / 1000 * 180.000 = Rp36.554,40
  - Subtotal Material = 36.554,40 + 15.000 + 6.000 + 10.000 + 700 + 4.500 + 2.000 = Rp74.754,40
  - **TOTAL HPP** = 74.754,40 * 1.20 = **Rp89.705,28**
  - Nilai Keuntungan = 89.705,28 * 0.50 = Rp44.852,64
  - **Harga Rekomendasi** = 89.705,28 + 44.852,64 = **Rp134.557,92**
  - Pembulatan ke atas (ratusan terdekat) = Rp134.600 atau Rp135.000.

### Test Case 2: Model Lampu Lumi (Standard Mode - Casa Moral)
- **Input**:
  - Shade: 97.59 g, Base: 68.81 g, Cap: 0 g -> Total: 166.40 g
  - Biaya Filamen: 166.40 / 1000 * 180.000 = Rp29.952,00
  - Kardus: Rp4.000 (Lumi lebih kecil)
  - Subtotal Material: 29.952 + 15.000 + 6.000 + 10.000 + 700 + 4.000 + 2.000 = Rp67.652,00
  - **TOTAL HPP** = 67.652,00 * 1.20 = **Rp81.182,40**
  - **Harga Rekomendasi (Markup 50%)** = **Rp121.773,60**

---

## 4. Aturan Pembulatan & Penanganan Presisi

1. **Database & Tipe Data**:
   - Seluruh nominal uang disimpan dalam tipe `NUMERIC(15, 2)` di PostgreSQL.
   - Gramatur filamen disimpan dalam `NUMERIC(8, 2)`.
   - Durasi waktu cetak disimpan dalam `NUMERIC(8, 2)` menit.
2. **Kalkulasi Internal**:
   - Menggunakan library desimal (`Decimal.js`) tanpa pembulatan prematur di tengah formula berantai.
3. **Penyajian UI**:
   - Nominal Rupiah dibulatkan dan diformat standar Indonesia: `Rp 134.558` (atau desimal 2 angka jika diperlukan: `Rp 134.557,92`).
   - BEP Unit selalu dibulatkan ke atas (*ceiling* / pembulatan ke bilangan bulat terdekat) karena produk fisik tidak dapat diproduksi/dijual setengah unit.
