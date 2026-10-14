"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProfitLossStatement } from "@/lib/services/reports-service";
import { formatRupiah } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCSV, formatCSVWithBOM } from "@/lib/export-csv";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  Coins,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { FinancialIndicatorInfo, FinancialGlossaryModalButton } from "@/components/financial-indicator-guide";

interface ProfitLossClientProps {
  statement: ProfitLossStatement;
}

export function ProfitLossClient({ statement }: ProfitLossClientProps) {
  const [copied, setCopied] = useState(false);

  const handleExportCSV = () => {
    const rows = [
      ["LAPORAN LABA RUGI OPERASIONAL — CASA MORAL 3D PRINTING"],
      [`Periode: ${statement.period}`],
      [""],
      ["Komponen Finansial", "Nilai (IDR)", "Keterangan"],
      ["I. PENDAPATAN USAHA (REVENUE)", "", ""],
      ["Penjualan Kotor Produk & Add-On", statement.grossRevenue, "Omzet 9 pesanan"],
      ["Potongan Diskon Promosi", -statement.discounts, "Diskon promosi awal"],
      ["Biaya Platform Marketplace (Shopee)", -statement.platformFees, "Fee admin & gratis ongkir Shopee"],
      ["PENDAPATAN BERSIH (NET REVENUE)", statement.netRevenue, "Pendapatan diakui"],
      [""],
      ["II. HARGA POKOK PRODUKSI (COGS / HPP)", "", ""],
      ["Biaya Bahan Baku & Produksi Langsung", -statement.cogs, "Snapshot HPP terkunci per unit pesanan"],
      ["LABA KOTOR (GROSS PROFIT)", statement.grossProfit, `Gross Margin: ${statement.grossMarginPct}%`],
      [""],
      ["III. BEBAN OPERASIONAL (OPEX)", "", ""],
      ...statement.operatingExpenses.breakdown.map((b) => [
        `  ${b.category}`,
        -b.amount,
        b.isFixed ? "Beban Tetap (Fixed Cost)" : "Beban Variabel",
      ]),
      ["Total Beban Tetap (Fixed)", -statement.operatingExpenses.fixedTotal, ""],
      ["Total Beban Variabel", -statement.operatingExpenses.variableTotal, ""],
      ["TOTAL BEBAN OPERASIONAL", -statement.operatingExpenses.total, ""],
      [""],
      ["IV. LABA / (RUGI) OPERASIONAL BERSIH", statement.netProfit, `Operating Margin: ${statement.netMarginPct}%`],
    ];

    const csvContent = formatCSVWithBOM(rows);
    downloadCSV(`Laporan_Laba_Rugi_Casa_Moral_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const isProfitable = statement.netProfit >= 0;

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
            SAK EMKM / Standar Akuntansi Studio
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
            {copied ? "Berhasil Diunduh!" : "Ekspor Laporan (CSV / Excel)"}
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Pendapatan Bersih (Net)</span>
                <FinancialIndicatorInfo indicatorKey="pendapatan_bersih" />
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {formatRupiah(statement.netRevenue)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Omzet kotor: {formatRupiah(statement.grossRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Laba Kotor (Gross Profit)</span>
                <FinancialIndicatorInfo indicatorKey="laba_kotor" />
              </span>
              <Coins className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatRupiah(statement.grossProfit)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Margin Kotor: <strong className="text-amber-600">{statement.grossMarginPct}%</strong>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Beban Operasional (OPEX)</span>
                <FinancialIndicatorInfo indicatorKey="laba_operasional" />
              </span>
              <Receipt className="w-4 h-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {formatRupiah(statement.operatingExpenses.total)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Tetap: {formatRupiah(statement.operatingExpenses.fixedTotal)} • Var: {formatRupiah(statement.operatingExpenses.variableTotal)}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${isProfitable ? "border-l-emerald-500" : "border-l-rose-500"}`}>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>Laba Operasional Bersih</span>
                <FinancialIndicatorInfo indicatorKey="laba_operasional" />
              </span>
              <Sparkles className={`w-4 h-4 ${isProfitable ? "text-emerald-500" : "text-rose-500"}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-xl font-bold font-mono ${
                isProfitable ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatRupiah(statement.netProfit)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {isProfitable ? "Surplus operasional" : "Defisit awal investasi studio"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Startup Context Alert */}
      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
            Catatan Finansial Periode Awal Studio (Startup Phase)
          </div>
          <p className="leading-relaxed">
            Pada tahap perintisan 9 pesanan pertama, laba kotor tercatat positif senilai{" "}
            <strong>{formatRupiah(statement.grossProfit)}</strong> (Margin <strong>{statement.grossMarginPct}%</strong>).
            Defisit laba operasional bersih sebesar <strong>{formatRupiah(Math.abs(statement.netProfit))}</strong> wajar terjadi karena studio menanggung beban tetap penuh (Sewa tempat Rp 500k, WiFi Rp 250k, Amortisasi) di bulan pembukaan.
            Gunakan widget <strong>Break-Even Point (BEP)</strong> untuk melacak target volume unit bulanan menuju titik impas operasional.
          </p>
        </div>
      </div>

      {/* Detailed Income Statement Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                Laporan Laba Rugi Komprehensif
              </CardTitle>
              <div className="text-xs text-zinc-500 mt-0.5">
                Periode Pelaporan: <strong>{statement.period}</strong> (Mata Uang: IDR / Rupiah)
              </div>
            </div>
            <div className="text-xs font-mono text-zinc-400">
              Metode: Akrual / Snapshot Transaksi Riil
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-6 font-semibold w-2/3">Pos Laporan Finansial</th>
                  <th className="py-2.5 px-6 font-semibold text-right w-1/3">Nilai Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-sans">
                {/* Bagian I: Pendapatan Usaha */}
                <tr className="bg-zinc-50/70 dark:bg-zinc-800/30 font-semibold text-zinc-900 dark:text-zinc-100">
                  <td className="py-2.5 px-6" colSpan={2}>
                    I. PENDAPATAN USAHA (REVENUE)
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                  <td className="py-2 px-8 text-zinc-600 dark:text-zinc-300">
                    Penjualan Produk & Add-On Kustom (Kotor)
                  </td>
                  <td className="py-2 px-6 text-right font-mono text-zinc-900 dark:text-zinc-100">
                    {formatRupiah(statement.grossRevenue)}
                  </td>
                </tr>
                {statement.discounts > 0 && (
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-rose-600 dark:text-rose-400">
                    <td className="py-2 px-8">
                      Potongan Diskon Penjualan (Promosi Awal)
                    </td>
                    <td className="py-2 px-6 text-right font-mono">
                      -{formatRupiah(statement.discounts)}
                    </td>
                  </tr>
                )}
                {statement.platformFees > 0 && (
                  <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-amber-700 dark:text-amber-400">
                    <td className="py-2 px-8">
                      Potongan Biaya Marketplace (Admin Shopee & Ongkir Xtra)
                    </td>
                    <td className="py-2 px-6 text-right font-mono">
                      -{formatRupiah(statement.platformFees)}
                    </td>
                  </tr>
                )}
                <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 font-semibold text-zinc-900 dark:text-zinc-100">
                  <td className="py-2.5 px-8">PENDAPATAN BERSIH (NET REVENUE)</td>
                  <td className="py-2.5 px-6 text-right font-mono text-blue-600 dark:text-blue-400">
                    {formatRupiah(statement.netRevenue)}
                  </td>
                </tr>

                {/* Bagian II: HPP */}
                <tr className="bg-zinc-50/70 dark:bg-zinc-800/30 font-semibold text-zinc-900 dark:text-zinc-100">
                  <td className="py-2.5 px-6" colSpan={2}>
                    II. HARGA POKOK PRODUKSI (COGS)
                  </td>
                </tr>
                <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-zinc-600 dark:text-zinc-300">
                  <td className="py-2 px-8">
                    Beban Bahan Baku Filamen & Komponen Kelistrikan/Kemasan
                  </td>
                  <td className="py-2 px-6 text-right font-mono text-rose-600 dark:text-rose-400">
                    -{formatRupiah(statement.cogs)}
                  </td>
                </tr>
                <tr className="bg-amber-50/60 dark:bg-amber-950/30 font-bold text-zinc-900 dark:text-zinc-100 border-t border-b border-amber-200 dark:border-amber-800/50">
                  <td className="py-3 px-8 flex items-center justify-between">
                    <span>LABA KOTOR (GROSS PROFIT)</span>
                    <Badge variant="accent" className="text-[10px] font-mono">
                      Margin {statement.grossMarginPct}%
                    </Badge>
                  </td>
                  <td className="py-3 px-6 text-right font-mono text-sm text-amber-600 dark:text-amber-400">
                    {formatRupiah(statement.grossProfit)}
                  </td>
                </tr>

                {/* Bagian III: Beban Operasional */}
                <tr className="bg-zinc-50/70 dark:bg-zinc-800/30 font-semibold text-zinc-900 dark:text-zinc-100">
                  <td className="py-2.5 px-6" colSpan={2}>
                    III. BEBAN OPERASIONAL (OPERATING EXPENSES)
                  </td>
                </tr>
                {statement.operatingExpenses.breakdown.map((exp, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-zinc-600 dark:text-zinc-300">
                    <td className="py-2 px-8 flex items-center gap-2">
                      <span>{exp.category}</span>
                      <span className="text-[10px] text-zinc-400">
                        ({exp.isFixed ? "Beban Tetap" : "Variabel"})
                      </span>
                    </td>
                    <td className="py-2 px-6 text-right font-mono text-zinc-700 dark:text-zinc-300">
                      -{formatRupiah(exp.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-zinc-100/50 dark:bg-zinc-800/40 font-semibold text-zinc-900 dark:text-zinc-100">
                  <td className="py-2.5 px-8">TOTAL BEBAN OPERASIONAL</td>
                  <td className="py-2.5 px-6 text-right font-mono text-purple-600 dark:text-purple-400">
                    -{formatRupiah(statement.operatingExpenses.total)}
                  </td>
                </tr>

                {/* Bagian IV: Laba Bersih */}
                <tr
                  className={`font-bold text-sm ${
                    isProfitable
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  <td className="py-4 px-6 flex items-center justify-between">
                    <span className="uppercase">IV. LABA / (RUGI) OPERASIONAL BERSIH</span>
                    <span className="text-xs font-mono font-normal">
                      Operating Margin: {statement.netMarginPct}%
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-base">
                    {formatRupiah(statement.netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Audit & Compliance Footer */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 px-1">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" /> Data laporan dihitung secara matematis menggunakan Decimal.js tanpa floating point error.
        </span>
        <span>Casa Moral Management Studio • Sprint 6 Reporting</span>
      </div>
    </div>
  );
}
