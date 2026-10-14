import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Package,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Banknote,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { getOrders, getOrderSummaryStats } from "@/lib/services/orders-service";
import { INITIAL_PRODUCTS, INITIAL_CAPITAL_PURCHASES } from "@/lib/data/initial-data";

export default async function DashboardPage() {
  const [orders, stats] = await Promise.all([
    getOrders(),
    getOrderSummaryStats(),
  ]);

  const initialCapital = INITIAL_CAPITAL_PURCHASES.reduce((sum, item) => sum + item.totalCost, 0);
  const fixedAssetsVal = 9462021; // Bambulab + Anycubic
  const recentOrders = orders.slice(0, 5);
  return (
    <DashboardShell
      title="Ringkasan Eksekutif & Operasional"
      subtitle="Monitoring Finansial, Produksi, dan Inventaris Studio Casa Moral"
    >
      <div className="space-y-6">
        {/* Sprint 1 System Readiness Alert */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 dark:border-amber-500/20">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Fondasi Sistem Sprint 1 Aktif
                </span>
                <Badge variant="accent">Production Ready</Badge>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Next.js App Router, TypeScript strict mode, skema migrasi database PostgreSQL, dan aturan RLS telah terkonfigurasi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/products">
              <Button size="sm" variant="outline" className="text-xs">
                Katalog Produk
              </Button>
            </Link>
            <Link href="/orders">
              <Button size="sm" variant="accent" className="text-xs">
                Kelola Pesanan
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial KPI Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* KPI 1: Total Omzet Pesanan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Total Omzet Pesanan
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                {formatRupiah(stats.totalRevenue)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <span className="font-semibold text-emerald-600">{stats.totalOrders} transaksi</span> tercatat di sistem
              </p>
            </CardContent>
          </Card>

          {/* KPI 2: Kas Masuk yang Diterima */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Kas Riil Diterima
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {formatRupiah(stats.totalPaid)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                {((stats.totalPaid / (stats.totalRevenue || 1)) * 100).toFixed(1)}% Realisasi pembayaran
              </p>
            </CardContent>
          </Card>

          {/* KPI 3: Piutang Pelanggan (Belum Lunas) */}
          <Card className="border-amber-200/80 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Piutang Berjalan
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-amber-700 dark:text-amber-400 font-mono">
                {formatRupiah(stats.totalReceivables)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                7 pesanan belum lunas (Rp 655.000)
              </p>
            </CardContent>
          </Card>

          {/* KPI 4: Modal Usaha & Aset Mesin */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Total Modal Awal
              </CardTitle>
              <Banknote className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                {formatRupiah(initialCapital)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Mesin printer 3D: <span className="font-semibold">{formatRupiah(fixedAssetsVal)}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two-Column Grid: Products HPP vs Recent Orders */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card: 4 Model Lampu Ambient */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Katalog Produk & HPP</CardTitle>
                <CardDescription>Model lampu ambient terdaftar dengan acuan HPP aktual</CardDescription>
              </div>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Semua Produk <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {INITIAL_PRODUCTS.map((product) => (
                  <div key={product.sku} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {product.bom.totalFilamentGram}g filamen • HPP: {formatRupiah(product.current_hpp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatRupiah(product.selling_price)}
                      </div>
                      <Badge variant="accent" className="text-[10px] py-0">
                        Markup {product.markup_percent}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card: Transaksi Pesanan Awal */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Aktivitas Pesanan Terkini</CardTitle>
                <CardDescription>Transaksi omnichannel (Direct WhatsApp & Shopee)</CardDescription>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Semua Pesanan <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {ord.customer?.name}
                        </span>
                        <span className="text-[10px] text-zinc-400">• {ord.channel}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {ord.items?.[0]?.color_details || "Pesanan Lampu"}
                        {ord.items?.[0]?.add_on_name && ` (${ord.items[0].add_on_name})`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatRupiah(ord.total_amount)}
                      </div>
                      <Badge
                        variant={ord.payment_status === "PAID" ? "success" : "warning"}
                        className="text-[10px] py-0 mt-0.5"
                      >
                        {ord.payment_status === "PAID" ? "Lunas" : "Belum Lunas"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section: Sprint Roadmap & Architecture Status */}
        <Card className="bg-zinc-900 text-zinc-50 dark:bg-zinc-900/90 border-zinc-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-zinc-100 text-sm">Status Eksekusi Sprint</CardTitle>
                <CardDescription className="text-zinc-400">
                  Implementasi bertahap sesuai spesifikasi master prompt
                </CardDescription>
              </div>
              <Badge variant="accent">Sprint 4 Selesai</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-2 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 0: Discovery
                </div>
                <p className="text-zinc-400 text-[11px]">Audit 3 Excel & spesifikasi formula finansial tuntas.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-2 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 1: Foundation
                </div>
                <p className="text-zinc-400 text-[11px]">Next.js App Router, Supabase Schema & RLS terpasang.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-2 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 2: Data Import
                </div>
                <p className="text-zinc-400 text-[11px]">Master produk lampu & modal awal Rp11.4M tervalidasi.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-2 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 3: Calc Engine
                </div>
                <p className="text-zinc-400 text-[11px]">Engine HPP standar/slicer, Markup, Margin & BEP.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-amber-500/40">
                <div className="flex items-center gap-2 font-medium text-amber-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 4: Orders
                </div>
                <p className="text-zinc-400 text-[11px]">Omnichannel, snapshot HPP & state machine produksi.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

