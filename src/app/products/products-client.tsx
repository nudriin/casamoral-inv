"use client";

import React, { useState, useMemo } from "react";
import { ProductWithBOM, BomPartItem, BomHardwareItem } from "@/lib/data/initial-data";
import { ProductCategory, ProductType, CalculationMode } from "@/types/database";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createProductAction,
  updateProductAction,
  deleteOrArchiveProductAction,
  toggleProductActiveAction,
  createProductCategoryAction,
} from "./actions";
import {
  Plus,
  Box,
  Layers,
  Search,
  Edit2,
  Trash2,
  Archive,
  Power,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
  Tag,
  Clock,
  Zap,
  Sparkles,
} from "lucide-react";

interface ProductsClientProps {
  initialProducts: ProductWithBOM[];
  categories: ProductCategory[];
}

export function ProductsClient({ initialProducts, categories }: ProductsClientProps) {
  const [products, setProducts] = useState<ProductWithBOM[]>(initialProducts);
  const [categoryList, setCategoryList] = useState<ProductCategory[]>(categories);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [showArchived, setShowArchived] = useState(false);

  // Modals state
  const [showAddModelModal, setShowAddModelModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithBOM | null>(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states for Model creation / editing
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategoryId, setFormCategoryId] = useState(categories[0]?.id || "");
  const [formProductType, setFormProductType] = useState<ProductType>("PRINTED");
  const [formDescription, setFormDescription] = useState("");
  const [formCalcMode, setFormCalcMode] = useState<CalculationMode>("STANDARD");
  const [formOverheadMultiplier, setFormOverheadMultiplier] = useState(1.20);
  const [formPrintMinutes, setFormPrintMinutes] = useState(90);
  const [formMarkupPercent, setFormMarkupPercent] = useState(50);
  const [formSellingPrice, setFormSellingPrice] = useState<number | "">("");

  // Dynamic 3D Printed Parts BOM
  const [formParts, setFormParts] = useState<BomPartItem[]>([
    { id: "part-1", name: "Panel Depan", gram: 25, quantity: 1 },
    { id: "part-2", name: "Panel Belakang", gram: 25, quantity: 1 },
  ]);

  // Dynamic Hardware & Non-Printing Components
  const [formHardware, setFormHardware] = useState<BomHardwareItem[]>([
    { id: "hw-1", name: "Magnet Neodymium (Bulat)", cost: 1500, quantity: 4 },
    { id: "hw-2", name: "Kemasan Pouch / Box Mini", cost: 3000, quantity: 1 },
  ]);

  // New Category Form
  const [newCategoryName, setNewCategoryName] = useState("");

  // Live Dynamic Calculations
  const totalFilamentGram = useMemo(() => {
    return formParts.reduce(
      (sum, p) => sum + (Number(p.gram) || 0) * (Number(p.quantity) || 1),
      0
    );
  }, [formParts]);

  const calculatedFilamentCost = totalFilamentGram * 180;

  const totalHardwareCost = useMemo(() => {
    return formHardware.reduce(
      (sum, h) => sum + (Number(h.cost) || 0) * (Number(h.quantity) || 1),
      0
    );
  }, [formHardware]);

  const calculatedMaterialSubtotal = calculatedFilamentCost + totalHardwareCost;
  const calculatedHpp =
    formProductType === "PRINTED"
      ? calculatedMaterialSubtotal * formOverheadMultiplier
      : calculatedMaterialSubtotal;
  const recommendedSellingPrice = Math.ceil((calculatedHpp * (1 + formMarkupPercent / 100)) / 1000) * 1000;
  const effectiveSellingPrice = typeof formSellingPrice === "number" && formSellingPrice > 0 ? formSellingPrice : recommendedSellingPrice;
  const grossMarginPercent =
    effectiveSellingPrice > 0 ? ((effectiveSellingPrice - calculatedHpp) / effectiveSellingPrice) * 100 : 0;

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!showArchived && p.is_archived) return false;
      if (selectedCategory !== "ALL" && p.category_id !== selectedCategory) return false;
      if (selectedType !== "ALL" && p.product_type !== selectedType) return false;
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const mName = p.name.toLowerCase().includes(q);
        const mSku = p.sku?.toLowerCase().includes(q) || false;
        const mDesc = p.description?.toLowerCase().includes(q) || false;
        return mName || mSku || mDesc;
      }
      return true;
    });
  }, [products, showArchived, selectedCategory, selectedType, search]);

  // Dynamic Parts Handlers
  const handleAddPart = () => {
    setFormParts((prev) => [
      ...prev,
      { id: `part-${Date.now()}`, name: `Komponen ${prev.length + 1}`, gram: 20, quantity: 1 },
    ]);
  };

  const handleRemovePart = (id: string) => {
    if (formParts.length <= 1) return;
    setFormParts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePart = (id: string, field: keyof BomPartItem, value: string | number) => {
    setFormParts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Dynamic Hardware Handlers
  const handleAddHardware = () => {
    setFormHardware((prev) => [
      ...prev,
      { id: `hw-${Date.now()}`, name: "Aksesori / Komponen Baru", cost: 2000, quantity: 1 },
    ]);
  };

  const handleRemoveHardware = (id: string) => {
    setFormHardware((prev) => prev.filter((h) => h.id !== id));
  };

  const handleUpdateHardware = (id: string, field: keyof BomHardwareItem, value: string | number) => {
    setFormHardware((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  // Preset Template Applicator
  const applyTemplate = (templateName: "PANEL_VAPE" | "CLICKER" | "LAMPU" | "CUSTOM") => {
    if (templateName === "PANEL_VAPE") {
      setFormParts([
        { id: `part-${Date.now()}-1`, name: "Panel Depan", gram: 25, quantity: 1 },
        { id: `part-${Date.now()}-2`, name: "Panel Belakang", gram: 25, quantity: 1 },
      ]);
      setFormHardware([
        { id: `hw-${Date.now()}-1`, name: "Magnet Neodymium (Bulat)", cost: 1500, quantity: 4 },
        { id: `hw-${Date.now()}-2`, name: "Kemasan Pouch / Box Mini", cost: 3000, quantity: 1 },
      ]);
      setFormPrintMinutes(90);
    } else if (templateName === "CLICKER") {
      setFormParts([
        { id: `part-${Date.now()}-1`, name: "Body / Case Clicker", gram: 18, quantity: 1 },
        { id: `part-${Date.now()}-2`, name: "Keycap 3D Print", gram: 6, quantity: 1 },
      ]);
      setFormHardware([
        { id: `hw-${Date.now()}-1`, name: "Switch Mechanical (Kailh/Outemu)", cost: 4500, quantity: 1 },
        { id: `hw-${Date.now()}-2`, name: "Gantungan Kunci / Ring", cost: 1500, quantity: 1 },
        { id: `hw-${Date.now()}-3`, name: "Kemasan Klip / Stiker", cost: 1000, quantity: 1 },
      ]);
      setFormPrintMinutes(45);
    } else if (templateName === "LAMPU") {
      setFormParts([
        { id: `part-${Date.now()}-1`, name: "Shade", gram: 98, quantity: 1 },
        { id: `part-${Date.now()}-2`, name: "Base", gram: 68, quantity: 1 },
      ]);
      setFormHardware([
        { id: `hw-${Date.now()}-1`, name: "Kit Kelistrikan (Fitting E27 + LED + Sakelar)", cost: 31700, quantity: 1 },
        { id: `hw-${Date.now()}-2`, name: "Kemasan & Box Kardus", cost: 6500, quantity: 1 },
      ]);
      setFormPrintMinutes(240);
    } else {
      setFormParts([
        { id: `part-${Date.now()}-1`, name: "Komponen Utama", gram: 50, quantity: 1 },
      ]);
      setFormHardware([
        { id: `hw-${Date.now()}-1`, name: "Kemasan & Aksesori", cost: 3000, quantity: 1 },
      ]);
      setFormPrintMinutes(120);
    }
  };

  const handleCreateCategoryInline = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await createProductCategoryAction(newCategoryName.trim());
      if (res.success && res.category) {
        setCategoryList((prev) => [...prev, res.category!]);
        setFormCategoryId(res.category.id);
        setShowAddCategoryInline(false);
        const lower = res.category.name.toLowerCase();
        setNewCategoryName("");
        if (lower.includes("vape") || lower.includes("panel")) {
          applyTemplate("PANEL_VAPE");
        } else if (lower.includes("clicker") || lower.includes("fidget")) {
          applyTemplate("CLICKER");
        }
      }
    } catch {
      // ignore
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormSku("");
    setFormCategoryId(categoryList[0]?.id || "");
    setFormProductType("PRINTED");
    setFormDescription("");
    setFormCalcMode("STANDARD");
    setFormOverheadMultiplier(1.20);
    setFormPrintMinutes(90);
    setFormMarkupPercent(50);
    setFormSellingPrice("");
    applyTemplate("PANEL_VAPE");
    setEditingProduct(null);
  };

  const openAddModelModal = () => {
    resetForm();
    setShowAddModelModal(true);
  };

  const openEditModal = (p: ProductWithBOM) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku || "");
    setFormCategoryId(p.category_id || categoryList[0]?.id || "");
    setFormProductType(p.product_type || "PRINTED");
    setFormDescription(p.description || "");
    setFormCalcMode(p.calculation_mode);
    setFormOverheadMultiplier(p.standard_overhead_multiplier || 1.20);
    setFormPrintMinutes(p.print_time_minutes || 0);
    setFormMarkupPercent(p.markup_percent || 50);
    setFormSellingPrice(p.selling_price);

    // Populate dynamic parts
    if (p.bom?.parts && p.bom.parts.length > 0) {
      setFormParts(p.bom.parts);
    } else {
      const legacyParts: BomPartItem[] = [];
      if (p.bom?.shadeGram) legacyParts.push({ id: "p-shade", name: "Shade", gram: p.bom.shadeGram, quantity: 1 });
      if (p.bom?.baseGram) legacyParts.push({ id: "p-base", name: "Base", gram: p.bom.baseGram, quantity: 1 });
      if (p.bom?.capGram) legacyParts.push({ id: "p-cap", name: "Cap / Nut", gram: p.bom.capGram, quantity: 1 });
      if (legacyParts.length === 0) {
        legacyParts.push({ id: "p-1", name: "Komponen Utama", gram: p.bom?.totalFilamentGram || 50, quantity: 1 });
      }
      setFormParts(legacyParts);
    }

    // Populate dynamic hardware
    if (p.bom?.hardware && p.bom.hardware.length > 0) {
      setFormHardware(p.bom.hardware);
    } else {
      const legacyHw: BomHardwareItem[] = [];
      if (p.bom?.electricalCost) {
        legacyHw.push({ id: "hw-elec", name: "Kit Kelistrikan / Komponen", cost: p.bom.electricalCost, quantity: 1 });
      }
      if (p.bom?.packagingCost) {
        legacyHw.push({ id: "hw-pack", name: "Kemasan & Box", cost: p.bom.packagingCost, quantity: 1 });
      }
      setFormHardware(legacyHw);
    }

    setShowAddModelModal(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: "error", message: "Nama produk / model wajib diisi." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const payload = {
      name: formName.trim(),
      sku: formSku.trim() || undefined,
      category_id: formCategoryId,
      product_type: formProductType,
      description: formDescription.trim() || undefined,
      calculation_mode: formCalcMode,
      standard_overhead_multiplier: formOverheadMultiplier,
      print_time_minutes: formPrintMinutes,
      current_hpp: calculatedHpp,
      selling_price: effectiveSellingPrice,
      markup_percent: formMarkupPercent,
      bom: {
        parts: formParts,
        hardware: formHardware,
        shadeGram: formParts[0]?.gram || 0,
        baseGram: formParts[1]?.gram || 0,
        capGram: formParts[2]?.gram || 0,
        totalFilamentGram,
        filamentCost: calculatedFilamentCost,
        electricalCost: totalHardwareCost,
        packagingCost: 0,
        subtotalMaterial: calculatedMaterialSubtotal,
        overheadMultiplier: formOverheadMultiplier,
      },
    };

    if (editingProduct) {
      const res = await updateProductAction(editingProduct.id, payload);
      if (res.success && res.product) {
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.product! : p)));
        setFeedback({ type: "success", message: `Model "${res.product.name}" berhasil diperbarui!` });
        setShowAddModelModal(false);
        resetForm();
      } else {
        setFeedback({ type: "error", message: res.error || "Gagal memperbarui produk." });
      }
    } else {
      const res = await createProductAction(payload);
      if (res.success && res.product) {
        setProducts((prev) => [res.product!, ...prev]);
        setFeedback({ type: "success", message: `Model baru "${res.product.name}" berhasil disimpan!` });
        setShowAddModelModal(false);
        resetForm();
      } else {
        setFeedback({ type: "error", message: res.error || "Gagal menambahkan produk baru." });
      }
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (p: ProductWithBOM) => {
    const nextState = !p.is_active;
    const res = await toggleProductActiveAction(p.id, nextState);
    if (res.success && res.product) {
      setProducts((prev) => prev.map((item) => (item.id === p.id ? res.product! : item)));
      setFeedback({
        type: "success",
        message: `Status produk "${p.name}" diubah menjadi ${nextState ? "AKTIF" : "NON-AKTIF"}.`,
      });
    }
  };

  const handleDeleteOrArchive = async (p: ProductWithBOM) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus/mengarsipkan model "${p.name}"?`)) return;

    const res = await deleteOrArchiveProductAction(p.id);
    if (res.success) {
      if (res.action === "ARCHIVED") {
        setProducts((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, is_archived: true, is_active: false } : item))
        );
      } else {
        setProducts((prev) => prev.filter((item) => item.id !== p.id));
      }
      setFeedback({ type: "success", message: res.message || "Tindakan berhasil diproses." });
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal menghapus produk." });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setSubmitting(true);
    const res = await createProductCategoryAction(newCategoryName);
    if (res.success && res.category) {
      setCategoryList((prev) => [...prev, res.category!]);
      setFormCategoryId(res.category.id);
      setNewCategoryName("");
      setShowAddCategoryModal(false);
      setFeedback({ type: "success", message: `Kategori "${res.category.name}" berhasil ditambahkan!` });
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
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
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

      {/* Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Box className="h-6 w-6 text-amber-500" />
            Katalog Produk & Model 3D Studio
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pengelolaan lini produk, varian model, Bill of Materials (BOM), kalkulasi HPP presisi, dan penetapan harga jual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddCategoryModal(true)}
            className="gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Kategori
          </Button>

          <Button
            size="sm"
            variant="accent"
            onClick={openAddModelModal}
            className="gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4" /> Tambah Model Baru
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-zinc-50/80 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Cari model, SKU, atau deskripsi produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-white dark:bg-zinc-950"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            {categoryList.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">Semua Jenis Produk</option>
            <option value="PRINTED">3D Printed (BOM)</option>
            <option value="PROCURED">Pengadaan / Supplier</option>
            <option value="MANUFACTURED">Manufaktur / Rakitan</option>
            <option value="CUSTOM">Custom Order</option>
          </select>

          {/* Archived Toggle */}
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`h-9 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              showArchived
                ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300"
                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800"
            }`}
          >
            <Archive className="h-3.5 w-3.5" />
            <span>{showArchived ? "Sembunyikan Arsip" : "Tampilkan Arsip"}</span>
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
            <Box className="h-10 w-10 text-zinc-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Tidak ada produk yang cocok dengan filter
            </p>
            <p className="text-xs text-zinc-500 mt-1">Coba sesuaikan kata kunci pencarian atau kategori.</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const marginPercent =
              product.selling_price > 0
                ? ((product.selling_price - product.current_hpp) / product.selling_price) * 100
                : 0;

            const categoryName =
              categoryList.find((c) => c.id === product.category_id)?.name || "Lampu Ambient";

            return (
              <Card
                key={product.id}
                className={`overflow-hidden transition-all duration-150 border-zinc-200/90 dark:border-zinc-800/90 hover:border-amber-500/40 dark:hover:border-amber-500/40 shadow-xs ${
                  product.is_archived
                    ? "opacity-60 bg-zinc-100/50 dark:bg-zinc-900/30"
                    : !product.is_active
                    ? "opacity-75"
                    : ""
                }`}
              >
                <CardHeader className="bg-zinc-50/60 dark:bg-zinc-900/40 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-2xs">
                        <Box className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                            {product.name}
                          </CardTitle>
                          {product.is_archived ? (
                            <Badge variant="outline" className="text-[10px] bg-zinc-200/50 text-zinc-600">
                              Arsip
                            </Badge>
                          ) : !product.is_active ? (
                            <Badge variant="warning" className="text-[10px]">
                              Nonaktif
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              Aktif
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs font-mono text-zinc-500 mt-0.5">
                          SKU: {product.sku || "-"} • {categoryName}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-zinc-500 hover:text-amber-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md cursor-pointer transition-colors"
                        title="Edit Model & BOM"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(product)}
                        className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                          product.is_active
                            ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                        title={product.is_active ? "Nonaktifkan Model" : "Aktifkan Model"}
                      >
                        <Power className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteOrArchive(product)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md cursor-pointer transition-colors"
                        title="Hapus / Arsipkan Model"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Financial & Price Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 p-3 border border-zinc-200/50 dark:border-zinc-800/50">
                    <div>
                      <span className="text-[10px] font-medium text-zinc-500 block">HPP Pokok (COGS)</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(product.current_hpp)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-medium text-zinc-500 block">Harga Jual Acuan</span>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {formatRupiah(product.selling_price)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-medium text-zinc-500 block">Markup / Target</span>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        +{product.markup_percent.toFixed(0)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-medium text-zinc-500 block">Gross Margin %</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {marginPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Bill of Materials (BOM) & Parts Breakdown */}
                  <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-amber-500" />
                        <span>Rincian Bahan Baku & Komponen (BOM)</span>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {formatNumber(product.bom.totalFilamentGram)}g Filamen
                      </span>
                    </div>

                    {product.bom.parts && product.bom.parts.length > 0 ? (
                      <div className="space-y-2">
                        {/* 3D Printed Parts Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {product.bom.parts.map((part) => (
                            <span
                              key={part.id}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                            >
                              {part.name}: {part.gram}g {part.quantity > 1 ? `(×${part.quantity})` : ""}
                            </span>
                          ))}
                        </div>

                        {/* Cost Breakdown */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 p-2">
                            <span className="text-[10px] text-zinc-400 block">Biaya Filamen</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {formatRupiah(product.bom.filamentCost)}
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              {product.bom.totalFilamentGram} gram total
                            </span>
                          </div>

                          <div className="rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 p-2">
                            <span className="text-[10px] text-zinc-400 block">Hardware & Kemasan</span>
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {formatRupiah(
                                product.bom.hardware && product.bom.hardware.length > 0
                                  ? product.bom.hardware.reduce((s, h) => s + (Number(h.cost) || 0) * (Number(h.quantity) || 1), 0)
                                  : (product.bom.electricalCost || 0) + (product.bom.packagingCost || 0)
                              )}
                            </span>
                            <span className="text-[10px] text-zinc-400 block truncate">
                              {product.bom.hardware && product.bom.hardware.length > 0
                                ? product.bom.hardware.map((h) => h.name).join(", ")
                                : "Aksesori / Kit"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 p-2">
                          <span className="text-[10px] text-zinc-400 block">Filamen Total</span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {formatRupiah(product.bom.filamentCost)}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">
                            {product.bom.totalFilamentGram} gram
                          </span>
                        </div>

                        <div className="rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 p-2">
                          <span className="text-[10px] text-zinc-400 block">Kelistrikan (LED+Fit)</span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {formatRupiah(product.bom.electricalCost)}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">E27 + Inlite 3W</span>
                        </div>

                        <div className="rounded-lg bg-zinc-100/60 dark:bg-zinc-800/40 p-2">
                          <span className="text-[10px] text-zinc-400 block">Kemasan & Box</span>
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">
                            {formatRupiah(product.bom.packagingCost)}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">Kardus + Bubble</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Production & Dimensions Specs Footer */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      <span>
                        Waktu Cetak: {product.print_time_minutes > 0 ? `${product.print_time_minutes / 60} Jam` : "-"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono">
                      <span>Multiplier: {product.standard_overhead_multiplier}x</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal Dialog: Tambah / Edit Model Baru */}
      {showAddModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {editingProduct ? `Edit Model: ${editingProduct.name}` : "Tambah Model Produk Baru"}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Definisikan spesifikasi model, takaran BOM, dan kalkulasi HPP otomatis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModelModal(false);
                  resetForm();
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4 text-xs">
              {/* Product Info Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Nama Model Produk <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="Contoh: Lampu Ambient - Bloom Mini"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                    SKU / Kode Model
                  </label>
                  <Input
                    placeholder="Contoh: CM-BLOOM-01"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="text-xs h-9 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Kategori Produk
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCategoryInline(!showAddCategoryInline)}
                      className="text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-medium cursor-pointer"
                    >
                      {showAddCategoryInline ? "Batal" : "+ Kategori Baru"}
                    </button>
                  </div>

                  {showAddCategoryInline ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        placeholder="Misal: Panel Vape, Clicker..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="text-xs h-9"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateCategoryInline}
                        className="h-9 px-3 bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-xs"
                      >
                        Tambah
                      </Button>
                    </div>
                  ) : (
                    <select
                      value={formCategoryId}
                      onChange={(e) => {
                        const newCatId = e.target.value;
                        setFormCategoryId(newCatId);
                        const cat = categoryList.find((c) => c.id === newCatId);
                        if (cat) {
                          const lower = cat.name.toLowerCase();
                          if (lower.includes("vape") || lower.includes("panel")) {
                            applyTemplate("PANEL_VAPE");
                          } else if (lower.includes("clicker") || lower.includes("fidget")) {
                            applyTemplate("CLICKER");
                          } else if (lower.includes("lampu") || lower.includes("ambient")) {
                            applyTemplate("LAMPU");
                          }
                        }
                      }}
                      className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs"
                    >
                      {categoryList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Jenis Produk
                  </label>
                  <select
                    value={formProductType}
                    onChange={(e) => setFormProductType(e.target.value as ProductType)}
                    className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs"
                  >
                    <option value="PRINTED">3D Printed (Dengan BOM)</option>
                    <option value="PROCURED">Pengadaan Barang Jadi (Supplier)</option>
                    <option value="MANUFACTURED">Manufaktur / Rakitan</option>
                    <option value="CUSTOM">Produk Custom</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Deskripsi Model & Karakteristik
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan desain, material, variasi warna, atau fungsi produk..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Dynamic BOM Section */}
              {formProductType === "PRINTED" && (
                <div className="space-y-4 pt-1">
                  {/* Presets & Templates Bar */}
                  <div className="rounded-xl bg-zinc-100/80 dark:bg-zinc-800/60 p-2.5 border border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Template Struktur BOM:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyTemplate("PANEL_VAPE")}
                        className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 cursor-pointer transition-colors"
                      >
                        ⚡ Panel Vape (Sepasang)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("CLICKER")}
                        className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                      >
                        ⚡ Fidget Clicker
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("LAMPU")}
                        className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer transition-colors"
                      >
                        ⚡ Lampu Ambient
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTemplate("CUSTOM")}
                        className="px-2.5 py-1 text-[11px] rounded-md font-medium bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition-colors"
                      >
                        ⚡ Kustom Bebas
                      </button>
                    </div>
                  </div>

                  {/* Section 1: 3D Printed Parts (Filament) */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                        <Layers className="h-4 w-4 text-amber-600" />
                        <span>1. Komponen Cetak 3D (Filamen)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                          Total: {totalFilamentGram}g ({formatRupiah(calculatedFilamentCost)})
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddPart}
                          className="h-7 text-xs gap-1 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200"
                        >
                          <Plus className="h-3.5 w-3.5" /> Tambah Komponen
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      {formParts.map((part) => (
                        <div
                          key={part.id}
                          className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-amber-200/60 dark:border-zinc-800"
                        >
                          <div className="flex-1">
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Nama Bagian / Komponen</label>
                            <Input
                              value={part.name}
                              placeholder="Misal: Panel Depan, Panel Belakang..."
                              onChange={(e) => handleUpdatePart(part.id, "name", e.target.value)}
                              className="text-xs h-8"
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Berat / Unit (g)</label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={part.gram}
                              onChange={(e) => handleUpdatePart(part.id, "gram", Number(e.target.value) || 0)}
                              className="text-xs h-8 text-right font-mono"
                            />
                          </div>
                          <div className="w-16">
                            <label className="text-[10px] text-zinc-400 block mb-0.5">Qty</label>
                            <Input
                              type="number"
                              min="1"
                              value={part.quantity}
                              onChange={(e) => handleUpdatePart(part.id, "quantity", Number(e.target.value) || 1)}
                              className="text-xs h-8 text-center font-mono"
                            />
                          </div>
                          <div className="w-20 text-right pr-1">
                            <span className="text-[10px] text-zinc-400 block">Subtotal</span>
                            <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                              {(Number(part.gram) || 0) * (Number(part.quantity) || 1)} g
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={formParts.length <= 1}
                            onClick={() => handleRemovePart(part.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-zinc-400 cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Hardware & Non-Printing Components */}
                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
                        <Zap className="h-4 w-4 text-indigo-600" />
                        <span>2. Komponen Non-Cetak & Aksesori (Hardware/Packaging)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                          Total: {formatRupiah(totalHardwareCost)}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddHardware}
                          className="h-7 text-xs gap-1 border-indigo-300 text-indigo-800 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-200"
                        >
                          <Plus className="h-3.5 w-3.5" /> Tambah Hardware
                        </Button>
                      </div>
                    </div>

                    {formHardware.length === 0 ? (
                      <div className="text-[11px] text-zinc-500 italic p-3 text-center bg-white/60 dark:bg-zinc-900/40 rounded-lg">
                        Tidak ada hardware tambahan (100% cetak 3D murni). Klik &quot;+ Tambah Hardware&quot; jika model membutuhkan magnet, switch, baut, atau kemasan khusus.
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {formHardware.map((hw) => (
                          <div
                            key={hw.id}
                            className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-indigo-200/60 dark:border-zinc-800"
                          >
                            <div className="flex-1">
                              <label className="text-[10px] text-zinc-400 block mb-0.5">Nama Hardware / Komponen</label>
                              <Input
                                value={hw.name}
                                placeholder="Misal: Magnet Neodymium, Switch, Box..."
                                onChange={(e) => handleUpdateHardware(hw.id, "name", e.target.value)}
                                className="text-xs h-8"
                              />
                            </div>
                            <div className="w-28">
                              <label className="text-[10px] text-zinc-400 block mb-0.5">Biaya / Unit (Rp)</label>
                              <Input
                                type="number"
                                min="0"
                                value={hw.cost}
                                onChange={(e) => handleUpdateHardware(hw.id, "cost", Number(e.target.value) || 0)}
                                className="text-xs h-8 text-right font-mono"
                              />
                            </div>
                            <div className="w-16">
                              <label className="text-[10px] text-zinc-400 block mb-0.5">Qty</label>
                              <Input
                                type="number"
                                min="1"
                                value={hw.quantity}
                                onChange={(e) => handleUpdateHardware(hw.id, "quantity", Number(e.target.value) || 1)}
                                className="text-xs h-8 text-center font-mono"
                              />
                            </div>
                            <div className="w-24 text-right pr-1">
                              <span className="text-[10px] text-zinc-400 block">Subtotal</span>
                              <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                                {formatRupiah((Number(hw.cost) || 0) * (Number(hw.quantity) || 1))}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveHardware(hw.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-500 cursor-pointer"
                              title="Hapus baris"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 3: Machine Parameters & Overhead */}
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-600 dark:text-zinc-400 block mb-1">
                          Estimasi Waktu Cetak (Menit)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={formPrintMinutes}
                          onChange={(e) => setFormPrintMinutes(Number(e.target.value) || 0)}
                          className="text-xs h-8"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-zinc-600 dark:text-zinc-400 block mb-1">
                          Multiplier Overhead Standar
                        </label>
                        <Input
                          type="number"
                          step="0.05"
                          min="1.0"
                          value={formOverheadMultiplier}
                          onChange={(e) => setFormOverheadMultiplier(Number(e.target.value) || 1.2)}
                          className="text-xs h-8 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & Margin Preview Box */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Penetapan Harga & Margin (Live Preview)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Gross Margin: {grossMarginPercent.toFixed(1)}%
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-500 block mb-1">HPP Terhitung (Rp)</label>
                    <div className="h-9 px-3 rounded-lg bg-zinc-200/50 dark:bg-zinc-800/60 flex items-center font-bold text-zinc-800 dark:text-zinc-200">
                      {formatRupiah(calculatedHpp)}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-500 block mb-1">Target Markup (%)</label>
                    <Input
                      type="number"
                      min="0"
                      value={formMarkupPercent}
                      onChange={(e) => setFormMarkupPercent(Number(e.target.value) || 0)}
                      className="text-xs h-9"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-500 block mb-1">Harga Jual Final (Rp)</label>
                    <Input
                      type="number"
                      step="1000"
                      placeholder={`Rekomendasi: ${formatRupiah(recommendedSellingPrice)}`}
                      value={formSellingPrice}
                      onChange={(e) =>
                        setFormSellingPrice(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="text-xs h-9 font-semibold text-amber-600 dark:text-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons Action */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModelModal(false);
                    resetForm();
                  }}
                  className="text-xs h-9 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={submitting}
                  className="text-xs h-9 font-semibold cursor-pointer gap-1.5"
                >
                  {submitting ? "Menyimpan..." : editingProduct ? "Perbarui Model" : "Simpan Model Baru"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Tambah Kategori Produk */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Tag className="h-4 w-4 text-amber-500" /> Tambah Kategori Produk Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nama Kategori Baru
                </label>
                <Input
                  required
                  placeholder="Contoh: Lampu Hias, Dekorasi Meja, Aksesori"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCategoryModal(false)}
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
                  {submitting ? "Menyimpan..." : "Simpan Kategori"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
