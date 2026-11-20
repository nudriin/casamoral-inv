"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { FinancialRecapSummary, RecapDatePeriod, RecapOrderRow } from "@/lib/services/recap-service";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCSV, formatCSVWithBOM } from "@/lib/export-csv";
import {
  FileSpreadsheet,
  Download,
  Search,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  CreditCard,
  Package,
  Boxes,
  ArrowLeft,
  Store,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

interface RecapClientProps {
  initialRecap: FinancialRecapSummary;
}

export function RecapClient({ initialRecap }: RecapClientProps) {
  // Filters
  const [period, setPeriod] = useState<RecapDatePeriod>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Client-side filtering
  const filteredOrders = useMemo(() => {
    return initialRecap.orders.filter((o) => {
      // Date filtering
      if (period !== "ALL") {
        const orderDate = new Date(o.orderDate);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (period === "TODAY") {
          if (orderDate < todayStart || orderDate > todayEnd) return false;
        } else if (period === "YESTERDAY") {
          const yestStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
          const yestEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);
          if (orderDate < yestStart || orderDate > yestEnd) return false;
        } else if (period === "THIS_WEEK") {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const weekStart = new Date(now.setDate(diff));
          weekStart.setHours(0, 0, 0, 0);
          if (orderDate < weekStart) return false;
        } else if (period === "THIS_MONTH") {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          if (orderDate < monthStart) return false;
        } else if (period === "CUSTOM" && startDate && endDate) {
          const cStart = new Date(`${startDate}T00:00:00`);
          const cEnd = new Date(`${endDate}T23:59:59`);
          if (orderDate < cStart || orderDate > cEnd) return false;
        }
      }

      // Channel filter
      if (channelFilter !== "ALL" && o.channel !== channelFilter) {
        return false;
      }

      // Payment status filter
      if (paymentStatusFilter !== "ALL" && o.paymentStatus !== paymentStatusFilter) {
        return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!o.orderNumber.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [initialRecap.orders, period, startDate, endDate, channelFilter, paymentStatusFilter, search]);

  // Aggregate stats from filtered orders
  const stats = useMemo(() => {
    let grossRevenue = 0;
    let netRealizedRevenue = 0;
    let totalHpp = 0;
    let rawProductHpp = 0;
    let packagingHpp = 0;
    let platformFees = 0;
    let netProfit = 0;
    let cashReceived = 0;
    let receivables = 0;

    for (const o of filteredOrders) {
      grossRevenue += o.totalAmount;
      const netRev = o.netRealizedRevenue ?? (o.totalAmount - (o.platformFee || 0) - (o.discountAmount || 0));
      netRealizedRevenue += netRev;
      totalHpp += o.totalHpp;
      rawProductHpp += o.rawProductHpp;
      packagingHpp += o.packagingHpp;
      platformFees += o.platformFee;
      netProfit += o.netProfit;
      cashReceived += o.paidAmount;
      receivables += o.remainingReceivable;
    }

    const marginPct = netRealizedRevenue > 0
      ? Number(((netProfit / netRealizedRevenue) * 100).toFixed(1))
      : (grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(1)) : 0);

    return {
      count: filteredOrders.length,
      grossRevenue,
      netRealizedRevenue,
      totalHpp,
      rawProductHpp,
      packagingHpp,
      platformFees,
      netProfit,
      marginPct,
      cashReceived,
      receivables,
    };
  }, [filteredOrders]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "No. Pesanan",
      "Tanggal",
      "Kanal",
      "Nama Pelanggan",
      "Kota",
      "Produk",
      "Kemasan",
      "Total Tagihan Invoice (Rp)",
      "Potongan Fee Marketplace (Rp)",
      "Omzet Riil Diterima Kas (Rp)",
      "Modal Bahan Produk (Rp)",
      "Modal Kemasan (Rp)",
      "Total Modal HPP (Rp)",
      "Laba Bersih Riil (Rp)",
      "Margin (%)",
      "Status Pembayaran",
      "Kas Dibayar (Rp)",
      "Sisa Piutang (Rp)",
    ];

    const rows = filteredOrders.map((o) => {
      const netRev = o.netRealizedRevenue ?? (o.totalAmount - (o.platformFee || 0) - (o.discountAmount || 0));
      return [
        o.orderNumber,
        o.orderDate.slice(0, 10),
        o.channel,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.customerCity.replace(/"/g, '""')}"`,
        `"${o.productsSummary.replace(/"/g, '""')}"`,
        `"${o.packagingSummary.replace(/"/g, '""')}"`,
        o.totalAmount,
        o.platformFee,
        netRev,
        o.rawProductHpp,
        o.packagingHpp,
        o.totalHpp,
        o.netProfit,
        o.marginPct,
        o.paymentStatus,
        o.paidAmount,
        o.remainingReceivable,
      ];
    });

    const csvContent = formatCSVWithBOM([
      ["REKAP PENCATATAN KEUANGAN & TRANSAKSI — CASA MORAL 3D PRINTING"],
      [`Total: ${filteredOrders.length} transaksi (${stats.netRealizedRevenue} omzet riil kas, ${stats.grossRevenue} tagihan kotor, ${stats.netProfit} laba bersih)`],
      [""],
      headers,
      ...rows,
    ]);

    downloadCSV(`Rekap_Keuangan_Casa_Moral_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-4 rounded-2xl border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/reports" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Badge className="bg-emerald-600 text-white font-bold">REKAP KEUANGAN BISNIS</Badge>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Pencatatan Omzet • Modal Lampu & Kemasan • Laba Bersih • Buku Kas
            </span>
          </div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
            Rekap Transaksi & Pembukuan Finansial
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pos">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 cursor-pointer shadow-sm">
              <Store className="h-3.5 w-3.5" /> Buka Kasir POS
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 cursor-pointer shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Export Excel/CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
            Total Omzet Riil (Kas)
          </span>
          <span className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
            {formatRupiah(stats.netRealizedRevenue)}
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">
            Tagihan: {formatRupiah(stats.grossRevenue)} ({stats.count} Pesanan)
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
            Total Modal (COGS)
          </span>
          <span className="text-base font-black text-amber-700 dark:text-amber-400 font-mono">
            {formatRupiah(stats.totalHpp)}
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">
            Bahan: {formatRupiah(stats.rawProductHpp)} • Box: {formatRupiah(stats.packagingHpp)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
            Potongan Shopee
          </span>
          <span className="text-base font-black text-orange-600 font-mono">
            {stats.platformFees > 0 ? `-${formatRupiah(stats.platformFees)}` : "Rp 0"}
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">Memotong Omzet Toko</span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-sm">
          <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 block uppercase tracking-wider">
            Laba Bersih Riil
          </span>
          <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">
            {formatRupiah(stats.netProfit)}
          </span>
          <span className="text-[10px] text-emerald-600/80 block mt-0.5">Margin {stats.marginPct}%</span>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
            Kas Diterima
          </span>
          <span className="text-base font-black text-zinc-900 dark:text-zinc-100 font-mono">
            {formatRupiah(stats.cashReceived)}
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">Sudah Terbayar</span>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
            Sisa Piutang
          </span>
          <span className="text-base font-black text-rose-600 font-mono">
            {formatRupiah(stats.receivables)}
          </span>
          <span className="text-[10px] text-zinc-400 block mt-0.5">Belum Lunas</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Period buttons */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { key: "ALL", label: "Semua" },
                { key: "TODAY", label: "Hari Ini" },
                { key: "YESTERDAY", label: "Kemarin" },
                { key: "THIS_WEEK", label: "Minggu Ini" },
                { key: "THIS_MONTH", label: "Bulan Ini" },
                { key: "CUSTOM", label: "Kustom" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key as RecapDatePeriod)}
                  className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                    period === p.key
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Channel filter */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Kanal:</span>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs"
              >
                <option value="ALL">Semua Kanal</option>
                <option value="Direct">Direct</option>
                <option value="Shopee">Shopee</option>
                <option value="TikTokShop">TikTok Shop</option>
                <option value="Tokopedia">Tokopedia</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
              </select>

              {/* Payment status filter */}
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2 text-xs"
              >
                <option value="ALL">Semua Status Bayar</option>
                <option value="PAID">Lunas (Paid)</option>
                <option value="PARTIALLY_PAID">DP (Sebagian)</option>
                <option value="UNPAID">Belum Bayar (Piutang)</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {period === "CUSTOM" && (
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <span className="text-zinc-500">Rentang Tanggal:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36 h-8 text-xs font-mono"
              />
              <span className="text-zinc-400">s/d</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36 h-8 text-xs font-mono"
              />
            </div>
          )}

          {/* Search bar */}
          <div className="relative pt-1">
            <Search className="absolute left-2.5 top-3.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="Cari berdasarkan nomor pesanan atau nama pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Recap Ledger Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader className="bg-zinc-100/90 dark:bg-zinc-900">
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800 font-bold">
                <TableHead className="min-w-[130px]">No. Pesanan</TableHead>
                <TableHead className="min-w-[90px]">Tanggal</TableHead>
                <TableHead className="min-w-[90px]">Kanal</TableHead>
                <TableHead className="min-w-[140px]">Pelanggan</TableHead>
                <TableHead className="min-w-[180px]">Produk & Kemasan</TableHead>
                <TableHead className="text-right font-bold text-zinc-900 dark:text-zinc-100 min-w-[125px]">
                  Omzet Riil (Kas)
                </TableHead>
                <TableHead className="text-right text-amber-700 dark:text-amber-400">
                  Total Modal
                </TableHead>
                <TableHead className="text-right text-orange-600">Fee Marketplace</TableHead>
                <TableHead className="text-right font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                  Laba Bersih
                </TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-center min-w-[100px]">Status Bayar</TableHead>
                <TableHead className="text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-zinc-400">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((o) => (
                  <TableRow
                    key={o.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800/60"
                  >
                    <TableCell className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {o.orderNumber}
                    </TableCell>
                    <TableCell className="text-zinc-500">{o.orderDate.slice(0, 10)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={["Shopee", "TikTokShop", "Tokopedia"].includes(o.channel) ? "accent" : "outline"}
                        className="text-[10px] py-0"
                      >
                        {o.channel === "TikTokShop" ? "TikTok Shop" : o.channel}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {o.customerName}
                      <span className="text-[10px] text-zinc-400 block">{o.customerCity}</span>
                    </TableCell>
                    <TableCell>
                      <span className="block text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[200px]" title={o.productsSummary}>
                        {o.productsSummary}
                      </span>
                      <span className="text-[10px] text-zinc-400 block truncate max-w-[200px]" title={o.packagingSummary}>
                        Kemasan: {o.packagingSummary}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {o.platformFee > 0 ? (
                        <div>
                          <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 block">
                            {formatRupiah(o.netRealizedRevenue ?? (o.totalAmount - o.platformFee))}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-normal block">
                            Tagihan: {formatRupiah(o.totalAmount)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono font-black text-zinc-900 dark:text-zinc-100 block">
                          {formatRupiah(o.totalAmount)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-amber-700 dark:text-amber-400 font-mono">
                      {formatRupiah(o.totalHpp)}
                    </TableCell>
                    <TableCell className="text-right text-orange-600 font-mono">
                      {o.platformFee > 0 ? (
                        <div>
                          <span>-{formatRupiah(o.platformFee)}</span>
                          <span className="text-[9px] text-zinc-400 font-normal block">Potong Omzet</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 font-mono">
                      {formatRupiah(o.netProfit)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-zinc-700 dark:text-zinc-300">
                      {o.marginPct}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          o.paymentStatus === "PAID"
                            ? "success"
                            : o.paymentStatus === "PARTIALLY_PAID"
                            ? "accent"
                            : "destructive"
                        }
                        className="text-[10px] py-0"
                      >
                        {o.paymentStatus === "PAID" ? "Lunas" : o.paymentStatus === "PARTIALLY_PAID" ? "DP" : "Piutang"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/orders/${o.id}`} className="text-zinc-400 hover:text-amber-600">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
