"use client";

import React, { useState, useMemo } from "react";
import { Material, StockMovement, StockMovementType } from "@/types/database";
import { formatRupiah, formatNumber, formatDateIndo } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createMaterialAction,
  updateMaterialAction,
  deleteMaterialAction,
  recordStockMovementAction,
} from "./actions";
import {
  Plus,
  ArrowUpDown,
  Boxes,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
} from "lucide-react";

interface InventoryClientProps {
  initialMaterials: Material[];
  initialMovements: StockMovement[];
  summary: {
    totalItems: number;
    filamentStockKg: number;
    lowStockCount: number;
  };
}

export function InventoryClient({
  initialMaterials,
  initialMovements,
}: InventoryClientProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modals
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Material Form
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Material["category"]>("filament");
  const [unit, setUnit] = useState<Material["unit"]>("gram");
  const [currentStock, setCurrentStock] = useState<number | "">("");
  const [minStockAlert, setMinStockAlert] = useState<number | "">(1000);
  const [costPerUnit, setCostPerUnit] = useState<number | "">(180);
  const [supplier, setSupplier] = useState("");

  // Stock Movement Form
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || "");
  const [movementType, setMovementType] = useState<StockMovementType>("PURCHASE");
  const [movementQty, setMovementQty] = useState<number | "">("");
  const [movementNotes, setMovementNotes] = useState("");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (selectedCategory !== "ALL" && m.category !== selectedCategory) return false;
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const mName = m.name.toLowerCase().includes(q);
        const mSupp = m.supplier?.toLowerCase().includes(q) || false;
        return mName || mSupp;
      }
      return true;
    });
  }, [materials, selectedCategory, search]);

  // Dynamic summary
  const summary = useMemo(() => {
    const totalItems = materials.length;
    const filamentGrams = materials
      .filter((m) => m.category === "filament")
      .reduce((acc, curr) => acc + curr.current_stock, 0);
    const lowStockCount = materials.filter((m) => m.current_stock <= m.min_stock_alert).length;
    return {
      totalItems,
      filamentStockKg: filamentGrams / 1000,
      lowStockCount,
    };
  }, [materials]);

  const openAddModal = () => {
    setEditingMaterial(null);
    setName("");
    setCategory("filament");
    setUnit("gram");
    setCurrentStock("");
    setMinStockAlert(1000);
    setCostPerUnit(180);
    setSupplier("");
    setShowAddMaterialModal(true);
  };

  const openEditModal = (mat: Material) => {
    setEditingMaterial(mat);
    setName(mat.name);
    setCategory(mat.category);
    setUnit(mat.unit);
    setCurrentStock(mat.current_stock);
    setMinStockAlert(mat.min_stock_alert);
    setCostPerUnit(mat.cost_per_unit);
    setSupplier(mat.supplier || "");
    setShowAddMaterialModal(true);
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Nama bahan baku wajib diisi." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    if (editingMaterial) {
      const res = await updateMaterialAction(editingMaterial.id, {
        name: name.trim(),
        category,
        unit,
        current_stock: Number(currentStock) || 0,
        min_stock_alert: Number(minStockAlert) || 0,
        cost_per_unit: Number(costPerUnit) || 0,
        supplier: supplier.trim() || undefined,
      });

      if (res.success && res.material) {
        setMaterials((prev) => prev.map((m) => (m.id === editingMaterial.id ? res.material! : m)));
        setFeedback({ type: "success", message: `Bahan "${res.material.name}" berhasil diperbarui!` });
        setShowAddMaterialModal(false);
      } else {
        setFeedback({ type: "error", message: res.error || "Gagal memperbarui bahan." });
      }
    } else {
      const res = await createMaterialAction({
        name: name.trim(),
        category,
        unit,
        current_stock: Number(currentStock) || 0,
        min_stock_alert: Number(minStockAlert) || 0,
        cost_per_unit: Number(costPerUnit) || 0,
        supplier: supplier.trim() || undefined,
      });

      if (res.success && res.material) {
        setMaterials((prev) => [...prev, res.material!]);
        setFeedback({ type: "success", message: `Bahan baku "${res.material.name}" berhasil ditambahkan!` });
        setShowAddMaterialModal(false);
      } else {
        setFeedback({ type: "error", message: res.error || "Gagal menambahkan bahan baru." });
      }
    }
    setSubmitting(false);
  };

  const handleDeleteMaterial = async (mat: Material) => {
    if (!confirm(`Hapus bahan baku "${mat.name}"?`)) return;

    const res = await deleteMaterialAction(mat.id);
    if (res.success) {
      setMaterials((prev) => prev.filter((m) => m.id !== mat.id));
      setFeedback({ type: "success", message: `Bahan "${mat.name}" berhasil dihapus.` });
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal menghapus bahan." });
    }
  };

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(movementQty);
    if (!qty || qty === 0) {
      setFeedback({ type: "error", message: "Jumlah mutasi tidak boleh nol." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    // Negative for usage/waste, positive for purchase/return
    const actualQty =
      movementType === "PRODUCTION_USAGE" || movementType === "WASTE_ADJUSTMENT"
        ? -Math.abs(qty)
        : Math.abs(qty);

    const res = await recordStockMovementAction({
      material_id: selectedMaterialId,
      movement_type: movementType,
      quantity: actualQty,
      notes: movementNotes.trim() || undefined,
    });

    if (res.success && res.movement) {
      setMovements((prev) => [res.movement!, ...prev]);
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === selectedMaterialId
            ? { ...m, current_stock: Math.max(0, m.current_stock + actualQty) }
            : m
        )
      );
      setFeedback({
        type: "success",
        message: `Mutasi stok (${actualQty > 0 ? "+" : ""}${actualQty}) berhasil dicatat!`,
      });
      setShowMovementModal(false);
      setMovementQty("");
      setMovementNotes("");
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal mencatat mutasi stok." });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
              Basis data acuan untuk kalkulasi HPP dan pemotongan stok otomatis saat pesanan diproduksi
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMovementModal(true)}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <ArrowUpDown className="h-3.5 w-3.5" /> Mutasi Stok
            </Button>
            <Button
              size="sm"
              variant="accent"
              onClick={openAddModal}
              className="gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Bahan
            </Button>
          </div>
        </CardHeader>

        {/* Search & Category Filter toolbar */}
        <div className="px-5 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="Cari nama bahan atau pemasok..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8 bg-zinc-50/50 dark:bg-zinc-900/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 text-xs cursor-pointer"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="filament">Filamen</option>
              <option value="electrical">Kelistrikan</option>
              <option value="packaging">Kemasan</option>
              <option value="hardware">Hardware</option>
              <option value="other">Lainnya</option>
            </select>
          </div>
        </div>

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
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredMaterials.map((item) => {
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
                      <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                        {formatNumber(item.current_stock)} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-zinc-500 font-mono">
                        {formatNumber(item.min_stock_alert)} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700 dark:text-amber-400 font-mono">
                        {formatRupiah(item.cost_per_unit)}
                      </td>
                      <td className="py-3 px-4 text-zinc-500">
                        {item.supplier || "-"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={isLow ? "destructive" : "success"} className="text-[10px]">
                          {isLow ? "Menipis" : "Aman"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1 text-zinc-400 hover:text-amber-600 rounded cursor-pointer"
                            title="Edit Bahan"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(item)}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Hapus Bahan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stock Movement Audit Log Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Kartu Stok & Mutasi Real-time</CardTitle>
          <CardDescription>
            Log mutasi pemotongan stok otomatis saat produksi dan pencatatan pengadaan bahan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 z-10">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Waktu Mutasi</th>
                  <th className="py-2.5 px-4 font-semibold">Nama Bahan</th>
                  <th className="py-2.5 px-4 font-semibold">Tipe Mutasi</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Kuantitas</th>
                  <th className="py-2.5 px-4 font-semibold">Keterangan / Referensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {movements.map((mov) => {
                  const mat = materials.find((m) => m.id === mov.material_id);
                  const isPositive = mov.quantity > 0;

                  return (
                    <tr key={mov.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <td className="py-2.5 px-4 text-zinc-500 font-mono text-[11px]">
                        {formatDateIndo(mov.created_at)}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                        {mat?.name || mov.material_id}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge
                          variant={
                            mov.movement_type === "PURCHASE" || mov.movement_type === "RETURN"
                              ? "success"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {mov.movement_type}
                        </Badge>
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-mono font-bold ${
                          isPositive
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isPositive ? `+${mov.quantity}` : mov.quantity} {mat?.unit || "unit"}
                      </td>
                      <td className="py-2.5 px-4 text-zinc-500 text-[11px]">
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

      {/* Modal Dialog: Tambah / Edit Bahan */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-amber-500" />
                {editingMaterial ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddMaterialModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nama Bahan Baku / Komponen <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Contoh: Filamen PLA Matte Putih eSUN"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Material["category"])}
                    className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs"
                  >
                    <option value="filament">Filamen</option>
                    <option value="electrical">Kelistrikan</option>
                    <option value="packaging">Kemasan</option>
                    <option value="hardware">Hardware</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Satuan Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as Material["unit"])}
                    className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs"
                  >
                    <option value="gram">Gram</option>
                    <option value="pcs">Pcs</option>
                    <option value="meter">Meter</option>
                    <option value="roll">Roll</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Stok Saat Ini
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Contoh: 1000"
                    value={currentStock}
                    onChange={(e) =>
                      setCurrentStock(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Batas Peringatan Minimum
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Contoh: 200"
                    value={minStockAlert}
                    onChange={(e) =>
                      setMinStockAlert(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Biaya Satuan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    required
                    placeholder="Contoh: 180"
                    value={costPerUnit}
                    onChange={(e) =>
                      setCostPerUnit(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="text-xs h-9 font-semibold text-amber-600 dark:text-amber-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Pemasok / Toko
                  </label>
                  <Input
                    placeholder="Contoh: IndoCart Shopee"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMaterialModal(false)}
                  className="text-xs h-8 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={submitting}
                  className="text-xs h-8 font-semibold cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Bahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Mutasi Stok */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-amber-500" /> Catat Mutasi & Penyesuaian Stok
              </h3>
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Pilih Bahan Baku <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Sisa: {m.current_stock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Jenis Mutasi
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as StockMovementType)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs"
                >
                  <option value="PURCHASE">Pembelian / Penambahan Stok (+)</option>
                  <option value="PRODUCTION_USAGE">Pemakaian Produksi (-)</option>
                  <option value="WASTE_ADJUSTMENT">Kerusakan / Gagal Cetak (-)</option>
                  <option value="MANUAL_CORRECTION">Koreksi Stok Manual (+)</option>
                  <option value="RETURN">Retur / Pengembalian (+)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Kuantitas / Jumlah
                </label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="Contoh: 1000"
                  value={movementQty}
                  onChange={(e) =>
                    setMovementQty(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="text-xs h-9 font-bold text-amber-600 dark:text-amber-400"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Keterangan / Nomor Invoice
                </label>
                <Input
                  placeholder="Contoh: Pengadaan 5 Roll Filamen eSUN Shopee"
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMovementModal(false)}
                  className="text-xs h-8 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={submitting}
                  className="text-xs h-8 font-semibold cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Mutasi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
