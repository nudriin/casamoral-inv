"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ProductWithBOM } from "@/lib/data/initial-data";
import { Material, ChannelSource, PaymentMethod } from "@/types/database";
import { calculatePlatformFee, getChannelLabel, isMarketplaceChannel } from "@/lib/financial/platform-fees";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { checkoutPosAction } from "./actions";
import {
  ShoppingCart,
  Store,
  Package,
  Boxes,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  TrendingUp,
  Receipt,
  Search,
} from "lucide-react";
import Decimal from "decimal.js";
import type { CheckoutDeductionItem } from "@/lib/services/materials-service";

interface PosClientProps {
  products: ProductWithBOM[];
  packagingMaterials: Material[];
  allMaterials?: Material[];
}

interface CartProductItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  rawPrice: number;
  rawHpp: number;
  colorDetails?: string;
}

interface CartPackagingItem {
  materialId: string;
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
  unitPrice: number; // Price charged to customer (0 if included)
  currentStock: number;
}

export function PosClient({ products, packagingMaterials, allMaterials = [] }: PosClientProps) {
  const inventoryList = allMaterials.length > 0 ? allMaterials : packagingMaterials;

  const pickDefaultMaterialId = (keywords: string[], fallbackId: string, category?: Material["category"]) => {
    const matches = inventoryList.filter(
      (m) =>
        (category && m.category === category) ||
        keywords.some((kw) => m.name.toLowerCase().includes(kw))
    );
    const inStock = matches.find((m) => m.current_stock > 0);
    return (inStock || matches[0])?.id || fallbackId;
  };
  // Channel selection: Direct vs Shopee
  const [channel, setChannel] = useState<ChannelSource>("Direct");

  // Customer info
  const [customerName, setCustomerName] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Cart state
  const [cartProducts, setCartProducts] = useState<CartProductItem[]>([
    {
      id: `cart-p-0`,
      productId: products[1]?.id || products[0]?.id || "prod-02",
      name: products[1]?.name || products[0]?.name || "Lampu Ambient - Ollie",
      quantity: 1,
      rawPrice: products[1]?.selling_price || 120000,
      rawHpp: (products[1]?.current_hpp || 80000) - (products[1]?.bom?.packagingCost || 6500),
      colorDetails: "Standar Putih/Oren",
    },
  ]);

  // Default packaging in cart: 1 pcs Kardus (mat-06)
  const defaultBox = packagingMaterials.find((m) => m.name.toLowerCase().includes("kardus")) || packagingMaterials[0];
  const [cartPackaging, setCartPackaging] = useState<CartPackagingItem[]>(
    defaultBox
      ? [
          {
            materialId: defaultBox.id,
            name: defaultBox.name,
            unit: defaultBox.unit,
            quantity: 1,
            unitCost: defaultBox.cost_per_unit,
            unitPrice: 0, // Included by default in sales price, or can be charged
            currentStock: defaultBox.current_stock,
          },
        ]
      : []
  );

  // Search & view filters
  const [productSearch, setProductSearch] = useState("");
  const [activeCatalogTab, setActiveCatalogTab] = useState<"PRODUCTS" | "PACKAGING">("PRODUCTS");

  // Synced /inventory raw material & component selections for POS checkout
  const [deductFilament, setDeductFilament] = useState(true);
  const [selectedFilamentId, setSelectedFilamentId] = useState(() =>
    pickDefaultMaterialId(["filamen", "pla", "petg"], "mat-01", "filament")
  );
  const [deductBulb, setDeductBulb] = useState(true);
  const [selectedBulbId, setSelectedBulbId] = useState(() =>
    pickDefaultMaterialId(["lampu", "led", "bohlam", "inlite", "meval"], "mat-02")
  );
  const [deductCable, setDeductCable] = useState(true);
  const [selectedCableId, setSelectedCableId] = useState(() =>
    pickDefaultMaterialId(["kabel sakelar", "sakelar"], "mat-04")
  );
  const [deductFitting, setDeductFitting] = useState(true);
  const [selectedFittingId, setSelectedFittingId] = useState(() =>
    pickDefaultMaterialId(["fitting"], "mat-03")
  );
  const [deductProtector, setDeductProtector] = useState(true);
  const [selectedProtectorId, setSelectedProtectorId] = useState(() =>
    pickDefaultMaterialId(["pelindung"], "mat-05")
  );
  const [deductSkun, setDeductSkun] = useState(true);
  const [selectedSkunId, setSelectedSkunId] = useState(() =>
    pickDefaultMaterialId(["skun"], "mat-09")
  );

  // Payment inputs
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [discountAmount, setDiscountAmount] = useState<number | "">("");
  const [shippingCost, setShippingCost] = useState<number | "">("");
  const [paidAmountInput, setPaidAmountInput] = useState<number | "">("");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<{
    orderNumber: string;
    totalAmount: number;
    netProfit: number;
    platformFee: number;
    packagingDeductions: string[];
  } | null>(null);

  // Filtered lists
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
  }, [products, productSearch]);

  // Helper: calculate raw HPP for product (excluding packaging)
  const getProductRawHpp = (p: ProductWithBOM) => {
    const pkgCost = p.bom?.packagingCost || 6500;
    return Math.max(0, p.current_hpp - pkgCost);
  };

  // Cart operations for Products
  const handleAddProduct = (p: ProductWithBOM) => {
    const rawHpp = getProductRawHpp(p);
    const existingIndex = cartProducts.findIndex((item) => item.productId === p.id);
    if (existingIndex >= 0) {
      const copy = [...cartProducts];
      copy[existingIndex].quantity += 1;
      setCartProducts(copy);
    } else {
      setCartProducts([
        ...cartProducts,
        {
          id: `cart-p-${Date.now()}`,
          productId: p.id,
          name: p.name,
          quantity: 1,
          rawPrice: p.selling_price,
          rawHpp,
          colorDetails: "Standar",
        },
      ]);
    }
  };

  const handleUpdateProductQty = (index: number, delta: number) => {
    const copy = [...cartProducts];
    const newQty = copy[index].quantity + delta;
    if (newQty <= 0) {
      copy.splice(index, 1);
    } else {
      copy[index].quantity = newQty;
    }
    setCartProducts(copy);
  };

  const handleRemoveProduct = (index: number) => {
    const copy = [...cartProducts];
    copy.splice(index, 1);
    setCartProducts(copy);
  };

  // Cart operations for Packaging
  const handleAddPackaging = (m: Material) => {
    const existingIndex = cartPackaging.findIndex((item) => item.materialId === m.id);
    if (existingIndex >= 0) {
      const copy = [...cartPackaging];
      copy[existingIndex].quantity += 1;
      setCartPackaging(copy);
    } else {
      setCartPackaging([
        ...cartPackaging,
        {
          materialId: m.id,
          name: m.name,
          unit: m.unit,
          quantity: 1,
          unitCost: m.cost_per_unit,
          unitPrice: 0,
          currentStock: m.current_stock,
        },
      ]);
    }
  };

  const handleUpdatePackagingQty = (index: number, delta: number) => {
    const copy = [...cartPackaging];
    const newQty = copy[index].quantity + delta;
    if (newQty <= 0) {
      copy.splice(index, 1);
    } else {
      copy[index].quantity = newQty;
    }
    setCartPackaging(copy);
  };

  const handleRemovePackaging = (index: number) => {
    const copy = [...cartPackaging];
    copy.splice(index, 1);
    setCartPackaging(copy);
  };

  // REAL-TIME FINANCIAL COMPUTATIONS (with Decimal.js)
  const financials = useMemo(() => {
    let rawProductSellingSubtotal = new Decimal(0);
    let rawProductHppSubtotal = new Decimal(0);

    for (const item of cartProducts) {
      const q = new Decimal(item.quantity);
      rawProductSellingSubtotal = rawProductSellingSubtotal.plus(new Decimal(item.rawPrice).times(q));
      rawProductHppSubtotal = rawProductHppSubtotal.plus(new Decimal(item.rawHpp).times(q));
    }

    let packagingSellingSubtotal = new Decimal(0);
    let packagingCostSubtotal = new Decimal(0);

    for (const pkg of cartPackaging) {
      const q = new Decimal(pkg.quantity);
      packagingSellingSubtotal = packagingSellingSubtotal.plus(new Decimal(pkg.unitPrice).times(q));
      packagingCostSubtotal = packagingCostSubtotal.plus(new Decimal(pkg.unitCost).times(q));
    }

    const subtotal = rawProductSellingSubtotal.plus(packagingSellingSubtotal);
    const shipDec = shippingCost !== "" ? new Decimal(shippingCost) : new Decimal(0);
    const discDec = discountAmount !== "" ? new Decimal(discountAmount) : new Decimal(0);

    const totalBillBeforeDiscount = subtotal.plus(shipDec);
    const totalAmount = Decimal.max(0, totalBillBeforeDiscount.minus(discDec));

    // Total Modal HPP = Raw Products Modal + Selected Packaging Modal
    const totalHpp = rawProductHppSubtotal.plus(packagingCostSubtotal);

    // Platform Fee (Centralized calculation across channels)
    const feeBreakdown = calculatePlatformFee(channel, totalAmount.toNumber());
    const platformFee = new Decimal(feeBreakdown.totalFee);

    // Pendapatan Bersih (Net Profit)
    const netProfit = totalAmount.minus(totalHpp).minus(platformFee);
    const marginPct = totalAmount.greaterThan(0)
      ? netProfit.dividedBy(totalAmount).times(100)
      : new Decimal(0);

    return {
      rawProductSellingSubtotal: rawProductSellingSubtotal.toNumber(),
      rawProductHppSubtotal: rawProductHppSubtotal.toNumber(),
      packagingSellingSubtotal: packagingSellingSubtotal.toNumber(),
      packagingCostSubtotal: packagingCostSubtotal.toNumber(),
      subtotal: subtotal.toNumber(),
      shippingCost: shipDec.toNumber(),
      discountAmount: discDec.toNumber(),
      totalAmount: totalAmount.toNumber(),
      totalHpp: totalHpp.toNumber(),
      platformFee: platformFee.toNumber(),
      feeLabel: feeBreakdown.label,
      feeRateDesc: feeBreakdown.rateDescription,
      netProfit: netProfit.toNumber(),
      marginPct: Number(marginPct.toFixed(1)),
    };
  }, [cartProducts, cartPackaging, shippingCost, discountAmount, channel]);

  // Handle Checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (cartProducts.length === 0) {
      setErrorMessage("Pilih minimal 1 produk raw sebelum checkout.");
      return;
    }

    setIsSubmitting(true);

    try {
      const paid = paidAmountInput !== "" ? Number(paidAmountInput) : financials.totalAmount;

      const totalUnits = cartProducts.reduce((sum, p) => sum + (p.quantity || 1), 0);
      const totalFilamentGrams = cartProducts.reduce((sum, item) => {
        const prod = products.find((p) => p.id === item.productId);
        const gramsPerUnit = prod?.bom?.totalFilamentGram || 0;
        return sum + gramsPerUnit * (item.quantity || 1);
      }, 0);

      const posDeductions: CheckoutDeductionItem[] = [];
      const pushMat = (enabled: boolean, id: string, qty: number, fallbackName: string) => {
        if (!enabled || qty <= 0) return;
        const mat = inventoryList.find((m) => m.id === id);
        if (!mat && inventoryList.length === 0) return;
        posDeductions.push({
          material_id: mat?.id || id,
          name: mat?.name || fallbackName,
          quantity: qty,
          unit: mat?.unit || "pcs",
        });
      };

      if (inventoryList.length > 0 && totalUnits > 0) {
        pushMat(deductFilament, selectedFilamentId, Number(totalFilamentGrams.toFixed(2)), "Filamen PLA/PETG");
        pushMat(deductBulb, selectedBulbId, totalUnits, "Lampu LED Bulb 3W");
        pushMat(deductCable, selectedCableId, totalUnits, "Kabel Sakelar On/Off");
        pushMat(deductFitting, selectedFittingId, totalUnits, "Fitting Lampu E27");
        pushMat(deductProtector, selectedProtectorId, totalUnits, "Karet Pelindung Kabel");
        pushMat(deductSkun, selectedSkunId, totalUnits * 2, "Skun Jarum Pipih");
      }

      const res = await checkoutPosAction({
        customer_name: customerName.trim() || undefined,
        customer_city: customerCity.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        channel,
        items: cartProducts.map((p) => ({
          product_id: p.productId,
          quantity: p.quantity,
          raw_unit_price: p.rawPrice,
          raw_unit_hpp: p.rawHpp,
          color_details: p.colorDetails,
        })),
        packaging_items: cartPackaging.map((pkg) => ({
          material_id: pkg.materialId,
          name: pkg.name,
          quantity: pkg.quantity,
          unit_cost: pkg.unitCost,
          unit_price: pkg.unitPrice,
        })),
        checkout_deductions: posDeductions.length > 0 ? posDeductions : undefined,
        discount_amount: financials.discountAmount,
        shipping_cost: financials.shippingCost,
        payment_method: paymentMethod,
        paid_amount: paid,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.order) {
        setCheckoutSuccess({
          orderNumber: res.order.order_number,
          totalAmount: res.order.total_amount,
          netProfit: res.netProfit,
          platformFee: res.platformFee,
          packagingDeductions: cartPackaging.map((p) => `${p.quantity}x ${p.name}`),
        });
      } else {
        setErrorMessage(res.error || "Gagal memproses transaksi kasir POS.");
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan saat checkout POS.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewOrder = () => {
    setCustomerName("");
    setCustomerPhone("");
    setNotes("");
    setDiscountAmount("");
    setShippingCost("");
    setPaidAmountInput("");
    setCartProducts([]);
    setCartPackaging(
      defaultBox
        ? [
            {
              materialId: defaultBox.id,
              name: defaultBox.name,
              unit: defaultBox.unit,
              quantity: 1,
              unitCost: defaultBox.cost_per_unit,
              unitPrice: 0,
              currentStock: defaultBox.current_stock,
            },
          ]
        : []
    );
    setCheckoutSuccess(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-600 text-white font-bold">KASIR POS LIVE</Badge>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Omnichannel • Produk Raw • Pilihan Kemasan • Potong Stok Otomatis
            </span>
          </div>
          <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
            Kasir Penjualan & Simulasi Profit Real-time
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/reports/recap">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 cursor-pointer">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Rekap Keuangan
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 cursor-pointer">
              <Receipt className="h-3.5 w-3.5 text-zinc-600" /> Daftar Pesanan
            </Button>
          </Link>
        </div>
      </div>

      {/* Main POS 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Catalog (Products Raw & Packaging Materials) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Channel Selector Banner */}
          <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="text-xs">
              <span className="text-zinc-500 block">Kanal Penjualan Aktif:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {financials.feeRateDesc}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setChannel("Direct")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  channel === "Direct"
                    ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200"
                }`}
              >
                <Store className="h-3.5 w-3.5" /> Direct (0%)
              </button>
              <button
                type="button"
                onClick={() => setChannel("Shopee")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  channel === "Shopee"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200"
                }`}
              >
                <ShoppingBagIcon className="h-3.5 w-3.5" /> Shopee
              </button>
              <button
                type="button"
                onClick={() => setChannel("TikTokShop")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  channel === "TikTokShop"
                    ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200"
                }`}
              >
                <ShoppingBagIcon className="h-3.5 w-3.5" /> TikTok Shop
              </button>
              <button
                type="button"
                onClick={() => setChannel("Tokopedia")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  channel === "Tokopedia"
                    ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200"
                }`}
              >
                <Store className="h-3.5 w-3.5" /> Tokopedia
              </button>
            </div>
          </div>

          {/* Catalog Tabs: Produk Raw vs Bahan Kemasan */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setActiveCatalogTab("PRODUCTS")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeCatalogTab === "PRODUCTS"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Package className="h-3.5 w-3.5 text-amber-600" /> 1. Produk Raw ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCatalogTab("PACKAGING")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeCatalogTab === "PACKAGING"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Boxes className="h-3.5 w-3.5 text-blue-600" /> 2. Bahan &amp; Kemasan ({inventoryList.length})
                  </button>
                </div>

                {activeCatalogTab === "PRODUCTS" && (
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                    <Input
                      placeholder="Cari produk lampu..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* TAB A: PRODUK RAW */}
              {activeCatalogTab === "PRODUCTS" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredProducts.map((p) => {
                    const rawHpp = getProductRawHpp(p);
                    const isInCart = cartProducts.some((item) => item.productId === p.id);
                    return (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                          isInCart
                            ? "border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/10"
                            : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-zinc-300"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                              {p.name}
                            </h4>
                            {p.sku && (
                              <Badge variant="outline" className="text-[9px] py-0">
                                {p.sku}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">{p.description}</p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-zinc-400 block">Harga Raw</span>
                            <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                              {formatRupiah(p.selling_price)}
                            </span>
                            <span className="text-[10px] text-amber-700 dark:text-amber-400 block">
                              Modal: {formatRupiah(rawHpp)}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleAddProduct(p)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3 gap-1 cursor-pointer shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" /> Tambah
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB B: BAHAN KEMASAN DINAMIS */}
              {activeCatalogTab === "PACKAGING" && (
                <div className="space-y-4">
                  {/* Synced Raw Material & Component Selector from /inventory */}
                  {inventoryList.length > 0 && (
                    <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/15 space-y-2.5">
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Bahan Baku &amp; Komponen Terpotong (Sinkron /inventory)
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Pilih varian bahan &amp; komponen yang tersedia di /inventory untuk dipotong otomatis saat checkout POS.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { label: "Filamen 3D Print", checked: deductFilament, setChecked: setDeductFilament, id: selectedFilamentId, setId: setSelectedFilamentId, kw: ["filamen", "pla", "petg"], cat: "filament" as const },
                          { label: "Lampu LED Bulb 3W", checked: deductBulb, setChecked: setDeductBulb, id: selectedBulbId, setId: setSelectedBulbId, kw: ["lampu", "led", "bohlam", "inlite", "meval"], cat: "electrical" as const },
                          { label: "Kabel Sakelar On/Off", checked: deductCable, setChecked: setDeductCable, id: selectedCableId, setId: setSelectedCableId, kw: ["kabel sakelar", "sakelar"], cat: "electrical" as const },
                          { label: "Fitting Lampu E27", checked: deductFitting, setChecked: setDeductFitting, id: selectedFittingId, setId: setSelectedFittingId, kw: ["fitting"], cat: "electrical" as const },
                          { label: "Karet Pelindung Kabel", checked: deductProtector, setChecked: setDeductProtector, id: selectedProtectorId, setId: setSelectedProtectorId, kw: ["pelindung"], cat: "electrical" as const },
                          { label: "Skun Jarum Pipih", checked: deductSkun, setChecked: setDeductSkun, id: selectedSkunId, setId: setSelectedSkunId, kw: ["skun"], cat: "electrical" as const },
                        ].map((slot) => {
                          const matched = inventoryList.filter(
                            (m) => m.category === slot.cat || slot.kw.some((k) => m.name.toLowerCase().includes(k))
                          );
                          const others = inventoryList.filter((m) => !matched.some((x) => x.id === m.id));
                          const options = [...matched, ...others];
                          const currentMat = inventoryList.find((m) => m.id === slot.id);
                          return (
                            <div key={slot.label} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
                              <label className="flex items-center justify-between cursor-pointer">
                                <span className="flex items-center gap-1.5 font-medium text-[11px] text-zinc-800 dark:text-zinc-200">
                                  <input
                                    type="checkbox"
                                    checked={slot.checked}
                                    onChange={(e) => slot.setChecked(e.target.checked)}
                                    className="rounded border-zinc-300 text-amber-600 h-3.5 w-3.5"
                                  />
                                  {slot.label}
                                </span>
                                {currentMat && (
                                  <span className={`text-[10px] font-mono ${currentMat.current_stock <= 0 ? "text-red-500 font-bold" : "text-emerald-600 dark:text-emerald-400"}`}>
                                    Stok: {currentMat.current_stock} {currentMat.unit}
                                  </span>
                                )}
                              </label>
                              {slot.checked && (
                                <select
                                  value={slot.id}
                                  onChange={(e) => slot.setId(e.target.value)}
                                  className="w-full h-7 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 text-[11px]"
                                >
                                  {options.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} (Stok: {m.current_stock} {m.unit})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Pilih kemasan fisik yang digunakan untuk pesanan ini:
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                      Stok bahan kemasan (seperti kardus dan bubble wrap) akan <strong>otomatis berkurang</strong> dari inventaris saat transaksi di-checkout.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {packagingMaterials.map((m) => {
                      const inCart = cartPackaging.find((item) => item.materialId === m.id);
                      return (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {m.name}
                              </span>
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  variant={m.current_stock <= 0 ? "destructive" : m.current_stock <= 5 ? "destructive" : m.current_stock <= m.min_stock_alert ? "secondary" : "outline"}
                                  className={`text-[10px] py-0 ${m.current_stock <= 5 ? "bg-rose-600 text-white font-bold animate-pulse" : ""}`}
                                >
                                  {m.current_stock <= 0 ? "Habis (0)" : `Stok: ${m.current_stock} ${m.unit}`}
                                </Badge>
                                {m.current_stock > 0 && m.current_stock <= 5 && (
                                  <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400">
                                    ⚠️ Kritis (&le;5)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-1">
                              Biaya Modal: <strong className="text-zinc-800 dark:text-zinc-200">{formatRupiah(m.cost_per_unit)}</strong> / {m.unit}
                            </div>
                          </div>

                          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400">
                              {inCart ? `Terpilih: ${inCart.quantity} ${m.unit}` : "Belum dipilih"}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddPackaging(m)}
                              className="text-xs h-7 px-2.5 gap-1 cursor-pointer border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            >
                              <Plus className="h-3 w-3" /> Pilih Kemasan
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Real-time Cart & Live Financial Monitor */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-amber-500/30 shadow-md">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-amber-600" />
                  <CardTitle className="text-sm font-bold">Keranjang & Live Monitor</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetForNewOrder}
                  className="h-7 text-xs text-zinc-400 hover:text-rose-600 cursor-pointer"
                  title="Reset Keranjang"
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {/* Customer Inputs (Optional) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Nama Pelanggan
                  </label>
                  <Input
                    placeholder="e.g. Pembeli Shopee / Bpk. Adi"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Kota / Wilayah
                  </label>
                  <Input
                    placeholder="e.g. Sukamara / Jakarta"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Items in Cart: Products Raw */}
              <div className="space-y-2">
                <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-xs">
                  Item Produk Raw ({cartProducts.length})
                </span>
                {cartProducts.length === 0 ? (
                  <div className="p-3 text-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400">
                    Belum ada produk raw yang dipilih.
                  </div>
                ) : (
                  cartProducts.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between"
                    >
                      <div className="flex-1 pr-2">
                        <span className="font-bold block text-zinc-900 dark:text-zinc-100">{item.name}</span>
                        <span className="text-[10px] text-zinc-400 block">
                          Harga Jual: {formatRupiah(item.rawPrice)} • Modal Raw: {formatRupiah(item.rawHpp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateProductQty(idx, -1)}
                          className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateProductQty(idx, 1)}
                          className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Items in Cart: Packaging Selection */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300 block text-xs">
                    Kemasan Terpilih (Stok Berkurang Saat Checkout)
                  </span>
                  <Badge variant="outline" className="text-[9px]">
                    {cartPackaging.length} Jenis
                  </Badge>
                </div>

                {cartPackaging.length === 0 ? (
                  <div className="p-2 text-center rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-[11px]">
                    Tidak ada kemasan yang dipilih (kemasan tidak dipotong stok).
                  </div>
                ) : (
                  cartPackaging.map((pkg, idx) => (
                    <div
                      key={pkg.materialId}
                      className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <span className="font-bold block text-blue-900 dark:text-blue-100">{pkg.name}</span>
                        <span className="text-[10px] text-zinc-500 block">
                          Modal: {formatRupiah(pkg.unitCost)} / {pkg.unit} (Sisa Stok: {pkg.currentStock})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdatePackagingQty(idx, -1)}
                          className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs">{pkg.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdatePackagingQty(idx, 1)}
                          className="w-6 h-6 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePackaging(idx)}
                          className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer ml-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Extra Discounts & Shipping */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <label className="text-[11px] text-zinc-500 block mb-0.5">Diskon (Rp)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 block mb-0.5">Ongkir Tagihan (Rp)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value === "" ? "" : Number(e.target.value))}
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>

              {/* LIVE REAL-TIME FINANCIAL MONITOR (Sticky & Prominent) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 text-white dark:from-zinc-950 dark:to-black border border-zinc-800 space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-zinc-800">
                  <div>
                    <span className="text-zinc-400 block font-semibold">
                      {isMarketplaceChannel(channel) ? "Omzet Riil Diterima (Kas)" : "Total Tagihan (Omzet)"}
                    </span>
                    {isMarketplaceChannel(channel) && (
                      <span className="text-[10px] text-zinc-400 font-normal block">
                        Tagihan Invoice: {formatRupiah(financials.totalAmount)}
                      </span>
                    )}
                  </div>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {formatRupiah(
                      isMarketplaceChannel(channel)
                        ? Math.max(0, financials.totalAmount - financials.platformFee)
                        : financials.totalAmount
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                  <div>
                    <span className="block">Total Modal (COGS):</span>
                    <strong className="text-amber-400 font-mono text-xs">
                      {formatRupiah(financials.totalHpp)}
                    </strong>
                    <span className="block text-[9px] text-zinc-500">
                      Raw: {formatRupiah(financials.rawProductHppSubtotal)} • Box: {formatRupiah(financials.packagingCostSubtotal)}
                    </span>
                  </div>

                  <div>
                    <span className="block">Potongan Fee {getChannelLabel(channel)}:</span>
                    <strong className="text-orange-400 font-mono text-xs">
                      {formatRupiah(financials.platformFee)}
                    </strong>
                    <span className="block text-[9px] text-zinc-500">
                      {financials.feeLabel}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-400 block">
                      PENDAPATAN BERSIH RIIL
                    </span>
                    <span className="text-xl font-black text-emerald-400">
                      {formatRupiah(financials.netProfit)}
                    </span>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-emerald-600/30 text-emerald-300 border-emerald-500/40 text-xs font-bold">
                      Margin {financials.marginPct}%
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-4 gap-1 text-[11px]">
                  {[
                    { key: "CASH", label: "Tunai" },
                    { key: "QRIS", label: "QRIS" },
                    { key: "TRANSFER", label: "Transfer" },
                    { key: "SHOPEE_PAYOUT", label: "Shopee" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setPaymentMethod(m.key as PaymentMethod)}
                      className={`p-1.5 rounded-lg border text-center font-bold cursor-pointer transition-colors ${
                        paymentMethod === m.key
                          ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* CHECKOUT ACTION BUTTON */}
              <Button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting || cartProducts.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 text-sm shadow-md cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  "Memproses Transaksi & Pengurangan Stok..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Checkout & Kurangi Stok Otomatis
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SUCCESS MODAL / DIGITAL RECEIPT */}
      {checkoutSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Transaksi Berhasil di-Checkout!
              </h3>
              <p className="text-xs text-zinc-500">
                Nomor Pesanan: <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{checkoutSuccess.orderNumber}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Nilai Tagihan Invoice:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                  {formatRupiah(checkoutSuccess.totalAmount)}
                </span>
              </div>
              {checkoutSuccess.platformFee > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Potongan Fee Shopee:</span>
                    <span className="font-semibold text-orange-600 font-mono">
                      -{formatRupiah(checkoutSuccess.platformFee)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-1.5 rounded text-xs">
                    <span>Omzet Bersih Diterima (Kas):</span>
                    <span className="font-mono">
                      {formatRupiah(checkoutSuccess.totalAmount - checkoutSuccess.platformFee)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 font-bold">Pendapatan Bersih Riil:</span>
                <span className="font-black text-emerald-600 text-sm font-mono">
                  {formatRupiah(checkoutSuccess.netProfit)}
                </span>
              </div>
            </div>

            {/* Inventory deduction confirmation */}
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Boxes className="h-3.5 w-3.5 text-blue-600" /> Pengurangan Stok Terverifikasi:
              </span>
              <ul className="text-[11px] list-disc list-inside space-y-0.5">
                {checkoutSuccess.packagingDeductions.length > 0 ? (
                  checkoutSuccess.packagingDeductions.map((d, i) => <li key={i}>{d} telah dipotong dari inventaris</li>)
                ) : (
                  <li>Bahan kemasan tidak digunakan</li>
                )}
                <li>Material BOM produk telah dipotong</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={handleResetForNewOrder}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs cursor-pointer"
              >
                Transaksi Baru
              </Button>
              <Link href="/reports/recap" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs cursor-pointer border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                >
                  Lihat di Rekap
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
