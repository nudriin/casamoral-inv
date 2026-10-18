"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProfitLossStatement, CashFlowStatement, SalesAnalytics } from "@/lib/services/reports-service";
import { FinancialRecapSummary } from "@/lib/services/recap-service";
import { Order } from "@/types/database";
import { formatRupiah } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCSV, formatCSVWithBOM } from "@/lib/export-csv";
import {
  FileSpreadsheet,
  Download,
  TrendingUp,
  Coins,
  Wallet,
  ArrowRight,
  Package,
} from "lucide-react";
import { FinancialIndicatorInfo, FinancialGlossaryModalButton } from "@/components/financial-indicator-guide";
import { RecapClient } from "./recap/recap-client";

interface ReportsHubClientProps {
  pl: ProfitLossStatement;
  cashFlow: CashFlowStatement;
  sales: SalesAnalytics;
  orders: Order[];
  recap?: FinancialRecapSummary;
}

export function ReportsHubClient({ pl, cashFlow, sales, orders, recap }: ReportsHubClientProps) {
  const [activeTab, setActiveTab] = useState<"RECAP" | "STATEMENTS">("RECAP");
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExportOrdersCSV = () => {
    setDownloading("orders");
    const rows = [
      ["REKAP PESANAN & TRANSAKSI PENJUALAN — CASA MORAL 3D PRINTING"],
      [`Total: ${orders.length} pesanan`],
      [""],
      [
        "No. Pesanan",
        "Tanggal",
        "Nama Pelanggan",
        "Kota",
        "Kanal",
        "Status Pesanan",
        "Status Bayar",
        "Total Tagihan (IDR)",
        "Kas Dibayar (IDR)",
        "Sisa Piutang (IDR)",
        "Item Produk",
      ],
      ...orders.map((o) => {
        const remaining = Math.max(0, o.total_amount - o.paid_amount);
        const itemNames = (o.items || []).map((i) => `${i.product?.name || "Lampu"} (${i.quantity}x)`).join("; ");
        return [
          o.order_number,
          o.order_date.slice(0, 10),
          o.customer?.name || "Umum",
          o.customer?.city || "Sukamara",
          o.channel,
          o.status,
          o.payment_status,
          o.total_amount,
          o.paid_amount,
          remaining,
          itemNames,
        ];
      }),
    ];

    const csvContent = formatCSVWithBOM(rows);
    downloadCSV(`Rekap_Pesanan_Casa_Moral_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setTimeout(() => setDownloading(null), 1500);
  };

  const handleExportPnLCSV = () => {
    setDownloading("pnl");
    const rows = [
      ["LAPORAN LABA RUGI OPERASIONAL — CASA MORAL 3D PRINTING"],
      [`Periode: ${pl.period}`],
      [""],
      ["Komponen Finansial", "Nilai (IDR)"],
      ["Penjualan Kotor (Gross Revenue)", pl.grossRevenue],
      ["Potongan Diskon Promosi", -pl.discounts],
      ["Biaya Platform Shopee", -pl.platformFees],
      ["Pendapatan Bersih (Net Revenue)", pl.netRevenue],
      ["Beban Pokok Penjualan (COGS / HPP)", -pl.cogs],
      ["Laba Kotor (Gross Profit)", pl.grossProfit],
      ["Total Beban Tetap (Fixed Cost)", -pl.operatingExpenses.fixedTotal],
      ["Total Beban Variabel", -pl.operatingExpenses.variableTotal],
      ["Total Beban Operasional", -pl.operatingExpenses.total],
      ["Laba / (Rugi) Operasional Bersih", pl.netProfit],
    ];

    const csvContent = formatCSVWithBOM(rows);
    downloadCSV(`Laporan_Laba_Rugi_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setTimeout(() => setDownloading(null), 1500);
  };

  const handleExportCashFlowCSV = () => {
    setDownloading("cashflow");
    const rows = [
      ["LAPORAN ARUS KAS — CASA MORAL 3D PRINTING"],
      [`Periode: ${cashFlow.period}`],
      [""],
      ["Aktivitas Arus Kas", "Nilai (IDR)"],
      ["Penerimaan Kas Pelanggan", cashFlow.operatingInflows.customerPayments],
      ["Pengeluaran Beban Operasional Kas", -cashFlow.operatingOutflows.operatingExpensesPaid],
      ["Pengadaan Bahan Baku Awal", -cashFlow.operatingOutflows.materialPurchases],
      ["Arus Kas Bersih Operasi", cashFlow.netOperatingCashFlow],
      ["Pembelian Aset Mesin Printer 3D", -cashFlow.investingCashFlow.fixedAssetsPurchased],
      ["Setoran Modal Awal Pemilik", cashFlow.financingCashFlow.ownerCapitalInjected],
      ["Saldo Kas Berjalan Studio", cashFlow.endingCashBalance],
    ];

    const csvContent = formatCSVWithBOM(rows);
    downloadCSV(`Laporan_Arus_Kas_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setTimeout(() => setDownloading(null), 1500);
  };

  const handleExportProductMatrixCSV = () => {
    setDownloading("products");
    const rows = [
      ["MATRIKS PROFITABILITAS PRODUK — CASA MORAL 3D PRINTING"],
      [""],
      ["SKU", "Nama Model", "Unit Terjual", "Omzet (IDR)", "HPP Total (IDR)", "Laba Kotor (IDR)", "Margin %"],
      ...sales.products.map((p) => [
        p.sku,
        p.name,
        p.unitsSold,
        p.totalRevenue,
        p.totalHpp,
        p.grossProfit,
        `${p.grossMarginPct}%`,
      ]),
    ];

    const csvContent = formatCSVWithBOM(rows);
    downloadCSV(`Matriks_Produk_Casa_Moral_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Navigation & Glossary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-zinc-800/80 shadow-xs">
          <button
            onClick={() => setActiveTab("RECAP")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "RECAP"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" /> 1. Buku Kas & Rekap Omzet
          </button>
          <button
            onClick={() => setActiveTab("STATEMENTS")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "STATEMENTS"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <TrendingUp className="h-4 w-4" /> 2. Laporan Finansial SAK & Ekspor
          </button>
        </div>
        <div className="flex items-center gap-2 px-2">
          <FinancialGlossaryModalButton />
        </div>
      </div>

      {/* TAB 1: REKAP KEUANGAN & BUKU KAS HARIAN */}
      {activeTab === "RECAP" && recap && (
        <RecapClient initialRecap={recap} />
      )}

      {/* TAB 2: IKHTISAR SAK & PUSAT EKSPOR SPREADSHEET */}
      {activeTab === "STATEMENTS" && (
        <div className="space-y-6">
          {/* Top Banner with Glossary Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Pusat Pelaporan Finansial & Standar Akuntansi Studio
                </h2>
                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">SAK EMKM</Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Laporan komprehensif berbasis transaksi studio, alokasi beban penyusutan printer, dan arus kas riil.
              </p>
            </div>
          </div>

          {/* 3 Main Report Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Report 1: Laba Rugi */}
        <Card className="hover:border-amber-400 dark:hover:border-amber-600 transition-all shadow-sm">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <Badge variant="accent">Finansial Akrual</Badge>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <CardTitle className="text-base font-semibold pt-1 flex items-center justify-between">
              <span>Laporan Laba Rugi</span>
              <FinancialIndicatorInfo indicatorKey="laba_kotor" />
            </CardTitle>
            <div className="text-xs text-zinc-500">
              Breakdown Pendapatan Bersih, HPP Riil, Beban Tetap & Variabel, serta Laba Bersih.
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Laba Kotor:</span>
              <span className="font-mono font-semibold text-emerald-600">
                {formatRupiah(pl.grossProfit)} ({pl.grossMarginPct}%)
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Beban Operasional:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {formatRupiah(pl.operatingExpenses.total)}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Link href="/reports/profit-loss" className="block">
                <Button size="sm" className="w-full text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold">
                  Buka Laporan Laba Rugi <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Report 2: Arus Kas */}
        <Card className="hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-sm">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <Badge variant="success">Metode Langsung</Badge>
              <Wallet className="w-4 h-4 text-emerald-500" />
            </div>
            <CardTitle className="text-base font-semibold pt-1 flex items-center justify-between">
              <span>Laporan Arus Kas</span>
              <FinancialIndicatorInfo indicatorKey="arus_kas_masuk" />
            </CardTitle>
            <div className="text-xs text-zinc-500">
              Aliran Kas Masuk Operasional, Kas Keluar Beban, Investasi Mesin, dan Saldo Likuiditas.
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Penerimaan Kas Pelanggan:</span>
              <span className="font-mono font-semibold text-emerald-600">
                +{formatRupiah(cashFlow.operatingInflows.customerPayments)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Modal Disetor:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {formatRupiah(cashFlow.financingCashFlow.ownerCapitalInjected)}
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Link href="/reports/cash-flow" className="block">
                <Button size="sm" variant="outline" className="w-full text-xs gap-1 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                  Buka Laporan Arus Kas <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Report 3: Analisis Penjualan & Produk */}
        <Card className="hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-sm">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <Badge variant="outline">SKU & Performance</Badge>
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <CardTitle className="text-base font-semibold pt-1">
              Analitik Produk & Penjualan
            </CardTitle>
            <div className="text-xs text-zinc-500">
              Matriks margin kontribusi 4 model lampu, add-on kustom, dan estimasi beban mesin cetak.
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Volume Terjual:</span>
              <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                {sales.totalUnitsSold} unit ({sales.totalOrders} pesanan)
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Total Jam Cetak:</span>
              <span className="font-mono text-purple-600 dark:text-purple-400">
                {sales.totalPrintingHoursEstimated.toFixed(1)} jam operasional
              </span>
            </div>
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Link href="/reports/sales-analytics" className="block">
                <Button size="sm" variant="outline" className="w-full text-xs gap-1 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                  Buka Analisis Produk <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Financial Snapshot */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              Rekonsiliasi Ringkasan Finansial Eksekutif
            </span>
            <span className="text-xs font-normal text-zinc-400">
              Periode: {pl.period}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800">
              <div className="text-[11px] text-zinc-500">Omzet Penjualan</div>
              <div className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                {formatRupiah(pl.grossRevenue)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800">
              <div className="text-[11px] text-zinc-500">Snapshot HPP (COGS)</div>
              <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                {formatRupiah(pl.cogs)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Laba Kotor</div>
              <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                {formatRupiah(pl.grossProfit)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800">
              <div className="text-[11px] text-zinc-500">Beban Operasional</div>
              <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                {formatRupiah(pl.operatingExpenses.total)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800">
              <div className="text-[11px] text-zinc-500">Kas Masuk Pelanggan</div>
              <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(cashFlow.operatingInflows.customerPayments)}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800">
              <div className="text-[11px] text-zinc-500">Sisa Piutang Berjalan</div>
              <div className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">
                {formatRupiah(pl.grossRevenue - cashFlow.operatingInflows.customerPayments)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data Center */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-500" />
            Pusat Ekspor Dokumen & Spreadsheet (CSV / Excel UTF-8)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={handleExportOrdersCSV}
              variant="outline"
              size="sm"
              className="text-xs justify-start gap-2 h-auto py-2.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <div className="text-left">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {downloading === "orders" ? "Mengunduh..." : "Rekap Pesanan (9 Order)"}
                </div>
                <div className="text-[10px] text-zinc-400 font-normal">Data transaksi lengkap</div>
              </div>
            </Button>

            <Button
              onClick={handleExportPnLCSV}
              variant="outline"
              size="sm"
              className="text-xs justify-start gap-2 h-auto py-2.5"
            >
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <div className="text-left">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {downloading === "pnl" ? "Mengunduh..." : "Laporan Laba Rugi"}
                </div>
                <div className="text-[10px] text-zinc-400 font-normal">Komponen akun finansial</div>
              </div>
            </Button>

            <Button
              onClick={handleExportCashFlowCSV}
              variant="outline"
              size="sm"
              className="text-xs justify-start gap-2 h-auto py-2.5"
            >
              <Wallet className="w-4 h-4 text-blue-600" />
              <div className="text-left">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {downloading === "cashflow" ? "Mengunduh..." : "Laporan Arus Kas"}
                </div>
                <div className="text-[10px] text-zinc-400 font-normal">Arus operasi, investasi & modal</div>
              </div>
            </Button>

            <Button
              onClick={handleExportProductMatrixCSV}
              variant="outline"
              size="sm"
              className="text-xs justify-start gap-2 h-auto py-2.5"
            >
              <Package className="w-4 h-4 text-purple-600" />
              <div className="text-left">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {downloading === "products" ? "Mengunduh..." : "Matriks Model Lampu"}
                </div>
                <div className="text-[10px] text-zinc-400 font-normal">Performa 4 model ambient</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
        </div>
      )}
    </div>
  );
}
