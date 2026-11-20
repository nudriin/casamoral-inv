import React from "react";
import Link from "next/link";
import { getOrders, getOrderSummaryStats } from "@/lib/services/orders-service";
import { getProducts } from "@/lib/services/products-service";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrderListClient } from "./order-list-client";
import {
  ShoppingCart,
  Plus,
  Coins,
  CreditCard,
  Layers,
} from "lucide-react";

export const metadata = {
  title: "Manajemen Pesanan | Casa Moral 3D Printing",
  description: "Daftar pesanan omnichannel, kustomisasi variasi warna, add-on, dan tracking siklus produksi.",
};

export default async function OrdersPage() {
  const [orders, stats, products] = await Promise.all([
    getOrders(),
    getOrderSummaryStats(),
    getProducts(false),
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Manajemen Pesanan (Orders)
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pencatatan pesanan omnichannel (Direct, Shopee, TikTok Shop, Tokopedia), kustomisasi warna, add-on, dan tracking produksi studio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/orders/new">
            <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold shadow-xs">
              <Plus className="w-4 h-4" /> Buat Pesanan Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Volume */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Total Volume Pesanan</span>
              <span className="p-1.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <ShoppingCart className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
              {formatRupiah(stats.totalRevenue)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>{stats.totalOrders} Transaksi tercatat</span>
              <span className="text-amber-600 font-medium">9 Unit Model</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Realisasi Kas */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Kas Masuk (Lunas)</span>
              <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Coins className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
              {formatRupiah(stats.totalPaid)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>2 Pesanan terverifikasi</span>
              <span className="text-emerald-600 font-semibold">
                {((stats.totalPaid / (stats.totalRevenue || 1)) * 100).toFixed(1)}% Realisasi
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Piutang Berjalan */}
        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Piutang Berjalan (Belum Lunas)</span>
              <span className="p-1.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
              {formatRupiah(stats.totalReceivables)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>7 Pesanan belum lunas</span>
              <span className="text-rose-600 font-medium">Konsinyasi / Teman</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Omnichannel Breakdown */}
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Kanal Penjualan</span>
              <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-2 flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {stats.channelCounts["Direct"] || 0} Direct
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">
                {stats.channelCounts["Shopee"] || 0} Shopee
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">
                {stats.channelCounts["TikTokShop"] || 0} TikTok
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {stats.channelCounts["Tokopedia"] || 0} Tokped
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>Omnichannel Marketplace & Direct</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Orders Table & Client Filter */}
      <OrderListClient initialOrders={orders} products={products} />
    </div>
  );
}
