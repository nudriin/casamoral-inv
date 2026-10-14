"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import {
  calculateStandardHpp,
  calculateAdvancedHpp,
  calculateDepreciationPerHour,
} from "@/lib/financial/hpp-calculator";
import {
  calculatePriceFromMarkup,
  calculatePriceFromMargin,
  convertMarkupToMargin,
  convertMarginToMarkup,
  analyzePricing,
} from "@/lib/financial/pricing-calculator";
import { calculateBEP } from "@/lib/financial/bep-calculator";
import { Sparkles, Sliders, Target, Store } from "lucide-react";
import { FinancialIndicatorInfo, FinancialGlossaryModalButton } from "@/components/financial-indicator-guide";

export default function CalculatorPage() {
  // Mode selection
  const [mode, setMode] = useState<"STANDARD" | "ADVANCED">("STANDARD");

  // Standard inputs
  const [filamentGram, setFilamentGram] = useState<number>(203.08); // Default: Model Ollie
  const [filamentPriceKg, setFilamentPriceKg] = useState<number>(180000);
  const [electricalCost, setElectricalCost] = useState<number>(31700);
  const [packagingCost, setPackagingCost] = useState<number>(6500);
  const [overheadMultiplier, setOverheadMultiplier] = useState<number>(1.2);

  // Advanced inputs
  const [printTimeMinutes, setPrintTimeMinutes] = useState<number>(300); // 5 hours
  const [printerWatts, setPrinterWatts] = useState<number>(110);
  const [electricityTariff, setElectricityTariff] = useState<number>(1666);
  const [rejectRatePercent, setRejectRatePercent] = useState<number>(8); // 8%
  const machinePrice = 9999000; // Bambu A1
  const machineResidual = 500000;
  const machineUsefulMonths = 24;
  const machineHoursPerMonth = 150;
  const staffPackingAllocation = 2222;

  // Pricing inputs
  const [pricingMethod, setPricingMethod] = useState<"MARKUP" | "MARGIN">("MARKUP");
  const [targetPercent, setTargetPercent] = useState<number>(50); // 50%
  const [includeShopeeFees, setIncludeShopeeFees] = useState<boolean>(true);
  const shopeeAdminRate = 8; // 8%
  const freeShippingRate = 4; // 4%

  // BEP inputs
  const [monthlyOverhead, setMonthlyOverhead] = useState<number>(2000000); // Rp 2.000.000
  const [estimatedMonthlyUnits, setEstimatedMonthlyUnits] = useState<number>(60);
  const [initialCapital, setInitialCapital] = useState<number>(11440748);

  // 1. Calculate HPP
  let calculatedHpp = 0;
  let filamentCostDisplay = 0;
  let overheadOrMachineCost = 0;

  if (mode === "STANDARD") {
    const res = calculateStandardHpp({
      filamentGram,
      filamentPricePerKg: filamentPriceKg,
      electricalCost,
      packagingCost,
      overheadMultiplier,
    });
    calculatedHpp = res.totalHpp;
    filamentCostDisplay = res.filamentCost;
    overheadOrMachineCost = res.overheadSurcharge;
  } else {
    const hourlyDep = calculateDepreciationPerHour(
      machinePrice,
      machineResidual,
      machineUsefulMonths,
      machineHoursPerMonth
    );
    const res = calculateAdvancedHpp({
      filamentGram,
      filamentPricePerKg: filamentPriceKg,
      purgeWasteFactor: 0.05,
      printTimeMinutes,
      printerPowerWatts: printerWatts,
      electricityRatePerKwh: electricityTariff,
      depreciationPerHour: hourlyDep,
      rejectRate: rejectRatePercent / 100,
      accessoriesCost: electricalCost,
      packagingCost,
      staffPackingAllocation,
    });
    calculatedHpp = res.totalHpp;
    filamentCostDisplay = res.filamentCost;
    overheadOrMachineCost = res.electricityCost + res.depreciationCost + res.failureCost;
  }

  // 2. Calculate Pricing
  const recommendedSellingPrice =
    pricingMethod === "MARKUP"
      ? calculatePriceFromMarkup(calculatedHpp, targetPercent)
      : calculatePriceFromMargin(calculatedHpp, targetPercent);

  const markupEquivalent =
    pricingMethod === "MARKUP" ? targetPercent : convertMarginToMarkup(targetPercent);
  const marginEquivalent =
    pricingMethod === "MARGIN" ? targetPercent : convertMarkupToMargin(targetPercent);

  // 3. Analyze Marketplace Deductions
  const pricingAnalysis = analyzePricing(recommendedSellingPrice, calculatedHpp, {
    shopeeAdminRate: shopeeAdminRate / 100,
    freeShippingXtraRate: freeShippingRate / 100,
    includeShippingXtra: includeShopeeFees,
  });

  // 4. Calculate BEP
  const bepResult = calculateBEP({
    monthlyFixedOverhead: monthlyOverhead,
    averageSellingPrice: recommendedSellingPrice,
    averageUnitHpp: calculatedHpp,
    averagePlatformFeePerUnit: includeShopeeFees ? pricingAnalysis.totalMarketplaceFees : 0,
    initialCapital,
    estimatedMonthlyUnits,
  });

  return (
    <div className="space-y-6">
        {/* Mode Selector Tabs & Glossary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300/60 dark:border-zinc-800 w-fit">
            <button
              onClick={() => setMode("STANDARD")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === "STANDARD"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Mode Standard (Casa Moral 1.2x)
            </button>
            <button
              onClick={() => setMode("ADVANCED")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === "ADVANCED"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Mode Advanced (ELS Studio Slicing)
            </button>
          </div>
          <FinancialGlossaryModalButton />
        </div>

        {/* Top Highlight Cards: Result Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent">
            <CardHeader className="pb-1.5">
              <CardTitle className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>Total HPP Produksi</span>
                <FinancialIndicatorInfo indicatorKey="hpp" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
                {formatRupiah(calculatedHpp, true)}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Filamen: {formatRupiah(filamentCostDisplay)} ({filamentGram}g) • Overhead: {formatRupiah(overheadOrMachineCost)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1.5">
              <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                <span>Harga Jual Rekomendasi</span>
                <FinancialIndicatorInfo indicatorKey={pricingMethod === "MARKUP" ? "markup" : "margin"} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
                {formatRupiah(recommendedSellingPrice)}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px]">
                <Badge variant="accent">Markup +{markupEquivalent.toFixed(1)}%</Badge>
                <Badge variant="success">Margin {marginEquivalent.toFixed(1)}%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1.5">
              <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
                <span>Laba Kotor Riil / Unit</span>
                <FinancialIndicatorInfo indicatorKey="laba_kotor" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatRupiah(pricingAnalysis.netGrossProfit)}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Setelah potongan Shopee ({formatRupiah(pricingAnalysis.totalMarketplaceFees)})
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10">
            <CardHeader className="pb-1.5">
              <CardTitle className="text-xs font-medium text-emerald-800 dark:text-emerald-400 flex items-center justify-between">
                <span>Target BEP (Titik Impas)</span>
                <FinancialIndicatorInfo indicatorKey="bep" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {bepResult.bepUnitsPerMonth} Unit <span className="text-xs font-normal text-zinc-500">/ bulan</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Omzet BEP: {formatRupiah(bepResult.bepRevenuePerMonth)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two-Column Simulation Form */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Cost & Production Parameters */}
          <Card>
            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-sm font-bold">1. Parameter Produksi & Biaya HPP</CardTitle>
              </div>
              <CardDescription>
                {mode === "STANDARD"
                  ? "Mode Standard: Menghitung bahan baku langsung ditambah faktor overhead 20% (1.2x)."
                  : "Mode Advanced: Menghitung jam cetak, daya listrik watt, tarif PLN, depresiasi mesin, dan reject rate."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Berat Filamen (gram)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={filamentGram}
                    onChange={(e) => setFilamentGram(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Shade + Base + Cap</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Harga Filamen / Kg (Rp)
                  </label>
                  <Input
                    type="number"
                    value={filamentPriceKg}
                    onChange={(e) => setFilamentPriceKg(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    = Rp {(filamentPriceKg / 1000).toFixed(0)} / gram
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Komponen Kelistrikan (Rp)
                  </label>
                  <Input
                    type="number"
                    value={electricalCost}
                    onChange={(e) => setElectricalCost(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">LED 3W + Fitting + Kabel Sakelar</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Biaya Kemasan (Rp)
                  </label>
                  <Input
                    type="number"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">Kardus 20x20 + Bubble Wrap</span>
                </div>
              </div>

              {mode === "STANDARD" ? (
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Overhead Multiplier (Listrik & Depresiasi)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      step="0.05"
                      value={overheadMultiplier}
                      onChange={(e) => setOverheadMultiplier(parseFloat(e.target.value) || 1)}
                      className="w-32"
                    />
                    <span className="text-xs text-zinc-500">
                      Standard Casa Moral = <strong>1.20x</strong> (+20% dari material)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-semibold block mb-1">Waktu Print (Menit)</span>
                      <Input
                        type="number"
                        value={printTimeMinutes}
                        onChange={(e) => setPrintTimeMinutes(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <span className="font-semibold block mb-1">Daya Printer (Watt)</span>
                      <Input
                        type="number"
                        value={printerWatts}
                        onChange={(e) => setPrinterWatts(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-semibold block mb-1">Tarif Listrik PLN (Rp/kWh)</span>
                      <Input
                        type="number"
                        value={electricityTariff}
                        onChange={(e) => setElectricityTariff(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <span className="font-semibold block mb-1">Reject / Failure Rate (%)</span>
                      <Input
                        type="number"
                        value={rejectRatePercent}
                        onChange={(e) => setRejectRatePercent(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Pricing Strategy & Marketplace Fees */}
          <Card>
            <CardHeader className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-sm font-bold">2. Strategi Harga & Potongan Platform</CardTitle>
              </div>
              <CardDescription>
                Pemisahan tegas Markup vs Margin dan kalkulasi potongan admin Shopee
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
                  Metode Penetapan Target Keuntungan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPricingMethod("MARKUP")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-colors cursor-pointer ${
                      pricingMethod === "MARKUP"
                        ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-500"
                        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800"
                    }`}
                  >
                    Target Markup (% dari HPP)
                  </button>
                  <button
                    onClick={() => setPricingMethod("MARGIN")}
                    className={`p-2.5 rounded-lg border text-xs font-semibold text-left transition-colors cursor-pointer ${
                      pricingMethod === "MARGIN"
                        ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-500"
                        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800"
                    }`}
                  >
                    Target Margin (% dari Harga)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Nilai Target ({pricingMethod}): <strong>{targetPercent}%</strong>
                  </label>
                  <span className="text-[11px] text-zinc-500">
                    {pricingMethod === "MARKUP"
                      ? `Setara Margin ${marginEquivalent.toFixed(1)}%`
                      : `Setara Markup ${markupEquivalent.toFixed(1)}%`}
                  </span>
                </div>
                <Input
                  type="number"
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Shopee Marketplace Fees Box */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-orange-600" />
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Simulasi Potongan Shopee
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={includeShopeeFees}
                      onChange={(e) => setIncludeShopeeFees(e.target.checked)}
                      className="rounded accent-amber-600 cursor-pointer"
                    />
                    <span className="text-zinc-600 dark:text-zinc-400">Aktifkan Fee</span>
                  </label>
                </div>

                {includeShopeeFees && (
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <div>
                      <span className="text-zinc-500 block mb-1">Biaya Admin ({shopeeAdminRate}%)</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatRupiah(pricingAnalysis.shopeeAdminFee)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-1">Gratis Ongkir Xtra ({freeShippingRate}%)</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatRupiah(pricingAnalysis.shippingXtraFee)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: BEP & Investment Payback Projection */}
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-bold">3. Analisis Break-Even Point (BEP) & Proyeksi Balik Modal</CardTitle>
            <CardDescription>
              Menghitung berapa banyak lampu yang harus terjual untuk menutup biaya operasional dan modal awal
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Biaya Overhead Tetap / Bulan (Rp)
                </label>
                <Input
                  type="number"
                  value={monthlyOverhead}
                  onChange={(e) => setMonthlyOverhead(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">Iklan, internet, listrik non-print</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Estimasi Penjualan (Unit / Bulan)
                </label>
                <Input
                  type="number"
                  value={estimatedMonthlyUnits}
                  onChange={(e) => setEstimatedMonthlyUnits(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">Kapasitas target studio</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Total Modal Awal (Rp)
                </label>
                <Input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
                />
                <span className="text-[10px] text-zinc-400 mt-0.5 block">Mesin + Stok awal (Rp 11.44M)</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-500">Margin Kontribusi / Unit</span>
                  <FinancialIndicatorInfo indicatorKey="margin_kontribusi" />
                </div>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {formatRupiah(bepResult.unitContributionMargin)}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Rasio: {bepResult.contributionMarginRatio}% dari harga
                </span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-500">BEP Unit per Bulan</span>
                  <FinancialIndicatorInfo indicatorKey="bep" />
                </div>
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                  {bepResult.bepUnitsPerMonth} Unit
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  ~{bepResult.bepUnitsPerDay} unit / hari (asumsi 30 hari)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-500">Proyeksi Laba Bersih</span>
                  <FinancialIndicatorInfo indicatorKey="laba_operasional" />
                </div>
                <span
                  className={`text-base font-bold ${
                    bepResult.estimatedNetProfit > 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {formatRupiah(bepResult.estimatedNetProfit)}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  Pada volume {estimatedMonthlyUnits} unit/bulan
                </span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-500">Estimasi Balik Modal (ROI)</span>
                  <FinancialIndicatorInfo indicatorKey="payback_period" />
                </div>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {bepResult.paybackPeriodMonths ? `${bepResult.paybackPeriodMonths} Bulan` : "Belum Impas"}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  {bepResult.statusMessage}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
