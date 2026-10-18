"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import {
  ElsProductItem,
  ElsFilamentPrice,
  ElsPrinterConfig,
  ElsAccessoryPrice,
  ElsDepreciationAsset,
  ElsCalculationAssumptions,
  ElsOverheadItem,
  ElsCapitalConfig,
  DEFAULT_ELS_PRODUCTS,
  DEFAULT_ELS_FILAMENTS,
  DEFAULT_ELS_PRINTERS,
  DEFAULT_ELS_ACCESSORIES,
  DEFAULT_ELS_DEPRECIATION_ASSETS,
  DEFAULT_ELS_ASSUMPTIONS,
  CASAMORAL_SHOPEE_ASSUMPTIONS,
  DEFAULT_ELS_OVERHEAD_ITEMS,
  DEFAULT_ELS_CAPITAL,
  CASAMORAL_REAL_CAPITAL,
  calculateAssetsDepreciation,
  calculateElsProductRow,
  calculateElsStudioSummary,
} from "@/lib/financial/els-studio-engine";
import {
  syncElsProductToMasterCatalogAction,
  batchSyncElsProductsAction,
  fetchMasterProductsForElsAction,
  SyncElsProductPayload,
} from "./actions";
import { FinancialGlossaryModalButton } from "@/components/financial-indicator-guide";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator,
  Sliders,
  DollarSign,
  Printer,
  Package,
  TrendingUp,
  Lightbulb,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Download,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  UploadCloud,
  RefreshCw,
  Check,
  AlertCircle,
  X,
  Store,
  Layers,
} from "lucide-react";

const STORAGE_KEY = "casamoral_els_studio_config_v2";

export function ElsCalculatorClient() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "ASSUMPTIONS" | "DEPRECIATION" | "BEP" | "TIPS">("PRODUCTS");

  // State for all data structures
  const [products, setProducts] = useState<ElsProductItem[]>(DEFAULT_ELS_PRODUCTS);
  const [filaments, setFilaments] = useState<ElsFilamentPrice[]>(DEFAULT_ELS_FILAMENTS);
  const [printers, setPrinters] = useState<ElsPrinterConfig[]>(DEFAULT_ELS_PRINTERS);
  const [accessories, setAccessories] = useState<ElsAccessoryPrice[]>(DEFAULT_ELS_ACCESSORIES);
  const [assets, setAssets] = useState<ElsDepreciationAsset[]>(DEFAULT_ELS_DEPRECIATION_ASSETS);
  const [assumptions, setAssumptions] = useState<ElsCalculationAssumptions>(CASAMORAL_SHOPEE_ASSUMPTIONS);
  const [overheadItems, setOverheadItems] = useState<ElsOverheadItem[]>(DEFAULT_ELS_OVERHEAD_ITEMS);
  const [capital, setCapital] = useState<ElsCapitalConfig>(CASAMORAL_REAL_CAPITAL);

  // Persistence hydration state
  const [isHydrated, setIsHydrated] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saved">("idle");

  // Search & filter
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTipIndex, setExpandedTipIndex] = useState<number | null>(null);

  // Syncing states
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [syncAlert, setSyncAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [syncedProductIds, setSyncedProductIds] = useState<Record<string, string>>({}); // productId -> timestamp string

  // Modals
  const [editingProduct, setEditingProduct] = useState<ElsProductItem | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Inline Quick Add Modals
  const [newFilament, setNewFilament] = useState<{ brand: string; type: string; pricePerKg: number; notes: string } | null>(null);
  const [newPrinter, setNewPrinter] = useState<{ name: string; powerWatts: number; usefulLifeMonths: number; notes: string } | null>(null);
  const [newAccessory, setNewAccessory] = useState<{ name: string; price: number; unit: string; notes: string } | null>(null);
  const [newAsset, setNewAsset] = useState<{ name: string; purchasePrice: number; residualValue: number; usefulLifeMonths: number; estimatedHoursPerMonth: number; notes: string } | null>(null);
  const [newOverheadItem, setNewOverheadItem] = useState<{ name: string; amount: number; notes: string } | null>(null);

  // 1. Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.products && Array.isArray(parsed.products)) {
          // Clean up any stray nfcPcs on models that do not actually use an NFC component
          const cleanedProducts = parsed.products.map((p: ElsProductItem) => {
            const hasActualNfc =
              p.name.toLowerCase().includes("nfc") ||
              Boolean(p.accessoryQuantities && Object.entries(p.accessoryQuantities).some(([k, v]) => k.toLowerCase().includes("nfc") && (v as number) > 0));
            if (!hasActualNfc && p.nfcPcs) {
              return { ...p, nfcPcs: 0 };
            }
            return p;
          });
          setProducts(cleanedProducts);
        }
        if (parsed.filaments && Array.isArray(parsed.filaments)) setFilaments(parsed.filaments);
        if (parsed.printers && Array.isArray(parsed.printers)) setPrinters(parsed.printers);
        if (parsed.accessories && Array.isArray(parsed.accessories)) setAccessories(parsed.accessories);
        if (parsed.assets && Array.isArray(parsed.assets)) setAssets(parsed.assets);
        if (parsed.assumptions) setAssumptions(parsed.assumptions);
        if (parsed.overheadItems && Array.isArray(parsed.overheadItems)) setOverheadItems(parsed.overheadItems);
        if (parsed.capital) setCapital(parsed.capital);
      }
    } catch (e) {
      console.warn("Failed to read Casa Moral saved config from localStorage", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Auto-save to localStorage after hydration
  useEffect(() => {
    if (!isHydrated) return;
    try {
      const payload = {
        products,
        filaments,
        printers,
        accessories,
        assets,
        assumptions,
        overheadItems,
        capital,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setAutoSaveStatus("saved");
      const timer = setTimeout(() => setAutoSaveStatus("idle"), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.warn("Failed to persist Casa Moral config to localStorage", e);
    }
  }, [isHydrated, products, filaments, printers, accessories, assets, assumptions, overheadItems, capital]);

  // Calculations
  const depMap = useMemo(() => calculateAssetsDepreciation(assets), [assets]);

  const calculatedProducts = useMemo(() => {
    return products.map((p) => ({
      item: p,
      result: calculateElsProductRow(p, assumptions, filaments, printers, accessories, depMap),
    }));
  }, [products, assumptions, filaments, printers, accessories, depMap]);

  const summary = useMemo(() => {
    return calculateElsStudioSummary(products, assumptions, overheadItems, capital, assets, filaments, printers, accessories);
  }, [products, assumptions, overheadItems, capital, assets, filaments, printers, accessories]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return calculatedProducts;
    const q = searchTerm.toLowerCase();
    return calculatedProducts.filter((p) => p.item.name.toLowerCase().includes(q) || p.item.printer.toLowerCase().includes(q));
  }, [calculatedProducts, searchTerm]);

  // Real-time calculated accessories cost for the active Add/Edit modal
  const currentModalAccessoriesCost = useMemo(() => {
    if (!editingProduct) return 0;
    let sum = 0;
    for (const acc of accessories) {
      const qty =
        editingProduct.accessoryQuantities?.[acc.id] ??
        editingProduct.accessoryQuantities?.[acc.name] ??
        (acc.name.toLowerCase().includes("paracord") ? editingProduct.paracordMeter :
         acc.name.toLowerCase().includes("carabiner") ? editingProduct.carabinerPcs :
         acc.name.toLowerCase().includes("switch") ? editingProduct.switchPcs :
         acc.name.toLowerCase().includes("nfc") ? editingProduct.nfcPcs : 0) ?? 0;
      sum += (qty || 0) * (acc.price || 0);
    }
    sum += editingProduct.customHardwareCost || 0;
    return sum;
  }, [editingProduct, accessories]);

  // Handlers: Reset
  const handleResetToTemplate = () => {
    if (confirm("Reset semua konfigurasi & data kembali ke Template Default Asli Casa Moral? Data kustom Anda saat ini akan ditimpa.")) {
      setProducts(DEFAULT_ELS_PRODUCTS);
      setFilaments(DEFAULT_ELS_FILAMENTS);
      setPrinters(DEFAULT_ELS_PRINTERS);
      setAccessories(DEFAULT_ELS_ACCESSORIES);
      setAssets(DEFAULT_ELS_DEPRECIATION_ASSETS);
      setAssumptions(DEFAULT_ELS_ASSUMPTIONS);
      setOverheadItems(DEFAULT_ELS_OVERHEAD_ITEMS);
      setCapital(DEFAULT_ELS_CAPITAL);
      localStorage.removeItem(STORAGE_KEY);
      setSyncAlert({
        type: "info",
        message: "Data dan konfigurasi Casa Moral berhasil di-reset ke template awal.",
      });
    }
  };

  // Product Add / Edit
  const handleOpenAddProduct = () => {
    const nextNo = products.length > 0 ? Math.max(...products.map((p) => p.no)) + 1 : 1;
    const defaultPrinterName = printers[0]?.name || "A1";
    const defaultFilamentBrand = filaments[0]?.brand || "Bambu Lab (Original)";

    setEditingProduct({
      id: `custom-p-${Date.now()}`,
      no: nextNo,
      name: `Produk Baru ${nextNo}`,
      printer: defaultPrinterName,
      filamentBrand: defaultFilamentBrand,
      weightGram: 25,
      printTimeMinutes: 45,
      purgeWasteFactor: 0.05,
      paracordMeter: 0,
      carabinerPcs: 0,
      switchPcs: 0,
      nfcPcs: 0,
      accessoryQuantities: {},
      packagingPackage: 1,
      customHardwareCost: 0,
      sellingPrice: 35000,
      freeShippingXtra: true,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const exists = products.some((p) => p.id === editingProduct.id);
    if (exists) {
      setProducts(products.map((p) => (p.id === editingProduct.id ? editingProduct : p)));
    } else {
      setProducts([...products, editingProduct]);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Hapus produk ini dari daftar kalkulasi Casa Moral?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  // Synchronize 1 Product to Master Catalog
  const handleSyncProductToCatalog = async (p: ElsProductItem) => {
    setSyncingProductId(p.id);
    try {
      const calc = calculatedProducts.find((cp) => cp.item.id === p.id)?.result;
      const hpp = calc?.totalHpp || 0;
      const markup = calc?.markupPercent || 0;

      const payload: SyncElsProductPayload = {
        name: p.name,
        selling_price: p.sellingPrice,
        current_hpp: hpp,
        markup_percent: markup,
        print_time_minutes: p.printTimeMinutes,
        weight_gram: p.weightGram,
        printer_name: p.printer,
        filament_brand: p.filamentBrand,
      };

      const res = await syncElsProductToMasterCatalogAction(payload);
      if (res.success) {
        setSyncedProductIds((prev) => ({
          ...prev,
          [p.id]: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        }));
        setSyncAlert({
          type: "success",
          message: res.message || `Produk "${p.name}" berhasil disinkronkan ke Master Produk!`,
        });
      } else {
        setSyncAlert({
          type: "error",
          message: res.error || "Gagal menyinkronkan produk.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat sinkronisasi.";
      setSyncAlert({ type: "error", message: msg });
    } finally {
      setSyncingProductId(null);
    }
  };

  // Batch Synchronize All Products to Master Catalog
  const handleBatchSyncAllProducts = async () => {
    if (products.length === 0) return;
    if (!confirm(`Sinkronkan seluruh ${products.length} model produk Casa Moral ke Master Produk & POS?`)) {
      return;
    }

    setIsBatchSyncing(true);
    try {
      const payloads: SyncElsProductPayload[] = calculatedProducts.map(({ item, result }) => ({
        name: item.name,
        selling_price: item.sellingPrice,
        current_hpp: result.totalHpp,
        markup_percent: result.markupPercent,
        print_time_minutes: item.printTimeMinutes,
        weight_gram: item.weightGram,
        printer_name: item.printer,
        filament_brand: item.filamentBrand,
      }));

      const res = await batchSyncElsProductsAction(payloads);
      if (res.success) {
        const timeStr = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        const newMap: Record<string, string> = {};
        products.forEach((p) => {
          newMap[p.id] = timeStr;
        });
        setSyncedProductIds(newMap);
        setSyncAlert({
          type: "success",
          message: res.message || "Seluruh produk berhasil disinkronkan ke Master Produk!",
        });
      } else {
        setSyncAlert({
          type: "error",
          message: res.error || "Gagal melakukan batch sinkronisasi.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat sinkronisasi batch.";
      setSyncAlert({ type: "error", message: msg });
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // Import Products from Master Catalog
  const handleImportFromMasterCatalog = async () => {
    setIsImporting(true);
    try {
      const res = await fetchMasterProductsForElsAction();
      if (res.success && res.products.length > 0) {
        let addedCount = 0;
        const newItems: ElsProductItem[] = [...products];

        for (const mp of res.products) {
          const already = newItems.some(
            (p) => p.name.toLowerCase() === mp.name.toLowerCase()
          );
          if (!already) {
            const nextNo = newItems.length + 1;
            newItems.push({
              id: `imported-${mp.id}`,
              no: nextNo,
              name: mp.name,
              printer: printers[0]?.name || "A1",
              filamentBrand: filaments[0]?.brand || "Bambu Lab (Original)",
              weightGram: mp.total_filament_gram || 25,
              printTimeMinutes: mp.print_time_minutes || 60,
              purgeWasteFactor: 0.05,
              paracordMeter: 0,
              carabinerPcs: 0,
              switchPcs: 0,
              nfcPcs: 0,
              packagingPackage: 1,
              customHardwareCost: 0,
              sellingPrice: mp.selling_price || 35000,
              freeShippingXtra: true,
            });
            addedCount++;
          }
        }

        setProducts(newItems);
        setSyncAlert({
          type: "success",
          message: `Berhasil mengimpor ${addedCount} produk baru dari Master Produk ke Kalkulator Casa Moral!`,
        });
      } else {
        setSyncAlert({
          type: "info",
          message: "Tidak ada produk baru yang dapat diimpor dari master produk.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengimpor produk.";
      setSyncAlert({ type: "error", message: msg });
    } finally {
      setIsImporting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "No",
      "Nama Produk",
      "Printer",
      "Merk Filament",
      "Berat (gram)",
      "Waktu Print (menit)",
      "Biaya Filament (Rp)",
      "Biaya Listrik (Rp)",
      "Depresiasi Mesin (Rp)",
      "Kegagalan Print (Rp)",
      "Biaya Aksesoris (Rp)",
      "Biaya Packing (Rp)",
      "Staff Packing (Rp)",
      "Total HPP (Rp)",
      "Harga Jual (Rp)",
      "Admin Shopee (Rp)",
      "Ongkir Xtra (Rp)",
      "Profit Kotor (Rp)",
      "Margin (%)",
      "Markup (%)",
    ];

    const rows = calculatedProducts.map(({ item, result }) => [
      item.no,
      `"${item.name.replace(/"/g, '""')}"`,
      item.printer,
      item.filamentBrand,
      item.weightGram,
      item.printTimeMinutes,
      result.filamentCost,
      result.electricityCost,
      result.depreciationCost,
      result.failureCost,
      result.totalAccessoriesCost,
      result.packagingCost,
      result.staffPackingCost,
      result.totalHpp,
      item.sellingPrice,
      result.adminShopeeCost,
      result.freeShippingCost,
      result.grossProfit,
      result.grossMarginPercent,
      result.markupPercent,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HPP_CASA_MORAL_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Executive Summary Strip */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" className="bg-amber-600 text-white font-semibold">
                CASA MORAL COMPLETE ENGINE
              </Badge>
              <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px]">
                Dasar Penetapan Model & Harga Katalog
              </Badge>
              {autoSaveStatus === "saved" && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium animate-pulse">
                  <Check className="h-3 w-3" /> Tersimpan Otomatis (Browser)
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
              Kalkulator Biaya Produksi, HPP & Sinkronisasi Master Produk
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-3xl">
              Platform perhitungan menyeluruh: setiap parameter (printer yang dimiliki, merk filamen, aksesoris, alokasi karyawan, hingga biaya overhead) dapat disesuaikan tanpa batasan hardcode.
              Ubah angka di sini, dan sinkronkan langsung ke Master Produk, Kasir POS, dan Rekap Keuangan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FinancialGlossaryModalButton />
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToTemplate}
              className="text-xs gap-1.5 cursor-pointer hover:border-amber-500"
              title="Reset ke pengaturan default Casa Moral"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Template
            </Button>
            <Button
              size="sm"
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Sync Alert Banner if any */}
        {syncAlert && (
          <div
            className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-200 ${
              syncAlert.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200"
                : syncAlert.type === "error"
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200"
                : "bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-800 dark:text-blue-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {syncAlert.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : syncAlert.type === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              ) : (
                <Layers className="h-4 w-4 shrink-0 text-blue-600" />
              )}
              <span>{syncAlert.message}</span>
            </div>
            <button
              onClick={() => setSyncAlert(null)}
              className="p-1 hover:opacity-75 cursor-pointer text-zinc-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 6 High-Level Quick Stats from Sheet 1 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-amber-500/20">
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
              Total Modal Awal
            </span>
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              {formatRupiah(summary.totalInitialCapital)}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">{printers.length} Printer + Stok</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
              Estimasi Balik Modal
            </span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">
              {summary.paybackPeriodMonths === 999 ? "∞ (Rugi)" : `${summary.paybackPeriodMonths} Bulan`}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              @ {assumptions.targetMonthlyUnits} unit/bln
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
              BEP Unit / Bulan
            </span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {summary.bepUnitsMonthly} Unit
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              ~{summary.bepUnitsDaily} unit / hari
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
              Rata-rata Margin
            </span>
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              {summary.averageMarginPercent}%
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Katalog {products.length} Model</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
              Depresiasi Mesin
            </span>
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              {formatRupiah(summary.totalMonthlyDepreciation)}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">/ bulan ({assets.length} aset)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-semibold text-zinc-500 block uppercase tracking-wider">
              Total Overhead Bulanan
            </span>
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              {formatRupiah(summary.totalOverheadMonthly)}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">Dapat diatur ke Rp 0</span>
          </div>
        </div>
      </div>

      {/* Sheet Tabs Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("PRODUCTS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "PRODUCTS"
              ? "bg-white dark:bg-zinc-900 border-t-2 border-t-amber-500 border-x border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 font-bold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Calculator className="h-4 w-4" /> 📋 HPP & Model Produk ({products.length})
        </button>

        <button
          onClick={() => setActiveTab("ASSUMPTIONS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "ASSUMPTIONS"
              ? "bg-white dark:bg-zinc-900 border-t-2 border-t-amber-500 border-x border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 font-bold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Sliders className="h-4 w-4" /> ⚙️ Data Filamen, Printer & Aksesoris ({filaments.length} filamen, {printers.length} printer)
        </button>

        <button
          onClick={() => setActiveTab("DEPRECIATION")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "DEPRECIATION"
              ? "bg-white dark:bg-zinc-900 border-t-2 border-t-amber-500 border-x border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 font-bold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Printer className="h-4 w-4" /> 🖨️ Depresiasi Aset Mesin ({assets.length})
        </button>

        <button
          onClick={() => setActiveTab("BEP")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "BEP"
              ? "bg-white dark:bg-zinc-900 border-t-2 border-t-amber-500 border-x border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 font-bold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <TrendingUp className="h-4 w-4" /> 📊 Biaya Operasional & BEP ({overheadItems.length} pos biaya)
        </button>

        <button
          onClick={() => setActiveTab("TIPS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "TIPS"
              ? "bg-white dark:bg-zinc-900 border-t-2 border-t-amber-500 border-x border-zinc-200 dark:border-zinc-800 text-amber-600 dark:text-amber-400 font-bold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Lightbulb className="h-4 w-4" /> 💡 9 Rekomendasi Bisnis
        </button>
      </div>

      {/* TAB 1: 📋 HPP per Produk & Sinkronisasi */}
      {activeTab === "PRODUCTS" && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Cari model produk atau nama printer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 hidden sm:inline">
                Menampilkan <strong>{filteredProducts.length}</strong> dari {products.length} model
              </span>

              {/* Action: Import from Master Catalog */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleImportFromMasterCatalog}
                disabled={isImporting}
                className="text-xs gap-1.5 h-9 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Tarik produk yang ada di Master Produk untuk dihitung di Kalkulator Casa Moral"
              >
                <Store className={`h-3.5 w-3.5 ${isImporting ? "animate-spin" : ""}`} />
                {isImporting ? "Mengimpor..." : "Impor dari Master"}
              </Button>

              {/* Action: Batch Sync to Master Catalog */}
              <Button
                size="sm"
                onClick={handleBatchSyncAllProducts}
                disabled={isBatchSyncing}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9 cursor-pointer shadow-sm"
                title="Sinkronkan seluruh harga & HPP ke Master Produk untuk dipakai POS & Order"
              >
                <UploadCloud className={`h-3.5 w-3.5 ${isBatchSyncing ? "animate-spin" : ""}`} />
                {isBatchSyncing ? "Menyinkronkan..." : "Sinkronkan Semua ke Master"}
              </Button>

              {/* Action: Add Product */}
              <Button
                size="sm"
                onClick={handleOpenAddProduct}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1 cursor-pointer h-9 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Model
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[600px]">
              <Table className="text-xs">
                <TableHeader className="bg-zinc-100/90 dark:bg-zinc-900 sticky top-0 z-10">
                  <TableRow className="border-b border-zinc-200 dark:border-zinc-800 font-bold">
                    <TableHead className="w-10 text-center">No</TableHead>
                    <TableHead className="min-w-[170px]">Nama Model Produk</TableHead>
                    <TableHead className="min-w-[90px]">Printer</TableHead>
                    <TableHead className="min-w-[120px]">Filament</TableHead>
                    <TableHead className="text-right">Berat (g)</TableHead>
                    <TableHead className="text-right">Waktu (mnt)</TableHead>
                    <TableHead className="text-right">Biaya Filamen</TableHead>
                    <TableHead className="text-right">Biaya Listrik</TableHead>
                    <TableHead className="text-right">Depr. Mesin</TableHead>
                    <TableHead className="text-right text-rose-500">Reject {Math.round(assumptions.rejectRate * 100)}%</TableHead>
                    <TableHead className="text-right">Aksesoris</TableHead>
                    <TableHead className="text-right">Packing</TableHead>
                    <TableHead className="text-right">Staff</TableHead>
                    <TableHead className="text-right font-extrabold text-amber-700 dark:text-amber-400 bg-amber-500/10">
                      TOTAL HPP
                    </TableHead>
                    <TableHead className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                      Harga Jual
                    </TableHead>
                    <TableHead className="text-right text-orange-600">Shopee Admin</TableHead>
                    <TableHead className="text-right text-orange-600">Ongkir Xtra</TableHead>
                    <TableHead className="text-right font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                      Laba Kotor
                    </TableHead>
                    <TableHead className="text-right font-bold">Margin</TableHead>
                    <TableHead className="text-right">Markup</TableHead>
                    <TableHead className="text-center min-w-[110px]">Sinkron & Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(({ item, result }) => {
                    const isSyncingThis = syncingProductId === item.id;
                    const syncedAt = syncedProductIds[item.id];
                    return (
                      <TableRow key={item.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800/60">
                        <TableCell className="text-center font-mono text-zinc-400">{item.no}</TableCell>
                        <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {item.name}
                            </span>
                            {syncedAt && (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
                                <Check className="h-2.5 w-2.5" /> Ter-sinkron ({syncedAt})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] py-0">
                            {item.printer}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-600 dark:text-zinc-400 text-[11px] truncate max-w-[130px]" title={item.filamentBrand}>
                          {item.filamentBrand}
                        </TableCell>
                        <TableCell className="text-right">{item.weightGram}g</TableCell>
                        <TableCell className="text-right">{item.printTimeMinutes}m</TableCell>
                        <TableCell className="text-right text-zinc-700 dark:text-zinc-300">
                          {formatRupiah(result.filamentCost)}
                        </TableCell>
                        <TableCell className="text-right text-zinc-700 dark:text-zinc-300">
                          {formatRupiah(result.electricityCost)}
                        </TableCell>
                        <TableCell className="text-right text-zinc-700 dark:text-zinc-300">
                          {formatRupiah(result.depreciationCost)}
                        </TableCell>
                        <TableCell className="text-right text-rose-500 font-mono">
                          {formatRupiah(result.failureCost)}
                        </TableCell>
                        <TableCell className="text-right text-zinc-700 dark:text-zinc-300">
                          {formatRupiah(result.totalAccessoriesCost)}
                        </TableCell>
                        <TableCell className="text-right text-zinc-700 dark:text-zinc-300">
                          {formatRupiah(result.packagingCost)}
                        </TableCell>
                        <TableCell className="text-right text-zinc-700 dark:text-zinc-300">
                          {formatRupiah(result.staffPackingCost)}
                        </TableCell>
                        <TableCell className="text-right font-black text-amber-700 dark:text-amber-400 bg-amber-500/10">
                          {formatRupiah(result.totalHpp)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-zinc-900 dark:text-zinc-100">
                          {formatRupiah(item.sellingPrice)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatRupiah(result.adminShopeeCost)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatRupiah(result.freeShippingCost)}
                        </TableCell>
                        <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                          {formatRupiah(result.grossProfit)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-zinc-800 dark:text-zinc-200">
                          {result.grossMarginPercent}%
                        </TableCell>
                        <TableCell className="text-right text-zinc-500">
                          +{result.markupPercent}%
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Sync 1 Product Button */}
                            <button
                              onClick={() => handleSyncProductToCatalog(item)}
                              disabled={isSyncingThis}
                              className="p-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer border border-blue-200 dark:border-blue-800"
                              title="Terapkan harga & HPP produk ini ke Master Produk / POS"
                            >
                              <UploadCloud className={`h-3.5 w-3.5 ${isSyncingThis ? "animate-spin text-amber-600" : ""}`} />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => {
                                setEditingProduct({
                                  ...item,
                                  accessoryQuantities: item.accessoryQuantities ? { ...item.accessoryQuantities } : {},
                                });
                                setIsProductModalOpen(true);
                              }}
                              className="p-1 rounded text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                              title="Edit Parameter Model"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteProduct(item.id)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="Hapus Model"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ⚙️ Data Filamen, Printer & Aksesoris */}
      {activeTab === "ASSUMPTIONS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card A: Dynamic Filament Price Reference */}
            <Card>
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-600" /> A. Harga Filamen (per Kg)
                    </CardTitle>
                    <CardDescription>
                      Daftar filamen yang Anda miliki. Tambah, edit merk/harga, atau hapus brand yang tidak Anda pakai.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setNewFilament({
                        brand: "",
                        type: "PLA Basic",
                        pricePerKg: 160000,
                        notes: "Brand pilihan Anda",
                      })
                    }
                    className="text-xs gap-1 h-7 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Tambah Filamen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Form Quick Add Filament if open */}
                {newFilament && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-400 block">
                      Tambah Merk Filamen Baru
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500">Nama Merk/Brand</label>
                        <Input
                          placeholder="misal: Polymaker, Sunlu, Kingroon"
                          value={newFilament.brand}
                          onChange={(e) => setNewFilament({ ...newFilament, brand: e.target.value })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Tipe / Material</label>
                        <Input
                          placeholder="misal: PLA Basic, PLA+, PETG"
                          value={newFilament.type}
                          onChange={(e) => setNewFilament({ ...newFilament, type: e.target.value })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Harga per Kg (Rp)</label>
                        <Input
                          type="number"
                          value={newFilament.pricePerKg}
                          onChange={(e) => setNewFilament({ ...newFilament, pricePerKg: parseFloat(e.target.value) || 0 })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Catatan</label>
                        <Input
                          placeholder="misal: Beli di Shopee Official"
                          value={newFilament.notes}
                          onChange={(e) => setNewFilament({ ...newFilament, notes: e.target.value })}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setNewFilament(null)}
                        className="h-6 text-xs cursor-pointer"
                      >
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!newFilament.brand.trim()) {
                            alert("Masukkan nama merk filamen!");
                            return;
                          }
                          setFilaments([
                            ...filaments,
                            {
                              id: `fil-custom-${Date.now()}`,
                              brand: newFilament.brand.trim(),
                              type: newFilament.type.trim(),
                              pricePerKg: newFilament.pricePerKg,
                              notes: newFilament.notes.trim(),
                            },
                          ]);
                          setNewFilament(null);
                        }}
                        className="h-6 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                      >
                        Simpan Filamen
                      </Button>
                    </div>
                  </div>
                )}

                {filaments.map((f, idx) => (
                  <div
                    key={f.id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Input
                          value={f.brand}
                          onChange={(e) => {
                            const copy = [...filaments];
                            copy[idx].brand = e.target.value;
                            setFilaments(copy);
                          }}
                          className="h-7 text-xs font-bold w-44"
                          placeholder="Nama Brand"
                        />
                        <Input
                          value={f.type}
                          onChange={(e) => {
                            const copy = [...filaments];
                            copy[idx].type = e.target.value;
                            setFilaments(copy);
                          }}
                          className="h-7 text-[11px] text-zinc-500 w-28"
                          placeholder="Tipe Material"
                        />
                      </div>
                      <Input
                        value={f.notes || ""}
                        onChange={(e) => {
                          const copy = [...filaments];
                          copy[idx].notes = e.target.value;
                          setFilaments(copy);
                        }}
                        className="h-6 text-[10px] text-zinc-400 w-full"
                        placeholder="Catatan sumber / kualitas"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-zinc-400">Rp</span>
                        <Input
                          type="number"
                          value={f.pricePerKg}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const copy = [...filaments];
                            copy[idx].pricePerKg = val;
                            setFilaments(copy);
                          }}
                          className="h-7 w-24 text-xs text-right font-mono"
                        />
                        <span className="text-[10px] text-zinc-400">/kg</span>
                      </div>
                      <button
                        onClick={() => {
                          if (filaments.length <= 1) {
                            alert("Minimal harus ada 1 merk filamen!");
                            return;
                          }
                          if (confirm(`Hapus filamen "${f.brand}"?`)) {
                            setFilaments(filaments.filter((_, i) => i !== idx));
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-600 cursor-pointer"
                        title="Hapus Merk Filamen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Card B: Dynamic Printer & Electricity Assumptions */}
            <Card>
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-600" /> B. Printer, Listrik PLN & Reject Rate
                    </CardTitle>
                    <CardDescription>
                      Daftar printer 3D Anda (Daya Watt & Umur Ekonomis) dan tarif operasional riil.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setNewPrinter({
                        name: "",
                        powerWatts: 100,
                        usefulLifeMonths: 24,
                        notes: "Printer kustom",
                      })
                    }
                    className="text-xs gap-1 h-7 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Tambah Printer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Form Quick Add Printer */}
                {newPrinter && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-400 block">
                      Tambah Unit Printer Baru
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] text-zinc-500">Nama Printer</label>
                        <Input
                          placeholder="misal: Bambu Lab P1S, Ender 3 V3, Flashforge"
                          value={newPrinter.name}
                          onChange={(e) => setNewPrinter({ ...newPrinter, name: e.target.value })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Daya (Watt)</label>
                        <Input
                          type="number"
                          value={newPrinter.powerWatts}
                          onChange={(e) => setNewPrinter({ ...newPrinter, powerWatts: parseFloat(e.target.value) || 0 })}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setNewPrinter(null)}
                        className="h-6 text-xs cursor-pointer"
                      >
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!newPrinter.name.trim()) {
                            alert("Masukkan nama printer!");
                            return;
                          }
                          setPrinters([
                            ...printers,
                            {
                              id: `prt-custom-${Date.now()}`,
                              name: newPrinter.name.trim(),
                              powerWatts: newPrinter.powerWatts,
                              usefulLifeMonths: newPrinter.usefulLifeMonths || 24,
                              notes: newPrinter.notes,
                            },
                          ]);
                          setNewPrinter(null);
                        }}
                        className="h-6 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                      >
                        Simpan Printer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Dynamic Printer Grid */}
                <div className="space-y-2">
                  <span className="font-semibold block text-zinc-700 dark:text-zinc-300">
                    Printer yang Dimiliki ({printers.length} Unit):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {printers.map((p, idx) => (
                      <div
                        key={p.id || idx}
                        className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <Input
                            value={p.name}
                            onChange={(e) => {
                              const copy = [...printers];
                              copy[idx].name = e.target.value;
                              setPrinters(copy);
                            }}
                            className="h-6 text-xs font-bold w-28"
                            placeholder="Nama Printer"
                          />
                          <button
                            onClick={() => {
                              if (printers.length <= 1) {
                                alert("Minimal harus ada 1 printer!");
                                return;
                              }
                              if (confirm(`Hapus printer "${p.name}"?`)) {
                                setPrinters(printers.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 cursor-pointer"
                            title="Hapus Printer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={p.powerWatts}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const copy = [...printers];
                                copy[idx].powerWatts = val;
                                setPrinters(copy);
                              }}
                              className="h-6 w-16 text-xs font-mono"
                            />
                            <span className="text-[10px] text-zinc-500">Watt</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={p.usefulLifeMonths}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 1;
                                const copy = [...printers];
                                copy[idx].usefulLifeMonths = val;
                                setPrinters(copy);
                              }}
                              className="h-6 w-14 text-xs font-mono"
                            />
                            <span className="text-[10px] text-zinc-500">Bulan</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tariff PLN & Reject Rate */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                      Tarif Listrik PLN (Rp/kWh)
                    </label>
                    <Input
                      type="number"
                      value={assumptions.electricityTariffPLN}
                      onChange={(e) =>
                        setAssumptions({
                          ...assumptions,
                          electricityTariffPLN: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-8 text-xs font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Gol. R1 1300-2200VA: Rp 1.666/kWh</span>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                      Reject / Failure Rate (%)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        value={assumptions.rejectRate * 100}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            rejectRate: (parseFloat(e.target.value) || 0) / 100,
                          })
                        }
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-zinc-500">%</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Alokasi kegagalan print</span>
                  </div>
                </div>

                {/* Platform Shopee Fees & Taxes */}
                <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                      Potongan Marketplace Shopee (Sesuai Struktur Toko Anda)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAssumptions({
                          ...assumptions,
                          adminShopeeRate: 0.095,
                          orderProcessingFee: 1250,
                          pph22Rate: 0.005,
                          freeShippingRate: 0,
                        })
                      }
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-semibold"
                    >
                      ⚡ Reset ke Formula Toko (9.5% + Rp 1.250 + 0.5%)
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                        Admin Shopee (%)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={(assumptions.adminShopeeRate * 100).toFixed(1)}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            adminShopeeRate: (parseFloat(e.target.value) || 0) / 100,
                          })
                        }
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">Kategori Dekorasi: 9.5%</span>
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                        Biaya Proses (Rp)
                      </label>
                      <Input
                        type="number"
                        value={assumptions.orderProcessingFee ?? 1250}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            orderProcessingFee: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">Flat Rp 1.250 / pesanan</span>
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                        Pajak PPh 22 (%)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={((assumptions.pph22Rate ?? 0.005) * 100).toFixed(1)}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            pph22Rate: (parseFloat(e.target.value) || 0) / 100,
                          })
                        }
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">PPh 22 Final UMKM: 0.5%</span>
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                        Gratis Ongkir Xtra (%)
                      </label>
                      <Input
                        type="number"
                        value={(assumptions.freeShippingRate * 100).toFixed(1)}
                        onChange={(e) =>
                          setAssumptions({
                            ...assumptions,
                            freeShippingRate: (parseFloat(e.target.value) || 0) / 100,
                          })
                        }
                        className="h-8 text-xs font-mono"
                      />
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">0% jika tidak aktif</span>
                    </div>
                  </div>
                </div>

                {/* Staff Packing & Target Volume */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                      Gaji Staff Packing (Rp/bln)
                    </label>
                    <Input
                      type="number"
                      value={assumptions.staffPackingSalary}
                      onChange={(e) =>
                        setAssumptions({
                          ...assumptions,
                          staffPackingSalary: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-8 text-xs font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">
                      {assumptions.staffPackingSalary === 0
                        ? "Tanpa staff packing (Alokasi: Rp 0/unit)"
                        : `Alokasi packing: ${formatRupiah(assumptions.staffPackingSalary / (assumptions.targetMonthlyUnits || 1))}/unit`}
                    </span>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1 text-zinc-700 dark:text-zinc-300">
                      Target Volume (Unit/bln)
                    </label>
                    <Input
                      type="number"
                      value={assumptions.targetMonthlyUnits}
                      onChange={(e) =>
                        setAssumptions({
                          ...assumptions,
                          targetMonthlyUnits: parseFloat(e.target.value) || 1,
                        })
                      }
                      className="h-8 text-xs font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Dasar pembagian biaya tetap per unit</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card C: Dynamic Accessories & Packaging */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-600" /> C. Daftar Harga Aksesoris & Bahan Kemasan
                  </CardTitle>
                  <CardDescription>
                    Komponen pelengkap (gantungan, baut, switch clicker, NFC, box kemasan). Sesuaikan nama dan harganya.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-xs">
                    <span className="text-[10px] text-zinc-500">Harga Paket Packing Standard: Rp</span>
                    <Input
                      type="number"
                      value={assumptions.packagingPackagePrice}
                      onChange={(e) =>
                        setAssumptions({
                          ...assumptions,
                          packagingPackagePrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-6 w-20 text-xs text-right font-mono"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setNewAccessory({
                        name: "",
                        price: 1500,
                        unit: "per pcs",
                        notes: "",
                      })
                    }
                    className="text-xs gap-1 h-8 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Tambah Aksesoris
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Form Quick Add Accessory */}
              {newAccessory && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-400 block">
                    Tambah Aksesoris / Bahan Kemasan Baru
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500">Nama Komponen</label>
                      <Input
                        placeholder="misal: Baut M3, Magnet, Lakban"
                        value={newAccessory.name}
                        onChange={(e) => setNewAccessory({ ...newAccessory, name: e.target.value })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Satuan (Unit)</label>
                      <Input
                        placeholder="per pcs, per meter, per lembar"
                        value={newAccessory.unit}
                        onChange={(e) => setNewAccessory({ ...newAccessory, unit: e.target.value })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Harga Satuan (Rp)</label>
                      <Input
                        type="number"
                        value={newAccessory.price}
                        onChange={(e) => setNewAccessory({ ...newAccessory, price: parseFloat(e.target.value) || 0 })}
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setNewAccessory(null)}
                      className="h-6 text-xs cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newAccessory.name.trim()) {
                          alert("Masukkan nama aksesoris!");
                          return;
                        }
                        setAccessories([
                          ...accessories,
                          {
                            id: `acc-custom-${Date.now()}`,
                            name: newAccessory.name.trim(),
                            price: newAccessory.price,
                            unit: newAccessory.unit.trim() || "per pcs",
                            notes: newAccessory.notes,
                          },
                        ]);
                        setNewAccessory(null);
                      }}
                      className="h-6 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                    >
                      Simpan Komponen
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {accessories.map((acc, idx) => (
                  <div
                    key={acc.id || idx}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Input
                        value={acc.name}
                        onChange={(e) => {
                          const copy = [...accessories];
                          copy[idx].name = e.target.value;
                          setAccessories(copy);
                        }}
                        className="h-6 text-xs font-bold"
                        placeholder="Nama Komponen"
                      />
                      <button
                        onClick={() => {
                          if (confirm(`Hapus aksesoris "${acc.name}"?`)) {
                            setAccessories(accessories.filter((_, i) => i !== idx));
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-600 cursor-pointer ml-1"
                        title="Hapus"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        value={acc.unit}
                        onChange={(e) => {
                          const copy = [...accessories];
                          copy[idx].unit = e.target.value;
                          setAccessories(copy);
                        }}
                        className="h-6 text-[10px] text-zinc-500 w-24"
                        placeholder="Satuan"
                      />
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] text-zinc-400">Rp</span>
                        <Input
                          type="number"
                          value={acc.price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const copy = [...accessories];
                            copy[idx].price = val;
                            setAccessories(copy);
                          }}
                          className="h-6 w-20 text-xs font-mono text-right"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: 🖨️ Depresiasi Aset Mesin & Peralatan */}
      {activeTab === "DEPRECIATION" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Printer className="h-4 w-4 text-amber-600" /> Depresiasi Aset Mesin & Peralatan (Metode Garis Lurus)
                  </CardTitle>
                  <CardDescription>
                    Rumus: <code>Depresiasi/Bln = (Beli - Residu) / Umur</code>, dan <code>Depresiasi/Jam = Depresiasi Bln / Jam Pakai</code>.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-500 block">Total Depresiasi Bulanan:</span>
                    <span className="text-base font-black text-amber-600 dark:text-amber-400">
                      {formatRupiah(summary.totalMonthlyDepreciation)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setNewAsset({
                        name: "",
                        purchasePrice: 5000000,
                        residualValue: 500000,
                        usefulLifeMonths: 24,
                        estimatedHoursPerMonth: 150,
                        notes: "Peralatan studio",
                      })
                    }
                    className="text-xs gap-1 h-8 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Tambah Aset Mesin
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {/* Form Quick Add Asset */}
              {newAsset && (
                <div className="p-4 bg-amber-500/10 border-b border-amber-500/30 space-y-2 text-xs">
                  <span className="font-bold text-amber-800 dark:text-amber-400 block">
                    Tambah Aset Mesin / Peralatan Baru
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500">Nama Aset</label>
                      <Input
                        placeholder="misal: Bambu P1S, Solder, PC"
                        value={newAsset.name}
                        onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Harga Beli (Rp)</label>
                      <Input
                        type="number"
                        value={newAsset.purchasePrice}
                        onChange={(e) => setNewAsset({ ...newAsset, purchasePrice: parseFloat(e.target.value) || 0 })}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Nilai Residu (Rp)</label>
                      <Input
                        type="number"
                        value={newAsset.residualValue}
                        onChange={(e) => setNewAsset({ ...newAsset, residualValue: parseFloat(e.target.value) || 0 })}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Umur (Bulan)</label>
                      <Input
                        type="number"
                        value={newAsset.usefulLifeMonths}
                        onChange={(e) => setNewAsset({ ...newAsset, usefulLifeMonths: parseFloat(e.target.value) || 1 })}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Jam Pakai / Bln</label>
                      <Input
                        type="number"
                        value={newAsset.estimatedHoursPerMonth}
                        onChange={(e) => setNewAsset({ ...newAsset, estimatedHoursPerMonth: parseFloat(e.target.value) || 1 })}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setNewAsset(null)}
                      className="h-6 text-xs cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newAsset.name.trim()) {
                          alert("Masukkan nama aset!");
                          return;
                        }
                        setAssets([
                          ...assets,
                          {
                            id: `dep-custom-${Date.now()}`,
                            name: newAsset.name.trim(),
                            purchasePrice: newAsset.purchasePrice,
                            residualValue: newAsset.residualValue,
                            usefulLifeMonths: newAsset.usefulLifeMonths,
                            estimatedHoursPerMonth: newAsset.estimatedHoursPerMonth,
                            notes: newAsset.notes,
                          },
                        ]);
                        setNewAsset(null);
                      }}
                      className="h-6 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                    >
                      Simpan Aset
                    </Button>
                  </div>
                </div>
              )}

              <Table className="text-xs">
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                  <TableRow>
                    <TableHead className="font-bold min-w-[160px]">Aset / Mesin</TableHead>
                    <TableHead className="text-right">Harga Beli (Rp)</TableHead>
                    <TableHead className="text-right">Nilai Residu (Rp)</TableHead>
                    <TableHead className="text-right">Umur (Bln)</TableHead>
                    <TableHead className="text-right">Jam Pakai / Bln</TableHead>
                    <TableHead className="text-right font-bold text-amber-700 dark:text-amber-400">
                      Depresiasi / Bulan
                    </TableHead>
                    <TableHead className="text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                      Depresiasi / Jam
                    </TableHead>
                    <TableHead className="min-w-[140px]">Catatan</TableHead>
                    <TableHead className="w-10 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset, idx) => {
                    const calc = depMap.get(asset.name) || { monthly: 0, hourly: 0 };
                    return (
                      <TableRow key={asset.id || idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                        <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">
                          <Input
                            value={asset.name}
                            onChange={(e) => {
                              const copy = [...assets];
                              copy[idx].name = e.target.value;
                              setAssets(copy);
                            }}
                            className="h-7 text-xs font-semibold"
                            placeholder="Nama Mesin / Aset"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={asset.purchasePrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const copy = [...assets];
                              copy[idx].purchasePrice = val;
                              setAssets(copy);
                            }}
                            className="h-7 w-28 text-right font-mono text-xs ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={asset.residualValue}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const copy = [...assets];
                              copy[idx].residualValue = val;
                              setAssets(copy);
                            }}
                            className="h-7 w-24 text-right font-mono text-xs ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={asset.usefulLifeMonths}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1;
                              const copy = [...assets];
                              copy[idx].usefulLifeMonths = val;
                              setAssets(copy);
                            }}
                            className="h-7 w-16 text-right font-mono text-xs ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={asset.estimatedHoursPerMonth}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 1;
                              const copy = [...assets];
                              copy[idx].estimatedHoursPerMonth = val;
                              setAssets(copy);
                            }}
                            className="h-7 w-16 text-right font-mono text-xs ml-auto"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                          {formatRupiah(calc.monthly)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(calc.hourly)} / jam
                        </TableCell>
                        <TableCell className="text-zinc-500 text-[11px]">
                          <Input
                            value={asset.notes || ""}
                            onChange={(e) => {
                              const copy = [...assets];
                              copy[idx].notes = e.target.value;
                              setAssets(copy);
                            }}
                            className="h-7 text-[11px] text-zinc-500"
                            placeholder="Catatan..."
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => {
                              if (confirm(`Hapus aset "${asset.name}"?`)) {
                                setAssets(assets.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 cursor-pointer"
                            title="Hapus Aset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: 📊 Biaya Operasional Bulanan & BEP (Overhead) */}
      {activeTab === "BEP" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section A: Dynamic Monthly Overhead Breakdown */}
            <Card>
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-amber-600" /> A. Biaya Operasional / Overhead Bulanan
                    </CardTitle>
                    <CardDescription>
                      Bebas disesuaikan: nonaktifkan atau isi Rp 0 untuk pos yang belum Anda miliki (misal tanpa desainer, tanpa karyawan).
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                      Total: {formatRupiah(summary.totalOverheadMonthly)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setNewOverheadItem({
                          name: "",
                          amount: 150000,
                          notes: "Biaya kustom",
                        })
                      }
                      className="text-xs gap-1 h-7 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Tambah Pos
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                {/* Form Quick Add Overhead Item */}
                {newOverheadItem && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
                    <span className="font-bold text-amber-800 dark:text-amber-400 block">
                      Tambah Pos Pengeluaran Overhead Bulanan
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] text-zinc-500">Nama Pos Biaya</label>
                        <Input
                          placeholder="misal: Langganan Canva Pro, Listrik Studio, Sewa Ruang"
                          value={newOverheadItem.name}
                          onChange={(e) => setNewOverheadItem({ ...newOverheadItem, name: e.target.value })}
                          className="h-7 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Nominal / Bln (Rp)</label>
                        <Input
                          type="number"
                          value={newOverheadItem.amount}
                          onChange={(e) => setNewOverheadItem({ ...newOverheadItem, amount: parseFloat(e.target.value) || 0 })}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setNewOverheadItem(null)}
                        className="h-6 text-xs cursor-pointer"
                      >
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!newOverheadItem.name.trim()) {
                            alert("Masukkan nama pos biaya!");
                            return;
                          }
                          setOverheadItems([
                            ...overheadItems,
                            {
                              id: `ovh-custom-${Date.now()}`,
                              name: newOverheadItem.name.trim(),
                              amount: newOverheadItem.amount,
                              notes: newOverheadItem.notes,
                              isActive: true,
                            },
                          ]);
                          setNewOverheadItem(null);
                        }}
                        className="h-6 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                      >
                        Simpan Pos Biaya
                      </Button>
                    </div>
                  </div>
                )}

                {/* Dynamic Overhead Items List */}
                <div className="space-y-2">
                  {overheadItems.map((item, idx) => {
                    const active = item.isActive !== false;
                    return (
                      <div
                        key={item.id || idx}
                        className={`flex items-center justify-between gap-2 p-2 rounded-lg border transition-colors ${
                          active
                            ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800"
                            : "bg-zinc-100/50 dark:bg-zinc-950/50 border-dashed border-zinc-300 dark:border-zinc-800 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={(e) => {
                              const copy = [...overheadItems];
                              copy[idx].isActive = e.target.checked;
                              setOverheadItems(copy);
                            }}
                            className="rounded accent-amber-600 cursor-pointer"
                            title="Aktifkan / Nonaktifkan pos ini"
                          />
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const copy = [...overheadItems];
                              copy[idx].name = e.target.value;
                              setOverheadItems(copy);
                            }}
                            className={`h-7 text-xs flex-1 ${!active ? "line-through text-zinc-400" : ""}`}
                            placeholder="Nama pos biaya"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-zinc-400">Rp</span>
                            <Input
                              type="number"
                              disabled={!active}
                              value={item.amount}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const copy = [...overheadItems];
                                copy[idx].amount = val;
                                setOverheadItems(copy);
                              }}
                              className="h-7 w-28 text-right font-mono text-xs"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus pos biaya "${item.name}"?`)) {
                                setOverheadItems(overheadItems.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 cursor-pointer"
                            title="Hapus pos"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Section B & C: Product Average Performance & BEP */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-600" /> B. Rata-rata Kinerja Katalog Produk
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Rata-rata Harga Jual</span>
                    <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(summary.averageSellingPrice)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Rata-rata HPP</span>
                    <span className="text-base font-extrabold text-amber-700 dark:text-amber-400">
                      {formatRupiah(summary.averageHpp)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Laba Kotor per Unit</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(summary.averageGrossProfitPerUnit)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Rata-rata Margin</span>
                    <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                      {summary.averageMarginPercent}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* BEP Cards */}
              <Card className="border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10">
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> C. Titik Impas (Break-Even Point)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">BEP Unit / Bulan</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {summary.bepUnitsMonthly}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">unit produk</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">BEP Unit / Hari</span>
                    <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                      {summary.bepUnitsDaily}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">asumsi 30 hari</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Omzet BEP / Bln</span>
                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 mt-1 block">
                      {formatRupiah(summary.bepRevenueMonthly)}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">omzet minimal</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Section D: Initial Capital & Payback Period */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-600" /> D. Modal Awal & Proyeksi Balik Modal (Payback Period)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {/* Quick Preset Buttons for Capital */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800">
                <div className="text-xs">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Pilihan Modal Awal:</span>
                  <span className="text-[11px] text-zinc-500">Pilih modal riil toko Casa Moral (Rp 11,4 jt) atau template referensi Excel</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCapital(CASAMORAL_REAL_CAPITAL)}
                    className={`text-xs gap-1.5 h-8 cursor-pointer ${
                      summary.totalInitialCapital === 11440748
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                        : "bg-white text-zinc-700 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> Modal Riil Casa Moral (Rp 11.440.748)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCapital(DEFAULT_ELS_CAPITAL)}
                    className={`text-xs gap-1.5 h-8 cursor-pointer ${
                      summary.totalInitialCapital === 35617000
                        ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Template Excel (Rp 35.617.000)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs mb-5">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-500 block mb-1">Total Modal Awal</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {formatRupiah(summary.totalInitialCapital)}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-1">
                    Printer & Setup Operasional
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-500 block mb-1">Estimasi Unit Terjual</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {summary.estimatedUnitsMonthly} Unit / bln
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-1">
                    Target kapasitas bulanan
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-zinc-500 block mb-1">Estimasi Laba Bersih / Bulan</span>
                  <span className={`text-lg font-black ${summary.estimatedMonthlyNetProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                    {formatRupiah(summary.estimatedMonthlyNetProfit)}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-1">
                    Setelah dipotong overhead {formatRupiah(summary.totalOverheadMonthly)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-amber-800 dark:text-amber-400 font-semibold block mb-1">
                    Estimasi Balik Modal
                  </span>
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {summary.paybackPeriodMonths === 999 ? "∞ (Rugi)" : `${summary.paybackPeriodMonths} Bulan`}
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80 block mt-1">
                    = Total Modal / Laba Bersih Bulanan
                  </span>
                </div>
              </div>

              {/* Editable Breakdown of Capital */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center justify-between">
                  <span>Rincian Komponen Modal Usaha (Bisa Disesuaikan Bebas):</span>
                  <span className="text-[11px] font-normal text-zinc-500">Ubah angka di bawah ini untuk melihat simulasi balik modal secara langsung</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="text-zinc-500 block mb-1">1. Aset Mesin Printer (Rp)</label>
                    <Input
                      type="number"
                      value={capital.printersTotal}
                      onChange={(e) => setCapital({ ...capital, printersTotal: Number(e.target.value) || 0 })}
                      className="h-8 text-xs font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Mesin Bambu & Anycubic</span>
                  </div>
                  <div>
                    <label className="text-zinc-500 block mb-1">2. Stok Filamen Awal (Rp)</label>
                    <Input
                      type="number"
                      value={capital.initialFilamentStock}
                      onChange={(e) => setCapital({ ...capital, initialFilamentStock: Number(e.target.value) || 0 })}
                      className="h-8 text-xs font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Filamen PETG & PLA</span>
                  </div>
                  <div>
                    <label className="text-zinc-500 block mb-1">3. Aksesoris & Kemasan (Rp)</label>
                    <Input
                      type="number"
                      value={capital.initialAccessoriesStock}
                      onChange={(e) => setCapital({ ...capital, initialAccessoriesStock: Number(e.target.value) || 0 })}
                      className="h-8 text-xs font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Fitting, bohlam, kardus</span>
                  </div>
                  <div>
                    <label className="text-zinc-500 block mb-1">4. Tools & Peralatan (Rp)</label>
                    <Input
                      type="number"
                      value={capital.finishingTools}
                      onChange={(e) => setCapital({ ...capital, finishingTools: Number(e.target.value) || 0 })}
                      className="h-8 text-xs font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Jangka sorong, tang, dsb</span>
                  </div>
                  <div>
                    <label className="text-zinc-500 block mb-1">5. Setup & Lainnya (Rp)</label>
                    <Input
                      type="number"
                      value={capital.brandingSetup}
                      onChange={(e) => setCapital({ ...capital, brandingSetup: Number(e.target.value) || 0 })}
                      className="h-8 text-xs font-mono"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">Branding, logo / Rp 0</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 5: 💡 Rekomendasi & Tips */}
      {activeTab === "TIPS" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent p-4 border border-amber-500/20">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> 9 Panduan Praktis Produksi & Bisnis 3D Printing CASA MORAL
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Disarikan dari rekomendasi & tips praktis Casa Moral untuk mengoptimalkan efisiensi, mencegah buang filamen, dan mempercepat balik modal.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "1. SETTING PRINT — HEMAT FILAMEN & CEPAT",
                points: [
                  "Catat SETIAP print yang gagal (jenis kegagalan + gram filamen yang kebuang) minimal di bulan-bulan pertama biar tahu Reject Rate riil, lalu update di Data Harga. Wajar 8-12% di awal, targetkan turun ke 2-4% setelah kalibrasi matang.",
                  "Infill 15-20% sudah cukup kuat untuk gantungan/ornamen kecil, tidak perlu di atas 25% yang membuang waktu dan filamen.",
                  "Gunakan Adaptive Layer Height di Bambu Studio untuk model detail vertikal: lebih cepat tanpa mengorbankan kualitas visual.",
                  "Untuk multicolor AMS, posisikan warna berdekatan di build plate agar purge/prime tower lebih sedikit.",
                  "Desain produk tanpa support kalau memungkinkan (chamfer, orientasi print yang tepat).",
                  "Selalu cek estimasi waktu dan gram di preview slicer sebelum print untuk akurasi kalkulator HPP.",
                ],
              },
              {
                title: "2. MANAJEMEN STOK FILAMEN (Khusus Daerah Lembap)",
                points: [
                  "Simpan filamen di dry box kedap udara + silica gel, terutama PLA/PETG yang mudah menyerap uap air penyebab stringing dan brittle.",
                  "Terapkan sistem FIFO (First-In, First-Out): filamen yang datang duluan dipakai duluan.",
                  "Timbang tiap roll saat baru dan saat tersisa sedikit; catat sisa gram agar tidak kehabisan di tengah order besar.",
                  "Sisa filamen pendek jangan dibuang: gunakan untuk test print, infill tersembunyi, atau sample warna ke customer.",
                ],
              },
              {
                title: "3. MAINTENANCE MESIN RUTIN",
                points: [
                  "Kalibrasi flow rate & vibration compensation tiap berganti brand/warna filamen.",
                  "Bersihkan dan ganti nozzle berkala (brass dicek tiap ±5kg, hardened steel lebih awet).",
                  "Cek belt tension dan pelumasan linear rail secara berkala untuk mencegah layer shifting.",
                  "Update firmware dan slicer profile berkala, uji coba di 1 mesin terlebih dahulu sebelum deploy ke semua unit.",
                ],
              },
              {
                title: "4. STRATEGI HARGA & MARGIN",
                points: [
                  "Target margin kotor minimal 40-50% untuk produk custom/personalisasi, dan 30-40% untuk produk katalog reguler.",
                  "Update kalkulasi HPP tiap ada kenaikan harga bahan baku atau tarif listrik.",
                  "Hindari perang harga di marketplace; tonjolkan diferensiasi kualitas finishing, kecepatan kirim, dan kemasan rapi.",
                ],
              },
              {
                title: "5. MARKETING (ADS & ORGANIK)",
                points: [
                  "Meta & Google Ads: mulai dari budget terukur (Rp 1-2 juta/bulan), fokus ke retargeting visitor dan lookalike audience pembeli.",
                  "Buat konten organik proses print (timelapse, swap warna AMS) di TikTok / Reels; memiliki reach organik tinggi di niche 3D printing.",
                  "Ikuti Shopee Live & Flash Sale secara selektif, selalu hitung margin menggunakan kalkulator ini sebelum menyetujui diskon.",
                  "Tawarkan paket bundling (misal isi 3) untuk meningkatkan Average Order Value (AOV).",
                ],
              },
              {
                title: "6. CASH FLOW & BALIK MODAL",
                points: [
                  "Untuk pesanan custom atau pre-order, terapkan sistem DP sebelum mulai cetak.",
                  "Setelah BEP tercapai dan cash flow positif selama 2-3 bulan berturut-turut, prioritaskan reinvestasi ke printer tambahan terlebih dahulu sebelum menambah SDM.",
                  "Sisihkan dana darurat untuk suku cadang kritis (nozzle, hotend, PTFE tube) agar tidak terjadi downtime mesin.",
                ],
              },
              {
                title: "7. EFISIENSI PRODUKSI",
                points: [
                  "Lakukan batch printing: susun beberapa produk sejenis dalam 1 plate sekali jalan untuk menghemat waktu dan listrik.",
                  "Matikan dryer/printer saat idle untuk menghemat konsumsi daya listrik non-produksi.",
                  "Print unattended (ditinggal) hanya untuk model yang sudah teruji stabilitasnya.",
                ],
              },
              {
                title: "8. QUALITY CONTROL SEBELUM PACKING",
                points: [
                  "Periksa setiap unit: warping, stringing, dan layer shifting sebelum masuk tahap packing. Reject di awal jauh lebih murah daripada retur barang.",
                  "Standarisasi urutan kemasan (plastik OPP -> produk -> bubble wrap -> box -> stiker brand).",
                  "Siapkan tang potong, torch korek mini (untuk membakar stringing halus), cutter presisi, dan amplas di meja kerja.",
                ],
              },
              {
                title: "9. LEGALITAS DESAIN & LISENSI KOMERSIAL",
                points: [
                  "Banyak file di MakerWorld/Printables/Thingiverse berlisensi Non-Commercial secara default.",
                  "Bila menjual hasil cetak karya kreator lain, pastikan memiliki lisensi komersial (CC-BY, CC0, atau Commercial Membership Patreon/MakerWorld).",
                  "Pilihan paling aman dengan margin tertinggi adalah mendesain sendiri, di mana biaya desain diserap oleh gaji Desainer 3D studio.",
                  "Simpan bukti lisensi komersial untuk tiap aset yang dijual secara legal.",
                ],
              },
            ].map((section, idx) => {
              const isOpen = expandedTipIndex === idx;
              return (
                <div key={idx} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpandedTipIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                  >
                    <span>{section.title}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2">
                      {section.points.map((p, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal / Dialog for Add / Edit Product */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-amber-600" />
                {products.some((p) => p.id === editingProduct.id) ? "Edit Parameter Model Produk" : "Tambah Model Produk Baru"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-semibold block mb-1">Nama Model Produk</label>
                  <Input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="misal: Lampu Ambient Custom, Gantungan Clicker"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Pilihan Printer</label>
                  <select
                    className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs"
                    value={editingProduct.printer}
                    onChange={(e) => setEditingProduct({ ...editingProduct, printer: e.target.value })}
                  >
                    {printers.map((pr) => (
                      <option key={pr.name} value={pr.name}>
                        {pr.name} ({pr.powerWatts}W)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Merk Filamen</label>
                  <select
                    className="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 text-xs"
                    value={editingProduct.filamentBrand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, filamentBrand: e.target.value })}
                  >
                    {filaments.map((f) => (
                      <option key={f.brand} value={f.brand}>
                        {f.brand} ({formatRupiah(f.pricePerKg)}/kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Berat Filamen (gram)</label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={editingProduct.weightGram}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weightGram: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Waktu Print (menit)</label>
                  <Input
                    type="number"
                    required
                    value={editingProduct.printTimeMinutes}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, printTimeMinutes: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Faktor Purge/Waste (0.05 = 5%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingProduct.purgeWasteFactor}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, purgeWasteFactor: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Harga Jual Target (Rp)</label>
                  <Input
                    type="number"
                    required
                    value={editingProduct.sellingPrice}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              {/* Komponen & Aksesoris Tambahan (Dinamis dari Bagian C) */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
                  <div>
                    <span className="font-bold block text-xs text-zinc-900 dark:text-zinc-100">
                      Komponen & Aksesoris Tambahan
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Otomatis tersinkronisasi dengan Bagian C ({accessories.length} komponen tersedia)
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-400 block">Subtotal Aksesoris:</span>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                      {formatRupiah(currentModalAccessoriesCost)}
                    </span>
                  </div>
                </div>

                {accessories.length === 0 ? (
                  <div className="p-3 text-center text-xs text-zinc-500 border border-dashed rounded-lg">
                    Belum ada aksesoris di Bagian C. Tambahkan aksesoris di Tab Data Harga & Asumsi.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {accessories.map((acc) => {
                      const qty =
                        editingProduct.accessoryQuantities?.[acc.id] ??
                        editingProduct.accessoryQuantities?.[acc.name] ??
                        (acc.id === "acc-paracord" || acc.name.toLowerCase().includes("paracord") ? editingProduct.paracordMeter :
                         acc.id === "acc-carabiner" || acc.name.toLowerCase().includes("carabiner") ? editingProduct.carabinerPcs :
                         acc.id === "acc-switch" || acc.name.toLowerCase().includes("switch") ? editingProduct.switchPcs :
                         acc.id === "acc-nfc" || acc.name.toLowerCase().includes("nfc") ? editingProduct.nfcPcs : 0) ?? 0;
                      const hasQty = (qty || 0) > 0;

                      return (
                        <div
                          key={acc.id}
                          className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-xs transition-colors ${
                            hasQty
                              ? "bg-amber-500/10 border-amber-500/40 text-zinc-900 dark:text-zinc-100"
                              : "bg-white dark:bg-zinc-900 border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold block truncate text-[11px]" title={acc.name}>
                              {acc.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 block">
                              {formatRupiah(acc.price)} / {acc.unit}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              value={qty || ""}
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updatedQuantities = {
                                  ...(editingProduct.accessoryQuantities || {}),
                                  [acc.id]: val,
                                };
                                const legacyUpdates: Partial<ElsProductItem> = {};
                                if (acc.name.toLowerCase().includes("paracord")) {
                                  legacyUpdates.paracordMeter = val;
                                } else if (acc.name.toLowerCase().includes("carabiner")) {
                                  legacyUpdates.carabinerPcs = val;
                                } else if (acc.name.toLowerCase().includes("switch")) {
                                  legacyUpdates.switchPcs = val;
                                } else if (acc.name.toLowerCase().includes("nfc")) {
                                  legacyUpdates.nfcPcs = val;
                                }
                                setEditingProduct({
                                  ...editingProduct,
                                  ...legacyUpdates,
                                  accessoryQuantities: updatedQuantities,
                                });
                              }}
                              className="h-7 w-16 text-right font-mono text-xs"
                            />
                            <span className="text-[10px] text-zinc-400 w-8 truncate">
                              {acc.unit.replace(/^per\s+/i, "")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Biaya Custom Hardware Tambahan */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-0.5">
                      Biaya Aksesoris/Hardware Tambahan Lainnya (Rp)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={editingProduct.customHardwareCost || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          customHardwareCost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-7 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Packaging & Free Shipping Checkboxes */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={editingProduct.packagingPackage === 1}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, packagingPackage: e.target.checked ? 1 : 0 })
                      }
                      className="rounded accent-amber-600"
                    />
                    <span>Sertakan Paket Packing Lengkap ({formatRupiah(assumptions.packagingPackagePrice)})</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={editingProduct.freeShippingXtra}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, freeShippingXtra: e.target.checked })
                      }
                      className="rounded accent-amber-600"
                    />
                    <span>Ikut Gratis Ongkir Xtra ({Math.round(assumptions.freeShippingRate * 100)}%)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProductModalOpen(false)}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                >
                  Simpan Model
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
