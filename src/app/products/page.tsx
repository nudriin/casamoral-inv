import { getProducts } from "@/lib/services/products-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { Plus, Ruler, Box, Layers } from "lucide-react";

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <DashboardShell
      title="Master Produk & Bill of Materials (BOM)"
      subtitle="Katalog model lampu 3D print, parameter gramatur, kalkulasi HPP, dan markup harga"
    >
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Katalog Model Lampu Ambient
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Data terverifikasi dari Tabel 2 & 4 spreadsheet HPP CASA MORAL V2
            </p>
          </div>
          <Button size="sm" variant="accent" className="gap-1.5 text-xs font-semibold self-start sm:self-auto">
            <Plus className="h-4 w-4" /> Tambah Model Baru
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
          {products.map((product) => {
            const marginPercent = ((product.selling_price - product.current_hpp) / product.selling_price) * 100;

            return (
              <Card key={product.id} className="overflow-hidden border-zinc-200/90 dark:border-zinc-800/90">
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/30 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Box className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold">{product.name}</CardTitle>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {product.sku}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-1 mt-0.5">
                          {product.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="accent" className="text-xs font-semibold shrink-0">
                      Aktif
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-5 space-y-5">
                  {/* Technical Dimensions Bar */}
                  {product.dimensions && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-50 p-2.5 text-[11px] text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-800/60">
                      <div className="flex items-center gap-1">
                        <Ruler className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Tinggi Total: <strong>{product.dimensions.total_height_mm} mm</strong></span>
                      </div>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <div>
                        <span>Lebar: <strong>{product.dimensions.shade_width_mm} mm</strong></span>
                      </div>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <div>
                        <span>Shade H: <strong>{product.dimensions.shade_height_mm} mm</strong></span>
                      </div>
                      {product.dimensions.base_height_mm && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <div>
                            <span>Base H: <strong>{product.dimensions.base_height_mm} mm</strong></span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Bill of Materials (BOM) Breakdown */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-amber-600" />
                        Rincian Komponen Cetak & Filamen
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 font-bold">
                        {product.bom.totalFilamentGram} gram
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/40 p-2 border border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-[10px] text-zinc-500 block">Shade</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{product.bom.shadeGram} g</span>
                      </div>
                      <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/40 p-2 border border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-[10px] text-zinc-500 block">Base</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{product.bom.baseGram} g</span>
                      </div>
                      <div className="rounded-md bg-zinc-50 dark:bg-zinc-800/40 p-2 border border-zinc-200/60 dark:border-zinc-800/60">
                        <span className="text-[10px] text-zinc-500 block">Cap Atas</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{product.bom.capGram} g</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Elements Breakdown */}
                  <div className="space-y-1.5 text-xs border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Biaya Filamen (@ Rp 180/g)</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {formatRupiah(product.bom.filamentCost, true)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Komponen Listrik (Fitting, LED 3W, Sakelar)</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {formatRupiah(product.bom.electricalCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Kemasan (Kardus + Bubble Wrap)</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {formatRupiah(product.bom.packagingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Faktor Listrik & Depresiasi Mesin</span>
                      <span className="font-semibold text-amber-600">
                        Multiplier {product.standard_overhead_multiplier}x (+20%)
                      </span>
                    </div>
                  </div>

                  {/* Financial Summary Highlight */}
                  <div className="rounded-xl bg-zinc-900 p-4 text-zinc-50 dark:bg-zinc-950 dark:border dark:border-zinc-800">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div>
                        <span className="text-[11px] text-zinc-400 block uppercase tracking-wider font-medium">
                          Total HPP Produksi
                        </span>
                        <span className="text-lg font-bold text-amber-400">
                          {formatRupiah(product.current_hpp, true)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-zinc-400 block uppercase tracking-wider font-medium">
                          Harga Jual Aktual
                        </span>
                        <span className="text-lg font-bold text-zinc-100">
                          {formatRupiah(product.selling_price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <span>Markup:</span>
                        <Badge variant="accent" className="font-semibold text-[10px]">
                          +{product.markup_percent}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <span>Margin Sejati:</span>
                        <Badge variant="success" className="font-semibold text-[10px]">
                          {marginPercent.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
