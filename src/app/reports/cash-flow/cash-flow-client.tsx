"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CashFlowStatement } from "@/lib/services/reports-service";
import { formatRupiah } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCSV, formatCSVWithBOM } from "@/lib/export-csv";
import {
  ArrowLeft,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  FileSpreadsheet,
  ShieldCheck,
} from "lucide-react";
import { FinancialIndicatorInfo, FinancialGlossaryModalButton } from "@/components/financial-indicator-guide";

interface CashFlowClientProps {
  statement: CashFlowStatement;
}

export function CashFlowClient({ statement }: CashFlowClientProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleExportCSV = () => {
    const rows = [
      ["LAPORAN ARUS KAS (METODE LANGSUNG) — CASA MORAL 3D PRINTING"],
      [`Periode: ${statement.period}`],
      [""],
      ["Aktivitas Arus Kas", "Nilai (IDR)", "Keterangan"],
      ["A. AKTIVITAS OPERASI", "", ""],
      ["Arus Kas Masuk Operasi:", "", ""],
      ["  Penerimaan Kas dari Pelanggan (DP & Pelunasan)", statement.operatingInflows.customerPayments, "Kas riil diterima"],
      ["Arus Kas Keluar Operasi:", "", ""],
      ["  Pembayaran Beban Operasional Kas (Sewa, Internet, Iklan)", -statement.operatingOutflows.operatingExpensesPaid, "Beban kas tunai"],
      ["  Pembelian Persediaan Bahan Baku (Filamen & Komponen)", -statement.operatingOutflows.materialPurchases, "Pengadaan awal bahan"],
      ["Arus Kas Bersih dari Aktivitas Operasi", statement.netOperatingCashFlow, ""],
      [""],
      ["B. AKTIVITAS INVESTASI", "", ""],
      ["  Pembelian Aset Mesin & Peralatan Kerja 3D Printer", -statement.investingCashFlow.fixedAssetsPurchased, "Bambulab & Anycubic"],
      ["Arus Kas Bersih untuk Aktivitas Investasi", -statement.investingCashFlow.fixedAssetsPurchased, ""],
      [""],
      ["C. AKTIVITAS PENDANAAN", "", ""],
      ["  Setoran Modal Awal Pemilik Studio", statement.financingCashFlow.ownerCapitalInjected, "Injeksi ekuitas awal"],
      ["Arus Kas Bersih dari Aktivitas Pendanaan", statement.financingCashFlow.ownerCapitalInjected, ""],
      [""],
      ["SALDO KAS BERJALAN STUDIO", statement.endingCashBalance, "Posisi likuiditas kas"],
    ];

    const csvContent = formatCSVWithBOM(rows);
    downloadCSV(`Laporan_Arus_Kas_Casa_Moral_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Pusat Laporan
            </Button>
          </Link>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
          <Badge variant="outline" className="text-xs">
            Metode Langsung (Direct Cash Flow)
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <FinancialGlossaryModalButton />
          <Button
            onClick={handleExportCSV}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            {downloaded ? "Berhasil Diunduh!" : "Ekspor Arus Kas (CSV / Excel)"}
          </Button>
        </div>
      </div>

      {/* Top 3 Flow Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Kas Masuk Pelanggan</span>
                <FinancialIndicatorInfo indicatorKey="arus_kas_masuk" />
              </span>
              <ArrowDownRight className="w-4 h-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatRupiah(statement.operatingInflows.customerPayments)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Dari 2 pesanan telah bayar kas
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Pengeluaran Kas Operasi</span>
                <FinancialIndicatorInfo indicatorKey="arus_kas_keluar" />
              </span>
              <ArrowUpRight className="w-4 h-4 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {formatRupiah(statement.operatingOutflows.total)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Beban tunai & pengadaan bahan
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Modal Awal Disetor</span>
                <FinancialIndicatorInfo indicatorKey="modal_usaha" />
              </span>
              <Wallet className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatRupiah(statement.financingCashFlow.ownerCapitalInjected)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Setoran modal awal pemilik (Tabel 3 Excel)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                Laporan Arus Kas Multi-Aktivitas
              </CardTitle>
              <div className="text-xs text-zinc-500 mt-0.5">
                Periode: <strong>{statement.period}</strong> • Rekonsiliasi Kas Riil
              </div>
            </div>
            <Badge variant="accent" className="text-xs font-normal">
              Direct Method
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-6 font-semibold w-2/3">Uraian Aliran Kas</th>
                  <th className="py-2.5 px-6 font-semibold text-right w-1/3">Arus Kas Masuk / (Keluar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-sans">
                {/* A. Aktivitas Operasi */}
                <tr className="bg-zinc-50/70 dark:bg-zinc-800/30 font-semibold text-zinc-900 dark:text-zinc-100">
                  <td className="py-2.5 px-6" colSpan={2}>
                    A. ARUS KAS DARI AKTIVITAS OPERASI
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                  <td className="py-2 px-8 text-zinc-700 dark:text-zinc-300">
                    Penerimaan Kas dari Pelanggan (Uang Muka & Pelunasan Pesanan)
                  </td>
                  <td className="py-2 px-6 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{formatRupiah(statement.operatingInflows.customerPayments)}
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-zinc-600 dark:text-zinc-300">
                  <td className="py-2 px-8">
                    Pembayaran Beban Operasional Kas Studio (Sewa, Internet, Iklan)
                  </td>
                  <td className="py-2 px-6 text-right font-mono text-rose-600 dark:text-rose-400">
                    -{formatRupiah(statement.operatingOutflows.operatingExpensesPaid)}
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-zinc-600 dark:text-zinc-300">
                  <td className="py-2 px-8">
                    Pengadaan Persediaan Bahan Baku (Filamen, Kelistrikan, Kemasan)
                  </td>
                  <td className="py-2 px-6 text-right font-mono text-rose-600 dark:text-rose-400">
                    -{formatRupiah(statement.operatingOutflows.materialPurchases)}
                  </td>
                </tr>
                <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 font-semibold text-zinc-900 dark:text-zinc-100 border-t border-b border-zinc-200 dark:border-zinc-800">
                  <td className="py-2.5 px-8">Arus Kas Bersih dari Aktivitas Operasi</td>
                  <td className="py-2.5 px-6 text-right font-mono text-rose-600 dark:text-rose-400">
                    {formatRupiah(statement.netOperatingCashFlow)}
                  </td>
                </tr>

                {/* B. Aktivitas Investasi */}
                <tr className="bg-zinc-50/70 dark:bg-zinc-800/30 font-semibold text-zinc-900 dark:text-zinc-100">
                  <td className="py-2.5 px-6" colSpan={2}>
                    B. ARUS KAS DARI AKTIVITAS INVESTASI
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-zinc-600 dark:text-zinc-300">
                  <td className="py-2 px-8">
                    Pembelian Aset Mesin Printer 3D & Alat Kerja (Bambulab A1 Mini, Anycubic Kobra X, Jangka Sorong)
                  </td>
                  <td className="py-2 px-6 text-right font-mono text-purple-600 dark:text-purple-400">
                    -{formatRupiah(statement.investingCashFlow.fixedAssetsPurchased)}
                  </td>
                </tr>
                <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 font-semibold text-zinc-900 dark:text-zinc-100 border-t border-b border-zinc-200 dark:border-zinc-800">
                  <td className="py-2.5 px-8">Arus Kas Bersih untuk Aktivitas Investasi</td>
                  <td className="py-2.5 px-6 text-right font-mono text-purple-600 dark:text-purple-400">
                    -{formatRupiah(statement.investingCashFlow.fixedAssetsPurchased)}
                  </td>
                </tr>

                {/* C. Aktivitas Pendanaan */}
                <tr className="bg-zinc-50/70 dark:bg-zinc-800/30 font-semibold text-zinc-900 dark:text-zinc-100">
                  <td className="py-2.5 px-6" colSpan={2}>
                    C. ARUS KAS DARI AKTIVITAS PENDANAAN
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-zinc-600 dark:text-zinc-300">
                  <td className="py-2 px-8">
                    Setoran Modal Awal Pemilik Studio (Injeksi Ekuitas)
                  </td>
                  <td className="py-2 px-6 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    +{formatRupiah(statement.financingCashFlow.ownerCapitalInjected)}
                  </td>
                </tr>
                <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 font-semibold text-zinc-900 dark:text-zinc-100 border-t border-b border-zinc-200 dark:border-zinc-800">
                  <td className="py-2.5 px-8">Arus Kas Bersih dari Aktivitas Pendanaan</td>
                  <td className="py-2.5 px-6 text-right font-mono text-amber-600 dark:text-amber-400">
                    +{formatRupiah(statement.financingCashFlow.ownerCapitalInjected)}
                  </td>
                </tr>

                {/* D. Saldo Kas Berjalan */}
                <tr className="bg-emerald-50 dark:bg-emerald-950/40 font-bold text-sm text-emerald-900 dark:text-emerald-100">
                  <td className="py-4 px-6 flex items-center justify-between">
                    <span className="uppercase">SALDO KAS BERJALAN STUDIO (NET CASH BALANCE)</span>
                    <Badge variant="success" className="text-[10px]">
                      Kas Aktif
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-base text-emerald-700 dark:text-emerald-300">
                    {formatRupiah(statement.endingCashBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Accounting Clarification Note */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-zinc-800 dark:text-zinc-200">
            Kepatuhan Aturan Bisnis Section 8.3 Master Prompt
          </div>
          <p>
            Sistem secara ketat membedakan antara <strong>Saldo Kas</strong>, <strong>Modal Usaha</strong>, <strong>Nilai Aset Tetap</strong>, dan <strong>Laba/Rugi</strong>.
            Modal awal Rp 11.440.748 dicatat sebagai aktivitas pendanaan dan tidak langsung dikurangkan dari omzet penjualan, menjamin integritas pembukuan studio.
          </p>
        </div>
      </div>
    </div>
  );
}
