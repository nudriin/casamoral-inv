"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SalesAnalytics } from "@/lib/services/reports-service";
import { formatRupiah } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadCSV, formatCSVWithBOM } from "@/lib/export-csv";
import {
  ArrowLeft,
  Download,
  Package,
  TrendingUp,
  Clock,
  Sparkles,
  ShoppingBag,
  Share2,
} from "lucide-react";

interface SalesAnalyticsClientProps {
  analytics: SalesAnalytics;
}

export function SalesAnalyticsClient({ analytics }: SalesAnalyticsClientProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleExportCSV = () => {
    const rows = [
      ["ANALISIS PENJUALAN & PERFORMA PRODUK — CASA MORAL 3D PRINTING"],
      [`Total Unit Terjual: ${analytics.totalUnitsSold} unit • Total Omzet: Rp ${analytics.totalRevenue}`],
      [""],
      ["SKU", "Nama Model", "Unit Terjual", "Total Omzet (IDR)", "Total HPP (IDR)", "Laba Kotor (IDR)", "Margin %", "Pangsa Omzet %", "Est. Jam Cetak"],
      ...analytics.products.map((p) => [
        p.sku,
        p.name,
        p.unitsSold,
        p.totalRevenue,
        p.totalHpp,
        p.grossProfit,
        `${p.grossMarginPct}%`,
        `${p.shareOfSalesPct}%`,
        `${p.printingHoursEstimate} jam`,
      ]),
      [""],
      ["Kanal Transaksi", "Jumlah Pesanan", "Total Omzet (IDR)", "Kontribusi %"],
      ...analytics.channels.map((c) => [
        c.channel,
        c.ordersCount,
        c.revenue,
        `${c.percentage}%`,
      ]),
      [""],
      ["Add-On Kustomisasi", "Frekuensi Pesanan", "Total Omzet Add-On (IDR)"],
      ...analytics.addOns.map((a) => [
        a.name,
        a.count,
        a.totalRevenue,
      ]),
    ];

    const csvContent = formatCSVWithBOM(rows);
    downloadCSV(`Analisis_Produk_Casa_Moral_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
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
            SKU & Model Analytics
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportCSV}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            {downloaded ? "Berhasil Diunduh!" : "Ekspor Analitik (CSV / Excel)"}
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span>Total Volume Terjual</span>
              <Package className="w-4 h-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {analytics.totalUnitsSold} <span className="text-sm font-normal text-zinc-500">Unit</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Dari {analytics.totalOrders} pesanan aktif terkonfirmasi
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span>Rata-rata Nilai Pesanan (AOV)</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
              {formatRupiah(analytics.avgOrderValue)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Rata-rata tiket transaksi per customer
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span>Estimasi Beban Cetak Studio</span>
              <Clock className="w-4 h-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
              {analytics.totalPrintingHoursEstimated.toFixed(1)} <span className="text-sm font-normal text-zinc-500">Jam</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Akumulasi waktu operasional mesin 3D printer
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-zinc-500 font-medium flex items-center justify-between">
              <span>Kustomisasi Add-On</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatRupiah(analytics.addOns.reduce((sum, a) => sum + a.totalRevenue, 0))}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {analytics.addOns.length} jenis add-on kustom terpasang
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Performance Ranking Table */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                Matriks Performa dan Profitabilitas per Model Lampu
              </CardTitle>
              <div className="text-xs text-zinc-500 mt-0.5">
                Perbandingan Omzet, HPP, Margin Kotor, dan Beban Mesin Cetak
              </div>
            </div>
            <Badge variant="accent" className="text-xs font-mono">
              Ranking Profitabilitas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Model Lampu & SKU</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Unit Terjual</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Harga Jual Rata-rata</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total Omzet</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Total HPP</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Laba Kotor</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Margin %</th>
                  <th className="py-2.5 px-4 font-semibold text-center">Pangsa</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Waktu Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 font-sans">
                {analytics.products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <div>{prod.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{prod.sku}</div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {prod.unitsSold}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-zinc-700 dark:text-zinc-300">
                      {formatRupiah(prod.avgSellingPrice)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(prod.totalRevenue)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      {formatRupiah(prod.totalHpp)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(prod.grossProfit)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-amber-600">
                      {prod.grossMarginPct}%
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-block w-16 bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden align-middle mr-1.5">
                        <div
                          className="bg-amber-500 h-full rounded-full"
                          style={{ width: `${prod.shareOfSalesPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {prod.shareOfSalesPct.toFixed(0)}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-purple-600 dark:text-purple-400">
                      {prod.printingHoursEstimate.toFixed(1)} jam
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Two Columns: Channels & Add-Ons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kanal Penjualan */}
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-500" />
              Distribusi Kanal Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {analytics.channels.map((ch) => (
              <div key={ch.channel} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {ch.channel === "Direct" ? "Direct Customer (WhatsApp / Offline)" : "Marketplace (Shopee)"}
                  </span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400">
                    {formatRupiah(ch.revenue)} ({ch.ordersCount} pesanan • {ch.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      ch.channel === "Direct" ? "bg-emerald-500" : "bg-orange-500"
                    }`}
                    style={{ width: `${ch.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Add-On Customization Insights */}
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Performa Add-On Kustomisasi Desain
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {analytics.addOns.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-xs">
                Belum ada pesanan dengan add-on kustomisasi tambahan.
              </div>
            ) : (
              analytics.addOns.map((add, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                      ★
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{add.name}</div>
                      <div className="text-[11px] text-zinc-500">Dipesan {add.count}x transaksi</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">
                    +{formatRupiah(add.totalRevenue)}
                  </div>
                </div>
              ))
            )}
            <div className="text-[11px] text-zinc-500 pt-1">
              💡 <em>Add-on memberikan marjin kotor hampir 100% tanpa menambah komponen kelistrikan utama.</em>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
