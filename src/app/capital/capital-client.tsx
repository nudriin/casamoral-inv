"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRupiah } from "@/lib/utils";
import { Printer, Wrench, Plus, Search, Edit2, Trash2, X, CheckCircle, AlertCircle, ShoppingBag } from "lucide-react";
import { Asset } from "@/types/database";
import { CapitalPurchaseItem } from "@/lib/data/initial-data";
import { CapitalBreakdown } from "@/lib/services/capital-service";
import {
  createAssetAction,
  updateAssetAction,
  deleteAssetAction,
  createCapitalPurchaseAction,
  updateCapitalPurchaseAction,
  deleteCapitalPurchaseAction,
} from "./actions";

interface CapitalClientProps {
  initialPurchases: CapitalPurchaseItem[];
  initialAssets: Asset[];
  initialSummary: {
    totalCapital: number;
    totalItems: number;
    breakdown: CapitalBreakdown[];
  };
}

export function CapitalClient({ initialPurchases, initialAssets, initialSummary }: CapitalClientProps) {
  const [purchases, setPurchases] = useState<CapitalPurchaseItem[]>(initialPurchases);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [summary, setSummary] = useState(initialSummary);

  const [searchPurchase, setSearchPurchase] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<CapitalPurchaseItem | null>(null);

  // Status & feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Recalculate summary helper
  const updateLocalSummary = (newPurchases: CapitalPurchaseItem[]) => {
    const totalAmount = newPurchases.reduce((sum, item) => sum + item.totalCost, 0);
    const categories: Record<string, { label: string; total: number; count: number }> = {
      MESIN: { label: "Mesin 3D Printer", total: 0, count: 0 },
      FILAMEN: { label: "Stok Filamen (Bahan Baku)", total: 0, count: 0 },
      KELISTRIKAN: { label: "Komponen Kelistrikan & Lampu", total: 0, count: 0 },
      KEMASAN: { label: "Kemasan & Packaging", total: 0, count: 0 },
      ALAT: { label: "Peralatan & Tools", total: 0, count: 0 },
      OPERASIONAL: { label: "Iklan, Software & Operasional", total: 0, count: 0 },
    };

    newPurchases.forEach((item) => {
      if (categories[item.category]) {
        categories[item.category].total += item.totalCost;
        categories[item.category].count += 1;
      }
    });

    const breakdown: CapitalBreakdown[] = Object.entries(categories).map(([category, val]) => ({
      category,
      label: val.label,
      totalCost: val.total,
      itemCount: val.count,
      percentage: totalAmount > 0 ? (val.total / totalAmount) * 100 : 0,
    }));

    setSummary({
      totalCapital: totalAmount,
      totalItems: newPurchases.length,
      breakdown,
    });
  };

  // Asset submit handler
  const handleAssetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);

    if (editingAsset) {
      const res = await updateAssetAction(editingAsset.id, formData);
      if (res.success) {
        setAssets((prev) => prev.map((a) => (a.id === editingAsset.id ? res.data : a)));
        setFeedback({ type: "success", message: "Aset berhasil diperbarui!" });
        setIsAssetModalOpen(false);
        setEditingAsset(null);
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    } else {
      const res = await createAssetAction(formData);
      if (res.success) {
        setAssets((prev) => [res.data, ...prev]);
        setFeedback({ type: "success", message: "Aset baru berhasil ditambahkan!" });
        setIsAssetModalOpen(false);
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    }
    setIsSubmitting(false);
  };

  // Delete asset
  const handleDeleteAsset = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus aset "${name}"?`)) return;
    const res = await deleteAssetAction(id);
    if (res.success) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setFeedback({ type: "success", message: `Aset ${name} berhasil dihapus.` });
    } else {
      setFeedback({ type: "error", message: res.error });
    }
  };

  // Capital purchase submit handler (Create / Edit)
  const handlePurchaseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);

    if (editingPurchase) {
      const res = await updateCapitalPurchaseAction(editingPurchase.id, formData);
      if (res.success) {
        const nextPurchases = purchases.map((p) => (p.id === editingPurchase.id ? res.data : p));
        setPurchases(nextPurchases);
        updateLocalSummary(nextPurchases);
        setFeedback({ type: "success", message: "Transaksi belanja modal berhasil diperbarui!" });
        setIsPurchaseModalOpen(false);
        setEditingPurchase(null);
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    } else {
      const res = await createCapitalPurchaseAction(formData);
      if (res.success) {
        const nextPurchases = [res.data, ...purchases];
        setPurchases(nextPurchases);
        updateLocalSummary(nextPurchases);
        setFeedback({ type: "success", message: "Transaksi belanja modal berhasil dicatat!" });
        setIsPurchaseModalOpen(false);
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    }
    setIsSubmitting(false);
  };

  // Delete capital purchase
  const handleDeletePurchase = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus transaksi modal "${name}"?`)) return;
    const res = await deleteCapitalPurchaseAction(id);
    if (res.success) {
      const nextPurchases = purchases.filter((p) => p.id !== id);
      setPurchases(nextPurchases);
      updateLocalSummary(nextPurchases);
      setFeedback({ type: "success", message: `Transaksi "${name}" berhasil dihapus.` });
    } else {
      setFeedback({ type: "error", message: res.error });
    }
  };

  // Filter purchases
  const filteredPurchases = purchases.filter((p) => {
    const q = searchPurchase.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.storeLocation && p.storeLocation.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalAssetValue = assets.reduce((sum, a) => sum + a.purchase_price, 0);

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-lg text-xs font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
              : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Total Modal Usaha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
              {formatRupiah(summary.totalCapital)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">{summary.totalItems} transaksi belanja modal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500">Nilai Perolehan Aset Mesin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatRupiah(totalAssetValue)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">{assets.length} unit aset aktif terdaftar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500">Persediaan Bahan & Kemasan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatRupiah(
                summary.breakdown
                  .filter((b) => ["FILAMEN", "KELISTRIKAN", "KEMASAN"].includes(b.category))
                  .reduce((sum, b) => sum + b.totalCost, 0)
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Filamen, kelistrikan, & packaging</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500">Peralatan Studio (Tools)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatRupiah(summary.breakdown.find((b) => b.category === "ALAT")?.totalCost || 0)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Peralatan pendukung produksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Capital Category Breakdown Visual */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Komposisi Alokasi Modal Usaha</CardTitle>
          <CardDescription>
            Pemisahan aset tetap (mesin printer), persediaan (filamen/komponen), dan alat kerja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
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
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${b.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Fixed Assets Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-base font-bold">Aset Mesin 3D Printer & Peralatan</CardTitle>
            <CardDescription>
              Daftar mesin cetak yang mendasari kapasitas produksi studio dan perhitungan depresiasi
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="accent"
            className="gap-1.5 text-xs self-start sm:self-auto"
            onClick={() => {
              setEditingAsset(null);
              setIsAssetModalOpen(true);
            }}
          >
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
                  <th className="py-3 px-4 font-semibold text-center">Umur Manfaat</th>
                  <th className="py-3 px-4 font-semibold text-right">Daya (Watt)</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-center">Aksi</th>
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
                    <td className="py-3 px-4 text-right text-zinc-500">{formatRupiah(asset.residual_value)}</td>
                    <td className="py-3 px-4 text-center text-zinc-600 dark:text-zinc-400">
                      {asset.useful_life_months} Bulan
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      {asset.power_watts > 0 ? `${asset.power_watts} W` : "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={asset.status === "ACTIVE" ? "success" : "warning"}
                        className="text-[10px]"
                      >
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingAsset(asset);
                            setIsAssetModalOpen(true);
                          }}
                          className="p-1 text-zinc-400 hover:text-amber-600 transition-colors"
                          title="Edit Aset"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id, asset.name)}
                          className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                          title="Hapus Aset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Capital Purchases Log */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-base font-bold">Buku Catatan Belanja Modal Usaha</CardTitle>
            <CardDescription>
              Rincian transaksi riil pembelanjaan awal dan tambahan belanja modal operasional
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                setEditingPurchase(null);
                setIsPurchaseModalOpen(true);
              }}
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Tambah Transaksi Modal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <Input
                placeholder="Cari transaksi belanja..."
                value={searchPurchase}
                onChange={(e) => setSearchPurchase(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {["ALL", "MESIN", "FILAMEN", "KELISTRIKAN", "KEMASAN", "ALAT", "OPERASIONAL"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {cat === "ALL" ? "Semua" : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 z-10">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">No</th>
                  <th className="py-3 px-4 font-semibold">Tanggal</th>
                  <th className="py-3 px-4 font-semibold">Nama Barang / Transaksi</th>
                  <th className="py-3 px-4 font-semibold">Kategori</th>
                  <th className="py-3 px-4 font-semibold text-right">Harga Satuan</th>
                  <th className="py-3 px-4 font-semibold text-center">Jumlah</th>
                  <th className="py-3 px-4 font-semibold text-right">Biaya Layanan</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Transaksi</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredPurchases.map((item, index) => (
                  <tr key={item.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-2.5 px-4 text-center text-zinc-400 font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {item.purchaseDate || "-"}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                      <div>{item.name}</div>
                      {(item.storeLocation || item.account) && (
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-normal text-zinc-400 mt-0.5">
                          {item.storeLocation && <span>Toko: {item.storeLocation}</span>}
                          {item.account && <span>Akun: {item.account}</span>}
                        </div>
                      )}
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
                    <td className="py-2.5 px-4 text-right text-zinc-500">{formatRupiah(item.serviceFee)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(item.totalCost)}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-amber-600"
                          title="Edit Transaksi Modal"
                          onClick={() => {
                            setEditingPurchase(item);
                            setIsPurchaseModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-zinc-500 hover:text-rose-600"
                          title="Hapus Transaksi Modal"
                          onClick={() => void handleDeletePurchase(item.id, item.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Tambah / Edit Aset */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                {editingAsset ? "Edit Data Aset" : "Tambah Aset Baru"}
              </h3>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAssetSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">
                  Nama Aset Mesin / Peralatan
                </Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={editingAsset?.name || ""}
                  placeholder="Contoh: Bambu Lab P1S Combo"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="category" className="text-xs">
                    Kategori Aset
                  </Label>
                  <select
                    id="category"
                    name="category"
                    defaultValue={editingAsset?.category || "printer_3d"}
                    className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  >
                    <option value="printer_3d">3D Printer</option>
                    <option value="tool">Peralatan / Tools</option>
                    <option value="computer">Komputer / Gadget</option>
                    <option value="furniture">Furniture / Rak</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="purchase_price" className="text-xs">
                    Harga Perolehan (Rp)
                  </Label>
                  <Input
                    id="purchase_price"
                    name="purchase_price"
                    type="number"
                    min="0"
                    required
                    defaultValue={editingAsset?.purchase_price || ""}
                    placeholder="3500000"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="residual_value" className="text-xs">
                    Nilai Residu (Rp)
                  </Label>
                  <Input
                    id="residual_value"
                    name="residual_value"
                    type="number"
                    min="0"
                    defaultValue={editingAsset?.residual_value ?? 0}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="useful_life_months" className="text-xs">
                    Masa Manfaat (Bulan)
                  </Label>
                  <Input
                    id="useful_life_months"
                    name="useful_life_months"
                    type="number"
                    min="1"
                    defaultValue={editingAsset?.useful_life_months || 24}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="power_watts" className="text-xs">
                    Daya Listrik (Watt)
                  </Label>
                  <Input
                    id="power_watts"
                    name="power_watts"
                    type="number"
                    min="0"
                    defaultValue={editingAsset?.power_watts || 100}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="estimated_hours_per_month" className="text-xs">
                    Estimasi Jam Operasi/Bulan
                  </Label>
                  <Input
                    id="estimated_hours_per_month"
                    name="estimated_hours_per_month"
                    type="number"
                    min="1"
                    defaultValue={editingAsset?.estimated_hours_per_month || 150}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {editingAsset && (
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs">
                    Status Operasional
                  </Label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={editingAsset.status}
                    className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="RETIRED">RETIRED</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsAssetModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="accent" size="sm" className="text-xs" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : editingAsset ? "Simpan Perubahan" : "Simpan Aset"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Belanja Modal */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                {editingPurchase ? "Edit Transaksi Belanja Modal" : "Catat Transaksi Belanja Modal"}
              </h3>
              <button
                onClick={() => {
                  setIsPurchaseModalOpen(false);
                  setEditingPurchase(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form key={editingPurchase?.id || "new-purchase"} onSubmit={handlePurchaseSubmit} className="p-4 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="p_name" className="text-xs">
                  Nama Barang / Pembelian
                </Label>
                <Input
                  id="p_name"
                  name="name"
                  defaultValue={editingPurchase?.name || ""}
                  required
                  placeholder="Contoh: Filament eSUN PLA Basic Grey"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="p_date" className="text-xs">
                    Tanggal Pembelian
                  </Label>
                  <Input
                    id="p_date"
                    name="purchase_date"
                    type="date"
                    defaultValue={editingPurchase?.purchaseDate || new Date().toISOString().split("T")[0]}
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p_store" className="text-xs">
                    Toko / Lokasi Pembelian
                  </Label>
                  <Input
                    id="p_store"
                    name="store_location"
                    list="store-location-options"
                    defaultValue={editingPurchase?.storeLocation || ""}
                    placeholder="Contoh: Shopee / Toko Offline"
                    className="h-8 text-xs"
                  />
                  <datalist id="store-location-options">
                    <option value="Shopee" />
                    <option value="Tokopedia" />
                    <option value="TikTok Shop" />
                    <option value="Mr.DIY" />
                    <option value="Gemilang" />
                    <option value="Toko Offline" />
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="p_category" className="text-xs">
                  Kategori
                </Label>
                <select
                  id="p_category"
                  name="category"
                  defaultValue={editingPurchase?.category || "FILAMEN"}
                  className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <option value="FILAMEN">FILAMEN (Bahan Baku)</option>
                  <option value="MESIN">MESIN (3D Printer)</option>
                  <option value="KELISTRIKAN">KELISTRIKAN (Komponen)</option>
                  <option value="KEMASAN">KEMASAN (Packaging)</option>
                  <option value="ALAT">ALAT (Tools & Workshop)</option>
                  <option value="OPERASIONAL">OPERASIONAL (Iklan & Software)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="unit_price" className="text-xs">
                    Harga Satuan (Rp)
                  </Label>
                  <Input
                    id="unit_price"
                    name="unit_price"
                    type="number"
                    min="0"
                    defaultValue={editingPurchase?.unitPrice ?? ""}
                    required
                    placeholder="125000"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p_quantity" className="text-xs">
                    Kuantitas
                  </Label>
                  <Input
                    id="p_quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue={editingPurchase?.quantity ?? 1}
                    required
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="service_fee" className="text-xs">
                  Biaya Layanan / Admin Marketplace (Rp)
                </Label>
                <Input
                  id="service_fee"
                  name="service_fee"
                  type="number"
                  min="0"
                  defaultValue={editingPurchase?.serviceFee ?? 2000}
                  className="h-8 text-xs"
                />
                <span className="text-[10px] text-zinc-500">Standar Shopee Rp 2.000 per transaksi (isi 0 jika toko offline)</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setIsPurchaseModalOpen(false);
                    setEditingPurchase(null);
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" variant="accent" size="sm" className="text-xs" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : editingPurchase ? "Simpan Perubahan" : "Simpan Transaksi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
