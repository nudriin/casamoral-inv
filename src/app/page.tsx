import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  Package,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Coins,
  FileSpreadsheet,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { getOrders } from "@/lib/services/orders-service";
import { getExecutiveDashboardMetrics } from "@/lib/services/reports-service";
import { INITIAL_PRODUCTS } from "@/lib/data/initial-data";
import { FinancialIndicatorInfo, FinancialGlossaryModalButton } from "@/components/financial-indicator-guide";

export default async function DashboardPage() {
  const [dash, orders] = await Promise.all([
    getExecutiveDashboardMetrics(),
    getOrders(),
  ]);

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
        {/* Sprint 6 System Completion Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 dark:border-amber-500/20">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Sistem Akuntansi & Manajemen Casa Moral
                </span>
                <Badge variant="accent">Production Ready</Badge>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Laba Rugi, Arus Kas Metode Langsung, Analitik Produk, Utang Cicilan, dan Ekspor Spreadsheet telah terintegrasi.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FinancialGlossaryModalButton />
            <Link href="/reports">
              <Button size="sm" variant="accent" className="text-xs gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Pusat Laporan
              </Button>
            </Link>
            <Link href="/orders">
              <Button size="sm" variant="outline" className="text-xs">
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
              <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>Total Omzet Penjualan</span>
                <FinancialIndicatorInfo indicatorKey="pendapatan_kotor" />
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                {formatRupiah(dash.kpis.grossRevenue)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                <span className="font-semibold text-emerald-600">{dash.kpis.totalUnitsSold} unit</span> terjual dari {orders.length} pesanan
              </p>
            </CardContent>
          </Card>

          {/* KPI 2: Kas Riil Diterima */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>Kas Riil Diterima</span>
                <FinancialIndicatorInfo indicatorKey="arus_kas_masuk" />
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                {formatRupiah(dash.kpis.totalCashReceived)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                {((dash.kpis.totalCashReceived / (dash.kpis.grossRevenue || 1)) * 100).toFixed(1)}% Realisasi pembayaran kas
              </p>
            </CardContent>
          </Card>

          {/* KPI 3: Piutang Pelanggan */}
          <Card className="border-amber-200/80 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span>Piutang Usaha Berjalan</span>
                <FinancialIndicatorInfo indicatorKey="piutang_usaha" />
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-amber-700 dark:text-amber-400 font-mono">
                {formatRupiah(dash.kpis.totalReceivables)}
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-zinc-500">
                  {dash.criticalReceivablesCount} pesanan belum lunas
                </span>
                <Link href="/orders/receivables" className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline">
                  Kelola &rarr;
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* KPI 4: Laba Kotor (Gross Profit) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>Laba Kotor (Gross Profit)</span>
                <FinancialIndicatorInfo indicatorKey="laba_kotor" />
              </CardTitle>
              <Coins className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                {formatRupiah(dash.kpis.grossProfit)}
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Margin Kotor: <strong className="text-amber-600">{dash.kpis.grossMarginPct}%</strong>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Break-Even Point (BEP) & Payback Progress Tracker */}
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  <span>Target Break-Even Point (BEP) Bulanan Studio</span>
                  <FinancialIndicatorInfo indicatorKey="bep" />
                </CardTitle>
                <CardDescription className="text-xs text-zinc-500">
                  Beban Tetap Bulanan: <strong>{formatRupiah(dash.bepTracking.monthlyFixedOverhead)}</strong> (Sewa tempat, Internet/WiFi, Amortisasi)
                </CardDescription>
              </div>
              <Link href="/calculator">
                <Button variant="outline" size="sm" className="text-xs gap-1 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300">
                  Simulasi Kalkulator BEP <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-700 dark:text-zinc-300">
                  Progres Volume Penjualan Menuju Impas:{" "}
                  <strong>{dash.bepTracking.currentUnitsSold}</strong> / {dash.bepTracking.bepTargetUnits} Unit
                </span>
                <span className="font-mono text-amber-600 font-bold">
                  {dash.bepTracking.progressPercentage}% Tercapai
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, dash.bepTracking.progressPercentage)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-zinc-200/70 dark:border-zinc-800">
              <div>
                <div className="text-zinc-400 text-[11px]">Target BEP Omzet:</div>
                <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatRupiah(dash.bepTracking.bepTargetRevenue)}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Margin Kontribusi / Unit:</div>
                <div className="font-mono font-semibold text-emerald-600 mt-0.5">
                  {formatRupiah(dash.bepTracking.unitContributionMargin)}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Sisa Unit ke BEP:</div>
                <div className="font-mono font-semibold text-amber-600 mt-0.5">
                  {dash.bepTracking.remainingUnitsToBep} Unit lagi
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[11px]">Status Titik Impas:</div>
                <div className="mt-0.5">
                  <Badge variant={dash.bepTracking.isBepReached ? "success" : "warning"} className="text-[10px]">
                    {dash.bepTracking.isBepReached ? "BEP Tercapai" : "Fase Akselerasi"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-Column Grid: Products HPP vs Recent Orders */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card: 4 Model Lampu Ambient */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <CardTitle className="text-sm font-semibold">Katalog Produk & HPP</CardTitle>
                <CardDescription className="text-xs">Model lampu ambient terdaftar dengan acuan HPP aktual</CardDescription>
              </div>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Semua Produk <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {INITIAL_PRODUCTS.map((product) => (
                  <div key={product.sku} className="flex items-center justify-between py-2.5">
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
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <CardTitle className="text-sm font-semibold">Aktivitas Pesanan Terkini</CardTitle>
                <CardDescription className="text-xs">Transaksi omnichannel (Direct WhatsApp & Shopee)</CardDescription>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Semua Pesanan <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-4">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {ord.customer?.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">• {ord.channel}</span>
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
                <CardTitle className="text-zinc-100 text-sm">Status Roadmap Implementasi Sistem</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Progres bertahap sesuai spesifikasi master prompt proyek
                </CardDescription>
              </div>
              <Badge variant="accent">Sprint 6 Selesai</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 text-xs">
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 0-1
                </div>
                <p className="text-zinc-400 text-[11px]">Audit Excel, Next.js App Router & Supabase Schema.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 2: Data
                </div>
                <p className="text-zinc-400 text-[11px]">Master produk lampu & modal awal Rp11.4M terverifikasi.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 3: Calc
                </div>
                <p className="text-zinc-400 text-[11px]">Engine HPP standar/slicer, Markup, Margin & BEP.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 4: Orders
                </div>
                <p className="text-zinc-400 text-[11px]">Omnichannel, snapshot HPP & state machine produksi.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 font-medium text-emerald-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 5: Ops
                </div>
                <p className="text-zinc-400 text-[11px]">Pencatatan kas, piutang Rp655k, mutasi stok & beban.</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-3 border border-amber-500/50">
                <div className="flex items-center gap-1.5 font-medium text-amber-400 mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Sprint 6: Reports
                </div>
                <p className="text-zinc-400 text-[11px]">Laba Rugi, Arus Kas, Analitik Produk & Ekspor CSV.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
