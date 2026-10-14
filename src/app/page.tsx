import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Package,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Banknote,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";

// Verified business figures from discovery audit (HPP CASA MORAL V2 & Orderan Casa Moral)
const SUMMARY_STATS = {
  totalOrderVolume: 945000,   // Total volume pesanan (Omzet kotor)
  realizedCash: 290000,       // Uang kas yang benar-benar lunas
  unpaidReceivables: 655000,  // Piutang pesanan belum lunas
  unitsSold: 9,               // Total 9 unit pesanan
  initialCapital: 11440748,   // Modal awal (23 item belanja)
  fixedAssetsVal: 9462021,    // Aset mesin printer
};

const PRODUCTS_PREVIEW = [
  { name: "Lampu Ambient - Lumi", sku: "CM-LUMI-01", filamentGram: 166.4, hpp: 81182.4, price: 120000, markup: "50%" },
  { name: "Lampu Ambient - Ollie", sku: "CM-OLLIE-01", filamentGram: 203.08, hpp: 89705.28, price: 130000, markup: "50%" },
  { name: "Lampu Ambient - Kumo", sku: "CM-KUMO-01", filamentGram: 170.13, hpp: 82588.08, price: 125000, markup: "50%" },
  { name: "Lampu Ambient - Pomi", sku: "CM-POMI-01", filamentGram: 268.76, hpp: 103892.16, price: 150000, markup: "50%" },
];

const RECENT_ORDERS_PREVIEW = [
  { customer: "Wahyu", product: "Ollie", details: "Base Oren + Shade Putih + Cap Lee Jeno", amount: 160000, channel: "Direct", status: "Lunas" },
  { customer: "Mama", product: "Ollie", details: "Base Oren + Shade Putih (No Cap)", amount: 130000, channel: "Direct", status: "Lunas" },
  { customer: "Mahput", product: "Ollie", details: "Base Pink + Shade Putih + Cap Putih", amount: 130000, channel: "Shopee", status: "Belum Lunas" },
  { customer: "Gress", product: "Ollie", details: "Base Oren + Shade Putih + Cap Oren", amount: 115000, channel: "Direct", status: "Belum Lunas" },
  { customer: "Acil Ely", product: "Ollie", details: "Base Oren + Shade Putih + Cap Oren", amount: 130000, channel: "Direct", status: "Belum Lunas" },
];

export default function DashboardPage() {
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
              <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatRupiah(SUMMARY_STATS.totalOrderVolume)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <span className="font-semibold text-emerald-600">{SUMMARY_STATS.unitsSold} unit</span> terpesan dari 9 transaksi
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
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {formatRupiah(SUMMARY_STATS.realizedCash)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                2 pesanan telah lunas (30.7% omzet)
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
              <div className="text-xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
                {formatRupiah(SUMMARY_STATS.unpaidReceivables)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                7 pesanan belum lunas (69.3% omzet)
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
              <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {formatRupiah(SUMMARY_STATS.initialCapital)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Mesin printer 3D: <span className="font-semibold">{formatRupiah(SUMMARY_STATS.fixedAssetsVal)}</span>
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
                {PRODUCTS_PREVIEW.map((product) => (
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
                          {product.filamentGram}g filamen • HPP: {formatRupiah(product.hpp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(product.price)}
                      </div>
                      <Badge variant="accent" className="text-[10px] py-0">
                        Markup {product.markup}
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
                {RECENT_ORDERS_PREVIEW.map((order, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {order.customer}
                        </span>
                        <span className="text-[10px] text-zinc-400">• {order.channel}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {order.details}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(order.amount)}
                      </div>
                      <Badge
                        variant={order.status === "Lunas" ? "success" : "warning"}
                        className="text-[10px] py-0 mt-0.5"
                      >
                        {order.status}
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
              <Badge variant="accent">Sprint 1 Selesai</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-2 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 0: Discovery
                </div>
                <p className="text-zinc-400 text-[11px]">Audit 3 Excel & spesifikasi formula finansial tuntas.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-amber-500/40">
                <div className="flex items-center gap-2 font-medium text-amber-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 1: Foundation
                </div>
                <p className="text-zinc-400 text-[11px]">Next.js App Router, Supabase Schema & RLS terpasang.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 p-3 border border-zinc-800 text-zinc-400">
                <div className="flex items-center gap-2 font-medium text-zinc-300 mb-1">
                  <Clock className="h-4 w-4" /> Sprint 2: Data Import
                </div>
                <p className="text-zinc-500 text-[11px]">Migrasi master produk lampu & modal awal Rp11.4M.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/30 p-3 border border-zinc-800 text-zinc-400">
                <div className="flex items-center gap-2 font-medium text-zinc-300 mb-1">
                  <Clock className="h-4 w-4" /> Sprint 3: Calculation Engine
                </div>
                <p className="text-zinc-500 text-[11px]">Modul murni kalkulasi HPP, margin & BEP dengan test suite.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
