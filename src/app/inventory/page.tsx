import { getMaterials, getMaterialsSummary, getStockMovements } from "@/lib/services/materials-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatNumber, formatDateIndo } from "@/lib/utils";
import { Plus, ArrowUpDown } from "lucide-react";

export default async function InventoryPage() {
  const [materials, summary, movements] = await Promise.all([
    getMaterials(),
    getMaterialsSummary(),
    getStockMovements(),
  ]);

  return (
    <DashboardShell
      title="Master Bahan Baku & Stok"
      subtitle="Manajemen persediaan filamen, komponen perakitan lampu, dan bahan kemasan"
    >
      <div className="space-y-6">
        {/* Summary Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500">Total Jenis Bahan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {summary.totalItems} Komponen
              </div>
              <p className="text-xs text-zinc-500 mt-1">Filamen, kelistrikan, & packaging</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500">Total Stok Filamen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {summary.filamentStockKg.toFixed(1)} kg
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {formatNumber(summary.filamentStockKg * 1000)} gram siap pakai
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-500">Status Persediaan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant={summary.lowStockCount === 0 ? "success" : "warning"} className="text-sm px-2.5 py-0.5">
                  {summary.lowStockCount === 0 ? "Seluruh Stok Aman" : `${summary.lowStockCount} Menipis`}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Berdasarkan batas minimum alert</p>
            </CardContent>
          </Card>
        </div>

        {/* Materials Table Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-base font-bold">Daftar Bahan Baku & Komponen</CardTitle>
              <CardDescription>
                Basis data acuan untuk kalkulasi HPP dan pemotongan stok otomatis saat produksi
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <ArrowUpDown className="h-3.5 w-3.5" /> Mutasi Stok
              </Button>
              <Button size="sm" variant="accent" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Tambah Bahan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border-y border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nama Bahan / Komponen</th>
                    <th className="py-3 px-4 font-semibold">Kategori</th>
                    <th className="py-3 px-4 font-semibold text-right">Stok Saat Ini</th>
                    <th className="py-3 px-4 font-semibold text-right">Batas Alert</th>
                    <th className="py-3 px-4 font-semibold text-right">Biaya Satuan</th>
                    <th className="py-3 px-4 font-semibold">Pemasok / Toko</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {materials.map((item) => {
                    const isLow = item.current_stock <= item.min_stock_alert;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-zinc-800 dark:text-zinc-200">
                          {formatNumber(item.current_stock)} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-500">
                          {formatNumber(item.min_stock_alert)} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                          {formatRupiah(item.cost_per_unit)}
                          <span className="text-[10px] text-zinc-400 block font-normal">
                            /{item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400">
                          {item.supplier || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <Badge variant="warning" className="text-[10px]">
                              Menipis
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              Aman
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stock Movements Audit Trail Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-amber-500" />
                Kartu Stok & Riwayat Mutasi Bahan Baku
              </CardTitle>
              <CardDescription>
                Audit log real-time mutasi persediaan: pengadaan awal modal, pemotongan otomatis produksi, dan pengembalian
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              {movements.length} Catatan Mutasi
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Waktu Mutasi</th>
                    <th className="py-3 px-4 font-semibold">Tipe Mutasi</th>
                    <th className="py-3 px-4 font-semibold">Bahan / Komponen</th>
                    <th className="py-3 px-4 font-semibold text-right">Volume Mutasi</th>
                    <th className="py-3 px-4 font-semibold">Keterangan / Referensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {movements.map((mov) => {
                    const isPositive = mov.quantity > 0;
                    const mat = materials.find((m) => m.id === mov.material_id);

                    return (
                      <tr
                        key={mov.id}
                        className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-zinc-500">
                          {formatDateIndo(mov.created_at)}
                        </td>

                        <td className="py-3 px-4">
                          {mov.movement_type === "PRODUCTION_USAGE" && (
                            <Badge variant="warning" className="text-[10px]">
                              Pemakaian Produksi
                            </Badge>
                          )}
                          {mov.movement_type === "PURCHASE" && (
                            <Badge variant="success" className="text-[10px]">
                              Pengadaan / Pembelian
                            </Badge>
                          )}
                          {mov.movement_type === "RETURN" && (
                            <Badge variant="secondary" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400">
                              Pengembalian (Batal)
                            </Badge>
                          )}
                          {mov.movement_type === "WASTE_ADJUSTMENT" && (
                            <Badge variant="destructive" className="text-[10px]">
                              Penyusutan / Gagal
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {mat?.name || mov.material_id}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span
                            className={
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }
                          >
                            {isPositive ? `+${formatNumber(mov.quantity)}` : formatNumber(mov.quantity)}{" "}
                            {mat?.unit}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 italic">
                          {mov.notes || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

