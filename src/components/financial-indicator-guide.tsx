"use client";

import React, { useState } from "react";
import { HelpCircle, X, BookOpen, Search } from "lucide-react";

export interface IndicatorData {
  id: string;
  name: string;
  category: "Pendapatan & Profit" | "Biaya & HPP" | "Arus Kas & Modal" | "Kapasitas & Produksi";
  definition: string;
  formula: string;
  example: string;
  excludes: string;
  source: string;
}

export const FINANCIAL_INDICATORS: Record<string, IndicatorData> = {
  pendapatan_kotor: {
    id: "pendapatan_kotor",
    name: "Pendapatan Kotor (Gross Revenue)",
    category: "Pendapatan & Profit",
    definition: "Total nilai rupiah kotor dari seluruh penjualan barang sebelum dikurangi potongan harga, diskon promo, atau retur.",
    formula: "Jumlah Unit Terjual × Harga Jual Dasar",
    example: "9 lampu ambient terjual dengan nilai bruto Rp 945.000.",
    excludes: "Belum dikurangi diskon voucher, fee marketplace, HPP bahan, dan biaya operasional.",
    source: "Tabel pesanan (orders) yang terkonfirmasi atau selesai pada periode berjalan.",
  },
  diskon_promo: {
    id: "diskon_promo",
    name: "Diskon Promo & Voucher",
    category: "Pendapatan & Profit",
    definition: "Potongan harga yang diberikan kepada pembeli, baik berupa diskon langsung maupun voucher kampanye penjualan.",
    formula: "Total Nilai Kupon / Diskon yang Ditanggung Penjual",
    example: "Voucher diskon peluncuran toko Rp 15.000 untuk pelanggan Shopee.",
    excludes: "Diskon atau gratis ongkir yang disubsidi penuh oleh pihak marketplace (bukan beban Casa Moral).",
    source: "Kolom discount_amount pada rincian pesanan.",
  },
  pendapatan_bersih: {
    id: "pendapatan_bersih",
    name: "Pendapatan Bersih (Net Revenue)",
    category: "Pendapatan & Profit",
    definition: "Nilai omzet riil hak Casa Moral setelah pendapatan kotor dikurangi seluruh diskon dan potongan harga.",
    formula: "Pendapatan Kotor - Diskon Promo",
    example: "Rp 945.000 kotor - Rp 0 diskon = Rp 945.000 bersih.",
    excludes: "Belum dikurangi HPP (biaya modal pembuatan produk) dan beban operasional bulanan.",
    source: "Laporan laba rugi berbasis pengakuan transaksi pesanan.",
  },
  hpp: {
    id: "hpp",
    name: "HPP (Harga Pokok Penjualan / COGS)",
    category: "Biaya & HPP",
    definition: "Total seluruh biaya langsung yang dikeluarkan untuk memproduksi atau menyiapkan barang yang laku terjual.",
    formula: "Bahan Baku (Filamen + Komponen Listrik + Kemasan) + Biaya Listrik + Depresiasi + Tenaga Kerja",
    example: "HPP model Lumi Standard Rp 60.155 per unit (BOM Rp 50.129 + multiplier 1,20x).",
    excludes: "Beban pemasaran, sewa studio, internet, dan aset tetap yang belum disusutkan.",
    source: "Snapshot HPP per unit saat pesanan dibuat dikalikan volume terjual.",
  },
  laba_kotor: {
    id: "laba_kotor",
    name: "Laba Kotor (Gross Profit)",
    category: "Pendapatan & Profit",
    definition: "Sisa pendapatan penjualan setelah menutup biaya langsung pembuatan produk (HPP).",
    formula: "Pendapatan Bersih - Total HPP Barang Terjual",
    example: "Omzet Rp 945.000 - Total HPP Rp 541.395 = Laba Kotor Rp 403.605.",
    excludes: "Belum memperhitungkan beban operasional rutin studio seperti listrik umum, wifi, transport, dan cicilan aset.",
    source: "Laporan Laba Rugi periode berjalan.",
  },
  gross_margin: {
    id: "gross_margin",
    name: "Gross Margin (%)",
    category: "Pendapatan & Profit",
    definition: "Persentase keuntungan kotor yang diperoleh dari setiap rupiah pendapatan bersih yang masuk.",
    formula: "(Laba Kotor ÷ Pendapatan Bersih) × 100%",
    example: "(Rp 403.605 ÷ Rp 945.000) × 100% = 42,7% margin kotor.",
    excludes: "Ini bukan markup terhadap HPP, melainkan proporsi margin terhadap harga jual.",
    source: "Dihitung otomatis dari perbandingan Laba Kotor terhadap Pendapatan Bersih.",
  },
  laba_operasional: {
    id: "laba_operasional",
    name: "Laba Operasional (Operating Profit)",
    category: "Pendapatan & Profit",
    definition: "Keuntungan riil kegiatan operasional usaha setelah laba kotor dikurangi seluruh beban operasional studio.",
    formula: "Laba Kotor - Total Beban Operasional (Listrik, Wifi, Konsumsi, Transport)",
    example: "Laba kotor Rp 403.605 - Biaya operasional Rp 120.000 = Laba operasional Rp 283.605.",
    excludes: "Pajak penghasilan badan, bunga pinjaman, dan transaksi pendanaan modal.",
    source: "Laporan Laba Rugi setelah konsolidasi tabel pengeluaran operasional.",
  },
  arus_kas_masuk: {
    id: "arus_kas_masuk",
    name: "Arus Kas Masuk (Cash Inflow)",
    category: "Arus Kas & Modal",
    definition: "Uang tunai atau transfer yang benar-benar telah diterima di rekening atau kas Casa Moral pada periode berjalan.",
    formula: "Total Penerimaan Pembayaran Tunai + Transfer Masuk + Pelunasan Piutang",
    example: "Realisasi pembayaran dari 2 pesanan lunas sebesar Rp 290.000.",
    excludes: "Pesanan yang belum dibayar atau piutang yang masih menggantung.",
    source: "Tabel transaksi pembayaran (payments) yang diverifikasi.",
  },
  arus_kas_keluar: {
    id: "arus_kas_keluar",
    name: "Arus Kas Keluar (Cash Outflow)",
    category: "Arus Kas & Modal",
    definition: "Seluruh uang tunai atau saldo bank yang benar-benar telah dibelanjakan atau dibayarkan keluar studio.",
    formula: "Kas Keluar Operasional + Pembelian Bahan Baku + Pembayaran Cicilan Utang",
    example: "Total kas keluar Rp 450.000 untuk belanja filamen tambahan dan listrik.",
    excludes: "Tagihan supplier atau cicilan jatuh tempo yang belum ditransfer.",
    source: "Buku catatan pengeluaran kas dan log pembayaran cicilan utang.",
  },
  piutang_usaha: {
    id: "piutang_usaha",
    name: "Piutang Usaha (Accounts Receivable)",
    category: "Arus Kas & Modal",
    definition: "Hak tagih atau uang penjualan barang yang masih harus dibayarkan pelanggan atau mitra konsinyasi ke Casa Moral.",
    formula: "Total Nilai Pesanan Terkirim - Total Pembayaran yang Sudah Diterima",
    example: "7 pesanan teman/konsinyasi dengan sisa tagihan berjalan Rp 655.000.",
    excludes: "Pesanan berstatus Dibatalkan (Cancelled) atau retur barang.",
    source: "Halaman Piutang Berjalan (/orders/receivables).",
  },
  utang_usaha: {
    id: "utang_usaha",
    name: "Utang Usaha & Kewajiban (Accounts Payable)",
    category: "Arus Kas & Modal",
    definition: "Kewajiban finansial Casa Moral kepada pihak luar yang harus dilunasi sesuai jadwal jatuh tempo.",
    formula: "Total Pokok Kewajiban - Pembayaran Angsuran yang Telah Dicatat",
    example: "Cicilan mesin Anycubic Kobra X Shopee PayLater Rp 1.957.600/bulan (Total Rp 5.872.800).",
    excludes: "Beban gaji internal pemilik yang belum dialokasikan sebagai utang resmi.",
    source: "Modul Utang & Jadwal Angsuran (/payables).",
  },
  nilai_aset_tetap: {
    id: "nilai_aset_tetap",
    name: "Nilai Aset Tetap (Fixed Assets)",
    category: "Arus Kas & Modal",
    definition: "Total nilai perolehan mesin dan peralatan kerja studio yang memiliki masa manfaat lebih dari satu tahun.",
    formula: "Total Harga Beli Mesin Cetak (Bambu Lab + Anycubic) + Peralatan Kerja",
    example: "Nilai perolehan printer Bambu Lab A1 Mini (Rp 3.589.221) + Anycubic Kobra X (Rp 5.872.800) = Rp 9.462.021.",
    excludes: "Bahan habis pakai seperti filamen, fitting lampu, dan kardus kemasan.",
    source: "Daftar aset mesin studio pada halaman Modal & Aset (/capital).",
  },
  modal_usaha: {
    id: "modal_usaha",
    name: "Modal Usaha (Total Capital Invested)",
    category: "Arus Kas & Modal",
    definition: "Total modal awal yang ditanamkan pemilik untuk mengadakan mesin, stok bahan awal, kelistrikan, kemasan, dan alat studio.",
    formula: "Akumulasi Belanja Modal Awal (23 Transaksi Riil Excel)",
    example: "Total belanja modal awal terverifikasi Rp 11.440.748.",
    excludes: "Laba bersih operasional yang belum disetorkan kembali sebagai modal resmi.",
    source: "Buku catatan belanja modal awal (/capital).",
  },
  bep: {
    id: "bep",
    name: "BEP (Break-Even Point / Titik Impas)",
    category: "Kapasitas & Produksi",
    definition: "Titik volume penjualan saat total penerimaan impas menutup seluruh biaya tetap studio, sehingga laba operasional sama dengan nol.",
    formula: "Total Biaya Tetap Bulanan ÷ Margin Kontribusi per Unit",
    example: "Jika biaya tetap Rp 300.000/bln dan margin kontribusi Rp 44.845/unit, BEP = 6,7 (7 unit lampu/bulan).",
    excludes: "Biaya variabel bahan baku (karena sudah diperhitungkan dalam margin kontribusi).",
    source: "Kalkulator Keuangan Studio (/calculator) tab BEP.",
  },
  payback_period: {
    id: "payback_period",
    name: "Payback Period (Masa Pengembalian Modal)",
    category: "Kapasitas & Produksi",
    definition: "Estimasi lama waktu (bulan) yang dibutuhkan agar keuntungan bersih usaha dapat menutup seluruh modal investasi awal.",
    formula: "Total Modal Investasi Awal ÷ Estimasi Laba Bersih Kas per Bulan",
    example: "Modal Rp 11.440.748 ÷ Rp 1.500.000/bulan = 7,6 bulan masa balik modal.",
    excludes: "Perubahan nilai waktu uang (discount rate) dalam metode payback period sederhana.",
    source: "Kalkulator Keuangan Studio (/calculator) tab Payback Period.",
  },
  margin_kontribusi: {
    id: "margin_kontribusi",
    name: "Margin Kontribusi per Unit",
    category: "Kapasitas & Produksi",
    definition: "Jumlah rupiah yang dihasilkan dari setiap unit terjual untuk menutup biaya tetap bulanan dan menghasilkan laba.",
    formula: "Harga Jual per Unit - Biaya Variabel per Unit (HPP Bahan)",
    example: "Harga jual Rp 105.000 - HPP bahan Rp 60.155 = Margin kontribusi Rp 44.845 per unit.",
    excludes: "Biaya tetap studio (sewa, wifi, depresiasi).",
    source: "Rincian kalkulasi harga jual per model di katalog produk.",
  },
  reject_rate: {
    id: "reject_rate",
    name: "Reject Rate (Tingkat Kegagalan Cetak)",
    category: "Kapasitas & Produksi",
    definition: "Persentase estimasi hasil cetak 3D yang gagal, cacat layer, atau warping sehingga filamen terbuang.",
    formula: "(Berat Filamen Gagal ÷ Total Filamen Tercetak) × 100%",
    example: "Asumsi reject rate 5% menambahkan cadangan biaya filamen dan waktu cetak dalam HPP Advanced.",
    excludes: "Kerusakan produk setelah pengiriman akibat kelalaian kurir ekspedisi.",
    source: "Konfigurasi asumsi produksi di Pengaturan Bisnis (/settings).",
  },
  depresiasi: {
    id: "depresiasi",
    name: "Depresiasi Mesin (Penyusutan)",
    category: "Biaya & HPP",
    definition: "Alokasi keausan nilai mesin printer 3D per jam kerja selama masa manfaat ekonomisnya.",
    formula: "(Harga Perolehan - Nilai Residu) ÷ (Masa Manfaat Bulan × Jam Operasi per Bulan)",
    example: "Bambu Lab A1 Mini: (Rp 3.589.221 - Rp 500.000) ÷ (24 bulan × 150 jam) ≈ Rp 858 per jam cetak.",
    excludes: "Biaya perbaikan kerusakan mendadak atau penggantian sparepart insidentil.",
    source: "Data mesin aset dan kalkulator HPP Advanced.",
  },
  markup: {
    id: "markup",
    name: "Markup (%)",
    category: "Biaya & HPP",
    definition: "Persentase penambahan harga di atas HPP untuk menentukan harga jual produk.",
    formula: "((Harga Jual - HPP) ÷ HPP) × 100%",
    example: "HPP Rp 60.155 dengan markup 74,5% menghasilkan harga jual Rp 105.000.",
    excludes: "Jangan disamakan dengan margin kotor yang membagi keuntungan terhadap harga jual.",
    source: "Pengaturan Harga Global dan Individual (/settings).",
  },
  margin: {
    id: "margin",
    name: "Margin Penjualan (%)",
    category: "Biaya & HPP",
    definition: "Persentase selisih keuntungan antara harga jual dan HPP dihitung dari harga jual barang.",
    formula: "((Harga Jual - HPP) ÷ Harga Jual) × 100%",
    example: "Harga jual Rp 105.000 dengan HPP Rp 60.155 menghasilkan margin 42,7%.",
    excludes: "Bukan perbandingan terhadap modal, melainkan porsi keuntungan dalam harga ritel pembeli.",
    source: "Katalog produk dan halaman penetapan harga.",
  },
};

interface IndicatorTooltipProps {
  indicatorKey: keyof typeof FINANCIAL_INDICATORS | string;
  className?: string;
}

export function FinancialIndicatorInfo({ indicatorKey, className = "" }: IndicatorTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const data = FINANCIAL_INDICATORS[indicatorKey];

  if (!data) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center text-zinc-400 hover:text-amber-500 transition-colors p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 ${className}`}
        title={`Pelajari indikator: ${data.name}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-md shadow-2xl p-5 space-y-4 text-left overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-600 dark:text-amber-400 block">
                  {data.category}
                </span>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 mt-0.5">
                  {data.name}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">
                  1. Definisi Sederhana:
                </span>
                <p className="text-zinc-600 dark:text-zinc-400">{data.definition}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 font-mono">
                <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-zinc-400 block mb-1">
                  2. Rumus Perhitungan:
                </span>
                <p className="text-amber-600 dark:text-amber-400 font-semibold">{data.formula}</p>
              </div>

              <div>
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">
                  3. Contoh Kasus Riil:
                </span>
                <p className="text-zinc-600 dark:text-zinc-400 italic bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-200/40 dark:border-amber-800/30">
                  {data.example}
                </p>
              </div>

              <div>
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block mb-0.5">
                  4. Tidak Termasuk Dalam Angka Ini:
                </span>
                <p className="text-zinc-500 dark:text-zinc-400">{data.excludes}</p>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Sumber Data:</span>
                <span className="font-medium text-zinc-600 dark:text-zinc-300 text-right">{data.source}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Full Financial Dictionary Modal Trigger Button
 */
export function FinancialGlossaryModalButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const list = Object.values(FINANCIAL_INDICATORS);

  const filtered = list.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.formula.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-amber-500/60 hover:text-amber-600 transition-colors shadow-2xs"
      >
        <BookOpen className="w-3.5 h-3.5 text-amber-500" />
        <span>Kamus Indikator Keuangan</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
                    Panduan & Kamus Indikator Keuangan Casa Moral
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Penjelasan 20 metrik akuntansi, HPP, arus kas, dan kapasitas studio tanpa istilah rumit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari nama indikator atau istilah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {["ALL", "Pendapatan & Profit", "Biaya & HPP", "Arus Kas & Modal", "Kapasitas & Produksi"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-amber-500 text-white"
                        : "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {cat === "ALL" ? "Semua" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 space-y-2 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {item.definition}
                  </p>

                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/60 font-mono text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Rumus: {item.formula}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 text-zinc-500 dark:text-zinc-400">
                    <div>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">Contoh Riil:</span>
                      <span>{item.example}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">Tidak Termasuk:</span>
                      <span>{item.excludes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-between items-center text-xs text-zinc-500">
              <span>Menampilkan {filtered.length} dari {list.length} indikator</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
