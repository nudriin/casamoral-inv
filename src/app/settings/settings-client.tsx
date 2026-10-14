"use client";

import React, { useState } from "react";
import {
  BusinessSettings,
  ProductCategory,
} from "@/types/database";
import { ProductWithBOM } from "@/lib/data/initial-data";
import { formatRupiah } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import {
  updateMarketplaceFeesAction,
  updateProductionAssumptionsAction,
  applyGlobalPricingToProductsAction,
} from "./actions";
import {
  Sliders,
  ShoppingBag,
  Zap,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Check,
  ShieldAlert,
} from "lucide-react";

interface SettingsClientProps {
  initialSettings: BusinessSettings;
  categories: ProductCategory[];
  products: ProductWithBOM[];
}

export function SettingsClient({ initialSettings, categories, products }: SettingsClientProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"pricing" | "marketplace" | "production" | "appearance">("pricing");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Tab 1: Global Pricing States
  const [pricingMode, setPricingMode] = useState<"GLOBAL_MARKUP" | "GLOBAL_MARGIN">(
    initialSettings.global_pricing.pricing_mode === "GLOBAL_MARGIN" ? "GLOBAL_MARGIN" : "GLOBAL_MARKUP"
  );
  const [pricingPercent, setPricingPercent] = useState(
    initialSettings.global_pricing.pricing_mode === "GLOBAL_MARGIN"
      ? initialSettings.global_pricing.default_margin_percent
      : initialSettings.global_pricing.default_markup_percent
  );
  const [targetCategory, setTargetCategory] = useState("ALL");
  const [showConfirmPricingModal, setShowConfirmPricingModal] = useState(false);

  // Tab 2: Marketplace Fees States
  const [adminFee, setAdminFee] = useState(initialSettings.marketplace_fees.shopee_admin_fee_percent);
  const [freeShippingFee, setFreeShippingFee] = useState(initialSettings.marketplace_fees.shopee_free_shipping_fee_percent);
  const [freeShippingCap, setFreeShippingCap] = useState(initialSettings.marketplace_fees.shopee_free_shipping_cap);
  const [extraFee, setExtraFee] = useState(initialSettings.marketplace_fees.extra_platform_fee);

  // Tab 3: Production Assumptions States
  const [electricityRate, setElectricityRate] = useState(initialSettings.production_assumptions.electricity_rate_kwh);
  const [printerPower, setPrinterPower] = useState(initialSettings.production_assumptions.default_printer_power_watts);
  const [laborPackingCost, setLaborPackingCost] = useState(initialSettings.production_assumptions.labor_packing_cost);
  const [rejectRate, setRejectRate] = useState(initialSettings.production_assumptions.default_reject_rate * 100);
  const [overheadMultiplier, setOverheadMultiplier] = useState(initialSettings.production_assumptions.default_overhead_multiplier);

  // Live Price Preview calculation for eligible products
  const previewData = products
    .filter((p) => !p.is_archived && (targetCategory === "ALL" || p.category_id === targetCategory))
    .map((p) => {
      let newPrice = 0;
      if (pricingMode === "GLOBAL_MARKUP") {
        newPrice = Math.ceil((p.current_hpp * (1 + pricingPercent / 100)) / 1000) * 1000;
      } else {
        const marginRatio = 1 - pricingPercent / 100;
        newPrice = marginRatio > 0 ? Math.ceil((p.current_hpp / marginRatio) / 1000) * 1000 : p.selling_price;
      }
      const newMargin = newPrice > 0 ? ((newPrice - p.current_hpp) / newPrice) * 100 : 0;
      return {
        ...p,
        newPrice,
        newMargin,
      };
    });

  const handleApplyPricing = async () => {
    setSaving(true);
    const res = await applyGlobalPricingToProductsAction(pricingMode, pricingPercent, targetCategory);
    if (res.success && "updatedCount" in res) {
      setFeedback({
        type: "success",
        message: `Berhasil menerapkan harga jual baru ke ${res.updatedCount} model produk!`,
      });
      setShowConfirmPricingModal(false);
    } else {
      setFeedback({ type: "error", message: (!res.success && res.error) ? res.error : "Gagal menerapkan harga global." });
    }
    setSaving(false);
  };

  const handleSaveMarketplace = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const res = await updateMarketplaceFeesAction({
      shopee_admin_fee_percent: Number(adminFee) || 0,
      shopee_free_shipping_fee_percent: Number(freeShippingFee) || 0,
      shopee_free_shipping_cap: Number(freeShippingCap) || 0,
      extra_platform_fee: Number(extraFee) || 0,
    });
    if (res.success) {
      setFeedback({ type: "success", message: "Biaya platform marketplace berhasil diperbarui!" });
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal memperbarui biaya platform." });
    }
    setSaving(false);
  };

  const handleSaveProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const res = await updateProductionAssumptionsAction({
      electricity_rate_kwh: Number(electricityRate) || 0,
      default_printer_power_watts: Number(printerPower) || 0,
      labor_packing_cost: Number(laborPackingCost) || 0,
      default_reject_rate: (Number(rejectRate) || 0) / 100,
      default_overhead_multiplier: Number(overheadMultiplier) || 1.20,
    });
    if (res.success) {
      setFeedback({ type: "success", message: "Asumsi biaya produksi berhasil disimpan!" });
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal menyimpan asumsi produksi." });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "pricing"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Harga & Margin Global</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("marketplace")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "marketplace"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Biaya Marketplace (Shopee)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("production")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "production"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Asumsi Biaya Produksi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("appearance")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "appearance"
              ? "bg-amber-500 text-zinc-950 shadow-xs"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <Sun className="h-3.5 w-3.5" />
          <span>Tema & Tampilan</span>
        </button>
      </div>

      {/* TAB 1: Global Pricing Settings */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-500" />
                Penetapan Harga Jual Berbasis Margin / Markup
              </CardTitle>
              <CardDescription>
                Pilih metode penetapan harga massal. Anda dapat melihat simulasi harga sebelum menerapkan perubahan ke katalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Formula Guidance Box */}
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-xs text-zinc-700 dark:text-zinc-300 space-y-1.5">
                <div className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" /> Perbedaan Fundamental: Markup vs Gross Margin
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-2.5 border border-amber-500/10">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">Markup (%)</span>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Persentase tambahan laba di atas HPP pokok.
                    </p>
                    <code className="text-[10px] text-amber-700 dark:text-amber-300 font-mono mt-1 block">
                      Harga Jual = HPP × (1 + Markup%)
                    </code>
                  </div>
                  <div className="rounded-lg bg-white/60 dark:bg-zinc-900/60 p-2.5 border border-amber-500/10">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">Gross Margin (%)</span>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Porsi laba kotor terhadap omzet penjualan akhir.
                    </p>
                    <code className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
                      Harga Jual = HPP ÷ (1 - Margin%)
                    </code>
                  </div>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Metode Penetapan Harga
                  </label>
                  <select
                    value={pricingMode}
                    onChange={(e) => setPricingMode(e.target.value as "GLOBAL_MARKUP" | "GLOBAL_MARGIN")}
                    className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs cursor-pointer"
                  >
                    <option value="GLOBAL_MARKUP">Target Markup (Di atas HPP)</option>
                    <option value="GLOBAL_MARGIN">Target Gross Margin (Dari Harga Jual)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Persentase Target (%)
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    max={pricingMode === "GLOBAL_MARGIN" ? 95 : 500}
                    value={pricingPercent}
                    onChange={(e) => setPricingPercent(Number(e.target.value) || 0)}
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Terapkan Ke Kategori
                  </label>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs cursor-pointer"
                  >
                    <option value="ALL">Semua Kategori Aktif</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Table of Price Impact */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Preview Perubahan Harga ({previewData.length} Produk)
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Sebelum vs Sesudah
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Model Lampu / Produk</th>
                        <th className="py-2.5 px-3 font-semibold text-right">HPP Pokok</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Harga Saat Ini</th>
                        <th className="py-2.5 px-3 font-semibold text-right text-amber-600 dark:text-amber-400">
                          Harga Rekomendasi Baru
                        </th>
                        <th className="py-2.5 px-3 font-semibold text-right text-emerald-600 dark:text-emerald-400">
                          Gross Margin Baru
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                      {previewData.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                          <td className="py-2.5 px-3 font-medium text-zinc-900 dark:text-zinc-100">{p.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                            {formatRupiah(p.current_hpp)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-zinc-500">
                            {formatRupiah(p.selling_price)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                            {formatRupiah(p.newPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {p.newMargin.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => setShowConfirmPricingModal(true)}
                    className="gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Check className="h-4 w-4" /> Terapkan Harga ke Katalog
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: Marketplace Fees */}
      {activeTab === "marketplace" && (
        <form onSubmit={handleSaveMarketplace}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-amber-500" />
                Konfigurasi Biaya Platform Shopee & Marketplace
              </CardTitle>
              <CardDescription>
                Sesuaikan tarif potongan e-commerce tanpa perlu memodifikasi source code aplikasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Biaya Administrasi Shopee (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={adminFee}
                    onChange={(e) => setAdminFee(Number(e.target.value) || 0)}
                    className="text-xs h-9"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Tarif acuan standar Shopee seller Non-Star / Star: 8.0%</p>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Biaya Program Gratis Ongkir Xtra (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={freeShippingFee}
                    onChange={(e) => setFreeShippingFee(Number(e.target.value) || 0)}
                    className="text-xs h-9"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Tarif program gratis ongkir: 4.0%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Batas Maksimum Potongan Gratis Ongkir (Rp)
                  </label>
                  <Input
                    type="number"
                    step="1000"
                    min="0"
                    value={freeShippingCap}
                    onChange={(e) => setFreeShippingCap(Number(e.target.value) || 0)}
                    className="text-xs h-9"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Maksimal potongan per unit pesanan: Rp 10.000</p>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Biaya Layanan Ekstra Tambahan (Rp)
                  </label>
                  <Input
                    type="number"
                    step="500"
                    min="0"
                    value={extraFee}
                    onChange={(e) => setExtraFee(Number(e.target.value) || 0)}
                    className="text-xs h-9"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Biaya penanganan atau biaya kemasan tambahan jika ada.</p>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button type="submit" variant="accent" disabled={saving} className="text-xs font-semibold cursor-pointer">
                  {saving ? "Menyimpan..." : "Simpan Tarif Marketplace"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* TAB 3: Production Cost Assumptions */}
      {activeTab === "production" && (
        <form onSubmit={handleSaveProduction}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Asumsi Biaya Cetak 3D & Operasional Studio
              </CardTitle>
              <CardDescription>
                Parameter teknis dasar untuk kalkulator HPP Advanced, tarif PLN, dan reject rate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Tarif Listrik PLN (Rp per kWh)
                  </label>
                  <Input
                    type="number"
                    min="500"
                    value={electricityRate}
                    onChange={(e) => setElectricityRate(Number(e.target.value) || 1500)}
                    className="text-xs h-9"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Tarif PLN Golongan R-1M (900-1300VA): ~Rp 1.500/kWh</p>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Daya Rata-Rata Printer (Watt)
                  </label>
                  <Input
                    type="number"
                    min="20"
                    value={printerPower}
                    onChange={(e) => setPrinterPower(Number(e.target.value) || 120)}
                    className="text-xs h-9"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Bambulab A1 Mini (~60W) atau Anycubic Kobra X (~110W)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Alokasi Tenaga Kerja Packing (Rp)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={laborPackingCost}
                    onChange={(e) => setLaborPackingCost(Number(e.target.value) || 0)}
                    className="text-xs h-9"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Toleransi Gagal Cetak / Reject Rate (%)
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="50"
                    value={rejectRate}
                    onChange={(e) => setRejectRate(Number(e.target.value) || 0)}
                    className="text-xs h-9"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Standar studio Casa Moral: 10%</p>
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Multiplier Overhead Standar
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="1.0"
                    value={overheadMultiplier}
                    onChange={(e) => setOverheadMultiplier(Number(e.target.value) || 1.2)}
                    className="text-xs h-9 font-mono"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">Mode Standard: 1.20x</p>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button type="submit" variant="accent" disabled={saving} className="text-xs font-semibold cursor-pointer">
                  {saving ? "Menyimpan..." : "Simpan Asumsi Biaya"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* TAB 4: Appearance & Themes */}
      {activeTab === "appearance" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              Preferensi Tema Antarmuka
            </CardTitle>
            <CardDescription>
              Pilih mode tampilan studio yang nyaman untuk kerja siang maupun malam hari.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Sun className="h-6 w-6 text-amber-500" />
                  {theme === "light" && <Check className="h-4 w-4 text-amber-600" />}
                </div>
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Mode Terang (Light)</div>
                <p className="text-xs text-zinc-500 mt-1">Tampilan bersih dengan kontras tinggi untuk siang hari.</p>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Moon className="h-6 w-6 text-amber-400" />
                  {theme === "dark" && <Check className="h-4 w-4 text-amber-400" />}
                </div>
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Mode Gelap (Dark)</div>
                <p className="text-xs text-zinc-500 mt-1">Tampilan gelap bertema studio modern untuk kenyamanan mata.</p>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === "system"
                    ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Laptop className="h-6 w-6 text-zinc-500" />
                  {theme === "system" && <Check className="h-4 w-4 text-amber-500" />}
                </div>
                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Ikuti Sistem (Otomatis)</div>
                <p className="text-xs text-zinc-500 mt-1">
                  Menyesuaikan tema otomatis dengan pengaturan sistem operasi Anda ({resolvedTheme}).
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal: Apply Pricing Changes */}
      {showConfirmPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Konfirmasi Pembaruan Harga Massal
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Tindakan ini akan memperbarui harga jual acuan untuk{" "}
                  <strong>{previewData.length} model produk</strong> sesuai target{" "}
                  {pricingMode === "GLOBAL_MARKUP" ? `Markup +${pricingPercent}%` : `Margin ${pricingPercent}%`}.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>• Perubahan ini hanya memengaruhi transaksi pesanan baru.</p>
              <p>• Snapshot harga dan HPP pesanan historis akan tetap aman terlindungi.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmPricingModal(false)}
                className="text-xs h-9 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="accent"
                disabled={saving}
                onClick={handleApplyPricing}
                className="text-xs h-9 font-semibold cursor-pointer"
              >
                {saving ? "Menerapkan..." : "Ya, Terapkan Harga"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
