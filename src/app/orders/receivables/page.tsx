import React from "react";
import Link from "next/link";
import { getReceivablesSummary } from "@/lib/services/payments-service";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReceivablesClient } from "./receivables-client";
import {
  CreditCard,
  ArrowLeft,
  AlertTriangle,
  Layers,
  Coins,
} from "lucide-react";

export const metadata = {
  title: "Manajemen Piutang | Casa Moral 3D Printing",
  description: "Tracking saldo piutang berjalan 7 pesanan belum lunas senilai Rp 655.000 dan umur piutang.",
};

export default async function ReceivablesPage() {
  const summary = await getReceivablesSummary();

  const avgReceivable =
    summary.totalReceivableOrdersCount > 0
      ? summary.totalReceivables / summary.totalReceivableOrdersCount
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/orders">
              <Button variant="outline" size="sm" className="gap-1 h-9">
                <ArrowLeft className="w-4 h-4" /> Daftar Pesanan
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                  <CreditCard className="w-5 h-5" />
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Manajemen Piutang (Accounts Receivable)
                </h1>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Monitoring saldo tagihan belum lunas, riwayat umur piutang (aging), dan pencatatan pembayaran kas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Piutang */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Saldo Piutang</span>
              <span className="p-2 rounded-full bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-2">
              {formatRupiah(summary.totalReceivables)}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center justify-between">
              <span>{summary.totalReceivableOrdersCount} Pesanan terdaftar</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">Belum Lunas</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Jumlah Pesanan Belum Lunas */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pesanan Belum Lunas</span>
              <span className="p-2 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-2">
              {summary.totalReceivableOrdersCount} Transaksi
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Termasuk 2 sampel promo (Rp 0)
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Rata-rata Piutang */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Rata-rata Saldo / Order</span>
              <span className="p-2 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <Coins className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-2">
              {formatRupiah(avgReceivable)}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Rata-rata nilai piutang terbuka
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Distribusi Kanal */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Piutang Berdasarkan Kanal</span>
              <span className="p-2 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2 flex items-center gap-2">
              <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                Direct: {formatRupiah(summary.byChannel["Direct"] || 0)}
              </span>
            </div>
            <div className="text-[11px] text-orange-600 dark:text-orange-400 mt-1 font-mono">
              Shopee: {formatRupiah(summary.byChannel["Shopee"] || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Receivables Table */}
      <ReceivablesClient
        initialItems={summary.items}
        totalReceivables={summary.totalReceivables}
      />
    </div>
  );
}
