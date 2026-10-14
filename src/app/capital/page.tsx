import { getCapitalPurchases, getAssets, getCapitalSummary } from "@/lib/services/capital-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { Printer, Wrench, Plus } from "lucide-react";

export default async function CapitalPage() {
  const purchases = await getCapitalPurchases();
  const assets = await getAssets();
  const summary = await getCapitalSummary();

  return (
    <DashboardShell
      title="Modal Usaha & Aset Tetap"
      subtitle="Pencatatan investasi mesin 3D printer, peralatan studio, dan belanja modal awal Rp 11.440.748"
    >
      <div className="space-y-6">
        {/* Top Summary KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
                Total Modal Awal Usaha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
                {formatRupiah(summary.totalCapital)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">23 transaksi belanja awal (Tabel 3 Excel)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500">Nilai Aset Mesin Cetak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatRupiah(9462021)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Bambu Lab A1 Mini + Anycubic Kobra X</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500">Persediaan Bahan & Kemasan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatRupiah(1884228)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Filamen 10 roll, kelistrikan, kardus</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500">Peralatan Studio (Tools)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatRupiah(94499)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Jangka sorong & magnet neodium</p>
            </CardContent>
          </Card>
        </div>

        {/* Capital Category Breakdown Visual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Komposisi Alokasi Modal Awal</CardTitle>
            <CardDescription>
              Pemisahan aset tetap (mesin printer), persediaan (filamen/komponen), dan alat kerja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {summary.breakdown.map((b) => (
                <div
                  key={b.category}
                  className="rounded-lg bg-zinc-50 dark:bg-zinc-900/60 p-3 border border-zinc-200/60 dark:border-zinc-800/60"
                >
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block line-clamp-1">
                    {b.label}
                  </span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block mt-0.5">
                    {formatRupiah(b.totalCost)}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2">
                    <span>{b.itemCount} Item</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {b.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${b.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Fixed Assets Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Aset Mesin 3D Printer & Peralatan</CardTitle>
              <CardDescription>Daftar mesin cetak yang mendasari kapasitas produksi studio</CardDescription>
            </div>
            <Button size="sm" variant="accent" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Tambah Aset
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-y border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nama Aset</th>
                    <th className="py-3 px-4 font-semibold">Kategori</th>
                    <th className="py-3 px-4 font-semibold text-right">Harga Perolehan</th>
                    <th className="py-3 px-4 font-semibold text-right">Nilai Residu</th>
                    <th className="py-3 px-4 font-semibold text-center">Umur Ekonomis</th>
                    <th className="py-3 px-4 font-semibold text-right">Daya (Watt)</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {assets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30">
                      <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {asset.category === "printer_3d" ? (
                          <Printer className="h-4 w-4 text-amber-600" />
                        ) : (
                          <Wrench className="h-4 w-4 text-zinc-500" />
                        )}
                        {asset.name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {asset.category.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(asset.purchase_price)}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-500">
                        {formatRupiah(asset.residual_value)}
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-600 dark:text-zinc-400">
                        {asset.useful_life_months} Bulan
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-zinc-700 dark:text-zinc-300">
                        {asset.power_watts > 0 ? `${asset.power_watts} W` : "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="success" className="text-[10px]">
                          {asset.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Initial Capital Purchases Log (23 Items) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Buku Catatan Belanja Modal Awal (23 Item)
                </CardTitle>
                <CardDescription>
                  Rincian transaksi riil via marketplace Shopee termasuk biaya layanan platform Rp 2.000
                </CardDescription>
              </div>
              <Badge variant="accent" className="font-mono text-xs">
                Total: {formatRupiah(summary.totalCapital)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 z-10">
                  <tr>
                    <th className="py-3 px-4 font-semibold w-12 text-center">No</th>
                    <th className="py-3 px-4 font-semibold">Nama Barang / Transaksi</th>
                    <th className="py-3 px-4 font-semibold">Kategori</th>
                    <th className="py-3 px-4 font-semibold text-right">Harga Satuan</th>
                    <th className="py-3 px-4 font-semibold text-center">Jumlah</th>
                    <th className="py-3 px-4 font-semibold text-right">Biaya Layanan</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {purchases.map((item, index) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-center text-zinc-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-right text-zinc-600 dark:text-zinc-400">
                        {formatRupiah(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold text-zinc-800 dark:text-zinc-200">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-4 text-right text-zinc-500">
                        {formatRupiah(item.serviceFee)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(item.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
