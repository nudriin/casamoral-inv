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
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { getOrders } from "@/lib/services/orders-service";
import { getExecutiveDashboardMetrics } from "@/lib/services/reports-service";
import { INITIAL_PRODUCTS } from "@/lib/data/initial-data";
import { FinancialIndicatorInfo, FinancialGlossaryModalButton } from "@/components/financial-indicator-guide";
import { RevenueAreaChart, ModelBarChart, RadialProgressRing } from "@/components/ui/bento-charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [dash, orders] = await Promise.all([
    getExecutiveDashboardMetrics(),
    getOrders(),
  ]);

  const recentOrders = orders.slice(0, 5);
  const cashRealizationPct = Number(
    ((dash.kpis.totalCashReceived / (dash.kpis.grossRevenue || 1)) * 100).toFixed(1)
  );

  // Group non-cancelled orders chronologically by date for the Bento trend chart
  const revenueByDate = new Map<string, number>();
  for (const ord of orders) {
    if (ord.status === "CANCELLED") continue;
    const dateKey = (ord.order_date || "").slice(0, 10);
    if (!dateKey) continue;
    revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + (ord.total_amount || 0));
  }
  const revenueTrend = Array.from(revenueByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([dateKey, value]) => ({
      label: dateKey.slice(5),
      value,
    }));

  const sortedModels = [...dash.salesByModel].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-5">
      {/* Top Minimalist Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-zinc-800/70 dark:bg-zinc-900/70">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-orange-500/10 p-2.5 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                Casa Moral 3D Print Studio
              </span>
              {/* <Badge variant="accent">Live Workspace</Badge> */}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Ringkasan omzet, arus kas, progres BEP, dan analitik model lampu dalam satu tampilan Bento.
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

      {/* BENTO GRID ROW 1: Cash & Revenue (5) + Trend Chart (4) + BEP Radial Ring (3) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento Card 1: Total Omzet & Kas Masuk */}
        <Card className="md:col-span-5 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <span>Omzet &amp; Realisasi Kas</span>
              <FinancialIndicatorInfo indicatorKey="pendapatan_kotor" />
            </CardTitle>
            <span className="p-2 rounded-full bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
              <TrendingUp className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <span className="text-[11px] text-zinc-400 block">Total Omzet</span>
                <div className="text-base sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono mt-0.5">
                  {formatRupiah(dash.kpis.grossRevenue)}
                </div>
                <span className="text-[11px] text-zinc-500 mt-0.5 block">
                  <strong className="text-orange-600 dark:text-orange-400">{dash.kpis.totalUnitsSold} unit</strong> • {orders.length} order
                </span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block">Kas Diterima</span>
                <div className="text-base sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono mt-0.5">
                  {formatRupiah(dash.kpis.totalCashReceived)}
                </div>
                <span className="text-[11px] text-zinc-500 mt-0.5 block">
                  <strong className="text-orange-600 dark:text-orange-400">{cashRealizationPct}%</strong> terealisasi
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Progres Kas Masuk vs Omzet</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {cashRealizationPct}%
                </span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, cashRealizationPct)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bento Card 2: Grafik Tren Penjualan */}
        <Card className="md:col-span-4 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <div>
              <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Grafik Tren Omzet Penjualan
              </CardTitle>
              <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-50 mt-0.5">
                {formatRupiah(dash.kpis.netRevenue)}
              </div>
            </div>
            <Badge variant="accent" className="text-[10px]">
              Net Revenue
            </Badge>
          </CardHeader>
          <CardContent className="pt-1">
            <RevenueAreaChart data={revenueTrend} />
          </CardContent>
        </Card>

        {/* Bento Card 3: BEP Radial Ring */}
        <Card className="md:col-span-3 flex flex-col justify-between items-center text-center">
          <CardHeader className="w-full flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-orange-500" />
              <span>Target BEP</span>
            </CardTitle>
            <Badge variant={dash.bepTracking.isBepReached ? "accent" : "secondary"} className="text-[10px]">
              {dash.bepTracking.isBepReached ? "Tercapai" : "Proses"}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-2 pt-0">
            <RadialProgressRing
              percentage={dash.bepTracking.progressPercentage}
              label={`${dash.bepTracking.progressPercentage}%`}
              sublabel={`${dash.bepTracking.currentUnitsSold}/${dash.bepTracking.bepTargetUnits} unit`}
            />
            <Link href="/calculator" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-[11px] h-7">
                Kalkulator BEP <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* BENTO GRID ROW 2: Model Sales Bar Chart (7) + Receivables & Gross Profit Stack (5) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento Card 4: Grafik Penjualan per Model Lampu */}
        <Card className="md:col-span-7 flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="p-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <span>Grafik Penjualan per Model Produk</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Perbandingan omzet &amp; unit terjual untuk setiap model lampu Casa Moral
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              {dash.channelDistribution.slice(0, 3).map((ch) => (
                <Badge key={ch.channel} variant="secondary" className="text-[10px]">
                  {ch.channel}: {ch.orders}
                </Badge>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ModelBarChart items={sortedModels} />
          </CardContent>
        </Card>

        {/* Bento Card 5: Piutang + Laba Kotor + BEP Details */}
        <div className="md:col-span-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <span>Piutang Usaha</span>
                  <FinancialIndicatorInfo indicatorKey="piutang_usaha" />
                </CardTitle>
                <span className="p-1.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  {formatRupiah(dash.kpis.totalReceivables)}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-zinc-500">
                    {dash.criticalReceivablesCount} belum lunas
                  </span>
                  <Link href="/orders/receivables" className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline">
                    Kelola &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <span>Laba Kotor</span>
                  <FinancialIndicatorInfo indicatorKey="laba_kotor" />
                </CardTitle>
                <span className="p-1.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Coins className="h-3.5 w-3.5" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
                  {formatRupiah(dash.kpis.grossProfit)}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Margin: <strong className="text-orange-600 dark:text-orange-400">{dash.kpis.grossMarginPct}%</strong>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-zinc-400 text-[10px]">Overhead / Bln</div>
                <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatRupiah(dash.bepTracking.monthlyFixedOverhead)}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[10px]">Target BEP Omzet</div>
                <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {formatRupiah(dash.bepTracking.bepTargetRevenue)}
                </div>
              </div>
              <div>
                <div className="text-zinc-400 text-[10px]">Margin / Unit</div>
                <div className="font-mono font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                  {formatRupiah(dash.bepTracking.unitContributionMargin)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BENTO GRID ROW 3: Katalog Produk HPP (6) + Aktivitas Pesanan Terkini (6) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Card: Model Lampu Ambient */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <CardTitle className="text-sm font-semibold">Katalog Produk &amp; HPP</CardTitle>
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
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
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

        {/* Card: Transaksi Pesanan Terkini */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <CardTitle className="text-sm font-semibold">Aktivitas Pesanan Terkini</CardTitle>
              <CardDescription className="text-xs">Transaksi omnichannel (Direct WhatsApp &amp; Shopee)</CardDescription>
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
                      variant={ord.payment_status === "PAID" ? "secondary" : "warning"}
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
    </div>
  );
}
