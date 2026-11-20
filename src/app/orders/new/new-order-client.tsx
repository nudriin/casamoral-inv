"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductWithBOM } from "@/lib/data/initial-data";
import { Material, ChannelSource, PaymentStatus } from "@/types/database";
import { formatRupiah, formatModelName } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculatePlatformFee } from "@/lib/financial/platform-fees";
import { createOrderAction } from "../actions";
import {
  ArrowLeft,
  ShoppingCart,
  Palette,
  Calculator,
  AlertCircle,
  Package,
  Layers,
  Lightbulb,
  Box,
  Check,
  Zap,
  Scale,
} from "lucide-react";
import Decimal from "decimal.js";
import type { CheckoutDeductionItem } from "@/lib/services/materials-service";

const COLOR_PRESETS = [
  "Oren (IndoCart PLA)",
  "Putih (eSUN PLA White)",
  "Hitam (eSUN PETG Black)",
  "Pink Sakura (PLA Matte)",
  "Dark Blue (IndoCart PLA)",
  "Clear (PETG Clear)",
  "Transparent Blue",
  "Transparent Pink",
];

interface NewOrderClientProps {
  products: ProductWithBOM[];
  materials?: Material[];
}

export function NewOrderClient({ products, materials = [] }: NewOrderClientProps) {
  const router = useRouter();

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [channel, setChannel] = useState<ChannelSource>("Direct");

  // Product selection
  const defaultProduct = products.length > 1 ? products[1] : products[0];
  const [selectedProductId, setSelectedProductId] = useState(defaultProduct?.id || "");
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || products[0] || null,
    [products, selectedProductId]
  );

  // Check if selected product has a Cap (Model Lumi does NOT have a Cap)
  const hasCap = useMemo(() => {
    if (!selectedProduct) return true;
    if (selectedProduct.bom?.capGram !== undefined && selectedProduct.bom.capGram === 0) {
      return false;
    }
    const nameLower = selectedProduct.name.toLowerCase();
    return !nameLower.includes("lumi");
  }, [selectedProduct]);

  // Pricing & Quantities
  const [quantity, setQuantity] = useState(1);
  const [customUnitPrice, setCustomUnitPrice] = useState<number | "">("");
  const unitPrice = customUnitPrice !== "" ? Number(customUnitPrice) : (selectedProduct?.selling_price || 0);

  // Colors
  const [shadeColor, setShadeColor] = useState("Putih (eSUN PLA White)");
  const [baseColor, setBaseColor] = useState("Oren (IndoCart PLA)");
  const [capColor, setCapColor] = useState("Oren (IndoCart PLA)");

  // Add-on
  const [hasAddon, setHasAddon] = useState(false);
  const [addonName, setAddonName] = useState("");
  const [addonPrice, setAddonPrice] = useState<number | "">("");

  // Discount & Shipping
  const [shippingCost, setShippingCost] = useState<number | "">("");
  const [discountAmount, setDiscountAmount] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  // Payment status
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("UNPAID");
  const [dpAmount, setDpAmount] = useState<number | "">("");

  // Checkout Material Deductions States
  const [deductFilament, setDeductFilament] = useState(true);
  const [customFilamentGrams, setCustomFilamentGrams] = useState<number | "">("");

  const [deductBulb, setDeductBulb] = useState(true);
  const [bulbVariant, setBulbVariant] = useState<"warm_white" | "cool_white" | "meval">("warm_white");
  const [bulbQty, setBulbQty] = useState(1);

  const [deductCable, setDeductCable] = useState(true);
  const [cableQty, setCableQty] = useState(1);

  const [deductFitting, setDeductFitting] = useState(true);
  const [fittingQty, setFittingQty] = useState(1);

  const [deductProtector, setDeductProtector] = useState(true);
  const [protectorQty, setProtectorQty] = useState(1);

  const [deductBox, setDeductBox] = useState(true);
  const [boxQty, setBoxQty] = useState(1);

  const [deductBubbleWrap, setDeductBubbleWrap] = useState(true);
  const [bubbleWrapMeters, setBubbleWrapMeters] = useState(1);

  const [deductHoneycomb, setDeductHoneycomb] = useState(false);
  const [honeycombLength, setHoneycombLength] = useState(50);
  const [honeycombUnit, setHoneycombUnit] = useState<"cm" | "meter">("cm");

  // Keep component quantities in sync with order quantity
  React.useEffect(() => {
    setBulbQty(quantity);
    setCableQty(quantity);
    setFittingQty(quantity);
    setProtectorQty(quantity);
    setBoxQty(quantity);
    setBubbleWrapMeters(quantity);
  }, [quantity]);

  // Model filament BOM breakdown
  const filamentBreakdown = useMemo(() => {
    if (!selectedProduct?.bom) {
      return { shade: 0, base: 0, cap: 0, totalPerUnit: 0, totalGrams: 0 };
    }
    const shade = selectedProduct.bom.shadeGram || 0;
    const base = selectedProduct.bom.baseGram || 0;
    const cap = hasCap ? (selectedProduct.bom.capGram || 0) : 0;
    const totalPerUnit = Number((shade + base + cap).toFixed(2)) || selectedProduct.bom.totalFilamentGram || 0;
    const totalGrams = Number((totalPerUnit * quantity).toFixed(2));
    return { shade, base, cap, totalPerUnit, totalGrams };
  }, [selectedProduct, hasCap, quantity]);

  // Compute deductions to pass to checkout
  const checkoutDeductions = useMemo<CheckoutDeductionItem[]>(() => {
    const list = materials && materials.length > 0 ? materials : [];
    const deductions: CheckoutDeductionItem[] = [];

    // 1. Filamen (calculated from model BOM)
    if (deductFilament) {
      const grams = customFilamentGrams !== "" ? Number(customFilamentGrams) : filamentBreakdown.totalGrams;
      if (grams > 0) {
        const filMat = list.find((m) => m.category === "filament") || {
          id: "mat-01",
          name: "Filamen PLA/PETG Standar (Campuran)",
        };
        deductions.push({
          material_id: filMat.id,
          name: `Filamen (Model ${formatModelName(selectedProduct)})`,
          quantity: grams,
          unit: "gram",
        });
      }
    }

    // 2. Lampu LED Bulb 3W
    if (deductBulb && bulbQty > 0) {
      const bulbMat = list.find(
        (m) => m.name.toLowerCase().includes("lampu") || m.name.toLowerCase().includes("led")
      ) || { id: "mat-02", name: "Lampu LED Bulb / Module Inlite 3W" };
      const variantName =
        bulbVariant === "warm_white"
          ? "Inlite 3W Warm White (Kuning)"
          : bulbVariant === "cool_white"
          ? "Inlite 3W Cool White (Putih)"
          : "Meval 3W (Kuning)";
      deductions.push({
        material_id: bulbMat.id,
        name: `Bohlam LED 3W - ${variantName}`,
        quantity: bulbQty,
        unit: "pcs",
      });
    }

    // 3. Kabel Sakelar On/Off
    if (deductCable && cableQty > 0) {
      const cableMat = list.find((m) => m.name.toLowerCase().includes("kabel sakelar")) || {
        id: "mat-04",
        name: "Kabel Sakelar On/Off",
      };
      deductions.push({
        material_id: cableMat.id,
        name: cableMat.name,
        quantity: cableQty,
        unit: "pcs",
      });
    }

    // 4. Fitting Lampu E27
    if (deductFitting && fittingQty > 0) {
      const fitMat = list.find((m) => m.name.toLowerCase().includes("fitting")) || {
        id: "mat-03",
        name: "Fitting Lampu E27",
      };
      deductions.push({
        material_id: fitMat.id,
        name: fitMat.name,
        quantity: fittingQty,
        unit: "pcs",
      });
    }

    // 5. Karet Pelindung Kabel
    if (deductProtector && protectorQty > 0) {
      const protMat = list.find((m) => m.name.toLowerCase().includes("pelindung")) || {
        id: "mat-05",
        name: "Karet Pelindung Kabel",
      };
      deductions.push({
        material_id: protMat.id,
        name: protMat.name,
        quantity: protectorQty,
        unit: "pcs",
      });
    }

    // 6. Kardus Kemasan Karton 20x20x20
    if (deductBox && boxQty > 0) {
      const boxMat = list.find((m) => m.name.toLowerCase().includes("kardus")) || {
        id: "mat-06",
        name: "Kardus Kemasan Karton 20x20x20",
      };
      deductions.push({
        material_id: boxMat.id,
        name: boxMat.name,
        quantity: boxQty,
        unit: "pcs",
      });
    }

    // 7. Bubble Wrap Roll
    if (deductBubbleWrap && bubbleWrapMeters > 0) {
      const bwMat = list.find((m) => m.name.toLowerCase().includes("bubble wrap")) || {
        id: "mat-07",
        name: "Bubble Wrap Roll 30cm x 50m",
      };
      deductions.push({
        material_id: bwMat.id,
        name: bwMat.name,
        quantity: bubbleWrapMeters,
        unit: "meter",
      });
    }

    // 8. Kertas Packing Honeycomb
    if (deductHoneycomb && honeycombLength > 0) {
      const meters = honeycombUnit === "cm" ? Number((honeycombLength / 100).toFixed(2)) : honeycombLength;
      const hcMat = list.find((m) => m.name.toLowerCase().includes("honeycomb")) || {
        id: "mat-08",
        name: "Kertas Packing Honeycomb 30cm x 50m",
      };
      if (meters > 0) {
        deductions.push({
          material_id: hcMat.id,
          name: `Kertas Packing Honeycomb (${honeycombLength} ${honeycombUnit})`,
          quantity: meters,
          unit: "meter",
        });
      }
    }

    return deductions;
  }, [
    materials,
    deductFilament,
    customFilamentGrams,
    filamentBreakdown,
    selectedProduct,
    deductBulb,
    bulbVariant,
    bulbQty,
    deductCable,
    cableQty,
    deductFitting,
    fittingQty,
    deductProtector,
    protectorQty,
    deductBox,
    boxQty,
    deductBubbleWrap,
    bubbleWrapMeters,
    deductHoneycomb,
    honeycombLength,
    honeycombUnit,
  ]);

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculations
  const calculations = useMemo(() => {
    const qty = Math.max(1, quantity);
    const pSubtotal = new Decimal(unitPrice).times(qty);
    const aPrice = hasAddon && addonPrice !== "" ? new Decimal(addonPrice).times(qty) : new Decimal(0);
    const ship = shippingCost !== "" ? new Decimal(shippingCost) : new Decimal(0);
    const disc = discountAmount !== "" ? new Decimal(discountAmount) : new Decimal(0);

    const totalBeforeFees = pSubtotal.plus(aPrice).plus(ship).minus(disc);
    const totalAmount = Decimal.max(0, totalBeforeFees);

    // Platform Fee (Centralized calculation across channels)
    const feeBreakdown = calculatePlatformFee(channel, totalAmount.toNumber());
    const platformFee = new Decimal(feeBreakdown.totalFee);

    // Total Snapshot HPP for items
    const hppPerUnit = selectedProduct ? selectedProduct.current_hpp : 0;
    const totalHppSnapshot = new Decimal(hppPerUnit).times(qty);
    const grossProfit = totalAmount.minus(platformFee).minus(totalHppSnapshot);
    const grossMarginPercent = totalAmount.greaterThan(0)
      ? grossProfit.dividedBy(totalAmount).times(100)
      : new Decimal(0);

    return {
      productSubtotal: pSubtotal.toNumber(),
      addonTotal: aPrice.toNumber(),
      shipping: ship.toNumber(),
      discount: disc.toNumber(),
      platformFee: platformFee.toNumber(),
      feeLabel: feeBreakdown.label,
      totalAmount: totalAmount.toNumber(),
      totalHppSnapshot: totalHppSnapshot.toNumber(),
      grossProfit: grossProfit.toNumber(),
      grossMarginPercent: grossMarginPercent.toNumber(),
    };
  }, [
    quantity,
    unitPrice,
    hasAddon,
    addonPrice,
    shippingCost,
    discountAmount,
    channel,
    selectedProduct,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg("Nama pelanggan wajib diisi.");
      return;
    }

    if (!selectedProduct) {
      setErrorMsg("Pilih salah satu produk/model terlebih dahulu.");
      return;
    }

    const colorDetails = hasCap
      ? `Base ${baseColor} + Shade ${shadeColor} + Cap ${capColor}`
      : `Base ${baseColor} + Shade ${shadeColor}`;

    let paid = 0;
    if (paymentStatus === "PAID") {
      paid = calculations.totalAmount;
    } else if (paymentStatus === "PARTIALLY_PAID") {
      paid = dpAmount !== "" ? Number(dpAmount) : 0;
    }

    setLoading(true);

    try {
      const res = await createOrderAction({
        customer_name: customerName.trim(),
        customer_city: customerCity.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        channel,
        shopee_fee_model: "PRECISE_STORE",
        items: [
          {
            product_id: selectedProduct.id,
            quantity,
            unit_price: unitPrice,
            color_details: colorDetails,
            add_on_name: hasAddon ? addonName.trim() || undefined : undefined,
            add_on_price: hasAddon && addonPrice !== "" ? Number(addonPrice) : 0,
          },
        ],
        discount_amount: discountAmount !== "" ? Number(discountAmount) : 0,
        shipping_cost: shippingCost !== "" ? Number(shippingCost) : 0,
        payment_status: paymentStatus,
        paid_amount: paid,
        notes: notes.trim() || undefined,
        checkout_deductions: checkoutDeductions,
      });

      if (res.success && res.order) {
        router.push(`/orders/${res.order.id}`);
      } else {
        setErrorMsg(res.error || "Gagal membuat pesanan.");
        setLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan internal.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="outline" size="sm" className="gap-1 h-9 cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Batal
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              Input Pesanan Baru (Omnichannel)
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Kustomisasi warna filamen, add-on khusus, simulasi laba kotor riil, dan kunci snapshot HPP.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Input Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Customer & Channel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Informasi Pelanggan & Kanal
              </CardTitle>
              <CardDescription>
                Tentukan identitas pemesan dan platform asal transaksi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Nama Pelanggan <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: Wahyu / Mama / Acil Ely"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Kota / Domisili
                  </label>
                  <Input
                    type="text"
                    placeholder="Sukamara / Palangka Raya"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Nomor WhatsApp / Kontak (Opsional)
                  </label>
                  <Input
                    type="text"
                    placeholder="0812xxxxxxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Kanal Penjualan
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as ChannelSource)}
                    className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Direct">Direct</option>
                    <option value="Shopee">Shopee (Marketplace)</option>
                    <option value="TikTokShop">TikTok Shop (Marketplace)</option>
                    <option value="Tokopedia">Tokopedia (Marketplace)</option>
                    <option value="WhatsApp">WhatsApp Chat</option>
                    <option value="Instagram">Instagram Direct Message</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Model & Color Customization */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Model Lampu & Kustomisasi Warna
              </CardTitle>
              <CardDescription>
                Pilih model lampu dan rincian kombinasi filamen ({hasCap ? "Base, Shade, Cap" : "Base & Shade"}).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product selector grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {products.map((prod) => {
                  const isSelected = prod.id === selectedProductId;
                  return (
                    <button
                      type="button"
                      key={prod.id}
                      onClick={() => {
                        setSelectedProductId(prod.id);
                        setCustomUnitPrice("");
                      }}
                      className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500 dark:bg-amber-500/10"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {prod.name.replace("Lampu Ambient - ", "")}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                        {formatRupiah(prod.selling_price)}
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                        HPP: {formatRupiah(prod.current_hpp)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Color Customization Stepper */}
              <div className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg p-3 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-500" />
                  {hasCap ? "Kombinasi Warna Komponen (BOM 3-Bagian)" : "Kombinasi Warna Komponen (BOM 2-Bagian: Tanpa Cap)"}
                </div>

                <div className={`grid grid-cols-1 ${hasCap ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
                  <div>
                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Shade (Kap Lampu)
                    </label>
                    <select
                      value={shadeColor}
                      onChange={(e) => setShadeColor(e.target.value)}
                      className="mt-1 w-full rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs cursor-pointer"
                    >
                      {COLOR_PRESETS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Base (Dudukan Bawah)
                    </label>
                    <select
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="mt-1 w-full rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs cursor-pointer"
                    >
                      {COLOR_PRESETS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {hasCap && (
                    <div>
                      <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        Cap / Mur Pengunci
                      </label>
                      <select
                        value={capColor}
                        onChange={(e) => setCapColor(e.target.value)}
                        className="mt-1 w-full rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs cursor-pointer"
                      >
                        {COLOR_PRESETS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Quantities & Price Override */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Jumlah Pesanan (Qty Unit)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Harga Satuan (Rp)</span>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      Standar: {formatRupiah(selectedProduct ? selectedProduct.selling_price : 0)}
                    </span>
                  </label>
                  <Input
                    type="number"
                    placeholder={selectedProduct ? selectedProduct.selling_price.toString() : "120000"}
                    value={customUnitPrice}
                    onChange={(e) =>
                      setCustomUnitPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Pengurangan Stok Bahan & Kemasan (Checkout Otomatis) */}
          <Card className="border-amber-500/30 dark:border-amber-600/30 bg-amber-500/5 dark:bg-amber-950/10">
            <CardHeader className="pb-3 border-b border-amber-500/15">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  Pengurangan Stok Bahan & Kemasan (Checkout Otomatis)
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  BOM Otomatis & Terpilih
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400">
                Pilih komponen & kemasan yang akan dipotong langsung dari inventori saat checkout tanpa perlu stock opname manual.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* 1. Filamen Sesuai BOM Model */}
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-zinc-900 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deductFilament}
                      onChange={(e) => setDeductFilament(e.target.checked)}
                      className="mt-0.5 rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                    />
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        Filamen 3D Print Model {formatModelName(selectedProduct)}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Kebutuhan BOM: Shade ({filamentBreakdown.shade}g) + Base ({filamentBreakdown.base}g)
                        {hasCap ? ` + Cap (${filamentBreakdown.cap}g)` : ""} ={" "}
                        <strong className="text-amber-600 dark:text-amber-400">
                          {filamentBreakdown.totalPerUnit}g / unit
                        </strong>
                      </div>
                    </div>
                  </label>

                  {deductFilament && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-zinc-400 block">Total Terpotong:</span>
                      <strong className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                        {customFilamentGrams !== "" ? customFilamentGrams : filamentBreakdown.totalGrams} gram
                      </strong>
                    </div>
                  )}
                </div>

                {deductFilament && (
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                    <span className="text-zinc-500">Sesuaikan Gramasi (Opsional):</span>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder={filamentBreakdown.totalGrams.toString()}
                      value={customFilamentGrams}
                      onChange={(e) =>
                        setCustomFilamentGrams(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="h-7 w-28 text-xs font-mono font-semibold"
                    />
                    <span className="text-zinc-400 text-[10px]">gram (Default: {filamentBreakdown.totalGrams}g)</span>
                  </div>
                )}
              </div>

              {/* 2. Komponen Kelistrikan & Lampu */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Komponen Kelistrikan & Bohlam
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Lampu / Bohlam */}
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={deductBulb}
                          onChange={(e) => setDeductBulb(e.target.checked)}
                          className="rounded border-zinc-300 text-amber-600 h-3.5 w-3.5"
                        />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                          Lampu LED Bulb 3W
                        </span>
                      </div>
                      {deductBulb && (
                        <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                          {bulbQty} pcs
                        </span>
                      )}
                    </label>

                    {deductBulb && (
                      <select
                        value={bulbVariant}
                        onChange={(e) => setBulbVariant(e.target.value as any)}
                        className="w-full h-7 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 text-[11px] cursor-pointer"
                      >
                        <option value="warm_white">Inlite 3W - Warm White (Kuning)</option>
                        <option value="cool_white">Inlite 3W - Cool White (Putih)</option>
                        <option value="meval">Meval 3W (Kuning)</option>
                      </select>
                    )}
                  </div>

                  {/* Kabel Sakelar */}
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deductCable}
                        onChange={(e) => setDeductCable(e.target.checked)}
                        className="rounded border-zinc-300 text-amber-600 h-3.5 w-3.5"
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                        Kabel Sakelar On/Off
                      </span>
                    </label>
                    {deductCable && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          value={cableQty}
                          onChange={(e) => setCableQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-6 w-12 text-[11px] font-mono text-center p-1"
                        />
                        <span className="text-[10px] text-zinc-400">pcs</span>
                      </div>
                    )}
                  </div>

                  {/* Fitting Lampu E27 */}
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deductFitting}
                        onChange={(e) => setDeductFitting(e.target.checked)}
                        className="rounded border-zinc-300 text-amber-600 h-3.5 w-3.5"
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                        Fitting Lampu E27
                      </span>
                    </label>
                    {deductFitting && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          value={fittingQty}
                          onChange={(e) => setFittingQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-6 w-12 text-[11px] font-mono text-center p-1"
                        />
                        <span className="text-[10px] text-zinc-400">pcs</span>
                      </div>
                    )}
                  </div>

                  {/* Karet Pelindung Kabel */}
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deductProtector}
                        onChange={(e) => setDeductProtector(e.target.checked)}
                        className="rounded border-zinc-300 text-amber-600 h-3.5 w-3.5"
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                        Karet Pelindung Kabel
                      </span>
                    </label>
                    {deductProtector && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="1"
                          value={protectorQty}
                          onChange={(e) => setProtectorQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-6 w-12 text-[11px] font-mono text-center p-1"
                        />
                        <span className="text-[10px] text-zinc-400">pcs</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Kemasan & Packing Pelindung */}
              <div className="space-y-2 pt-1 border-t border-zinc-200/80 dark:border-zinc-800/80">
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  Kemasan & Perlengkapan Packing
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {/* Kardus 20x20x20 */}
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deductBox}
                        onChange={(e) => setDeductBox(e.target.checked)}
                        className="rounded border-zinc-300 text-amber-600 h-3.5 w-3.5"
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                        Kardus Karton 20x20x20
                      </span>
                    </label>
                    {deductBox && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 text-[10px]">Kuantitas:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="1"
                            value={boxQty}
                            onChange={(e) => setBoxQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="h-6 w-12 text-[11px] font-mono text-center p-1"
                          />
                          <span className="text-[10px] text-zinc-400">pcs</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bubble Wrap Roll */}
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deductBubbleWrap}
                        onChange={(e) => setDeductBubbleWrap(e.target.checked)}
                        className="rounded border-zinc-300 text-amber-600 h-3.5 w-3.5"
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                        Bubble Wrap Roll
                      </span>
                    </label>
                    {deductBubbleWrap && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 text-[10px]">Panjang:</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={bubbleWrapMeters}
                            onChange={(e) => setBubbleWrapMeters(Math.max(0.1, Number(e.target.value) || 1))}
                            className="h-6 w-14 text-[11px] font-mono text-center p-1"
                          />
                          <span className="text-[10px] text-zinc-400">meter</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Kertas Packing Honeycomb */}
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deductHoneycomb}
                        onChange={(e) => setDeductHoneycomb(e.target.checked)}
                        className="rounded border-zinc-300 text-amber-600 h-3.5 w-3.5"
                      />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[11px]">
                        Kertas Honeycomb
                      </span>
                    </label>
                    {deductHoneycomb && (
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <Input
                          type="number"
                          step="any"
                          min="1"
                          value={honeycombLength}
                          onChange={(e) => setHoneycombLength(Math.max(1, Number(e.target.value) || 1))}
                          className="h-6 w-14 text-[11px] font-mono text-center p-1"
                        />
                        <select
                          value={honeycombUnit}
                          onChange={(e) => setHoneycombUnit(e.target.value as any)}
                          className="h-6 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-1 text-[10px]"
                        >
                          <option value="cm">cm</option>
                          <option value="meter">meter</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Add-on, Discount, Shipping */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 text-xs flex items-center justify-center font-bold">
                  4
                </span>
                Kustomisasi Tambahan, Diskon & Biaya Kirim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add-on toggle */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAddon}
                    onChange={(e) => setHasAddon(e.target.checked)}
                    className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Tambahkan Add-on Kustom (Contoh: Karakter Lee Jeno, Emboss Logo)
                  </span>
                </label>

                {hasAddon && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <label className="text-[11px] font-medium text-zinc-500">Nama Add-on</label>
                      <Input
                        type="text"
                        placeholder="Contoh: Lee Jeno"
                        value={addonName}
                        onChange={(e) => setAddonName(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-zinc-500">Biaya Add-on (Rp)</label>
                      <Input
                        type="number"
                        placeholder="Contoh: 30000"
                        value={addonPrice}
                        onChange={(e) =>
                          setAddonPrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Discount & Shipping */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Potongan Diskon (Rp)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={discountAmount}
                    onChange={(e) =>
                      setDiscountAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Ongkos Kirim Ditagihkan (Rp)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={shippingCost}
                    onChange={(e) =>
                      setShippingCost(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Catatan Pesanan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan pengiriman, permintaan packaging bubble wrap ekstra, dll."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Live Financial Simulator & Checkout */}
        <div className="space-y-6">
          <Card className="sticky top-20 border-amber-500/30 shadow-md">
            <CardHeader className="bg-amber-500/10 dark:bg-amber-500/15 pb-4 border-b border-amber-500/20">
              <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>Ringkasan & Simulasi Finansial</span>
                <Calculator className="w-4 h-4" />
              </CardTitle>
              <CardDescription className="text-xs text-amber-900/70 dark:text-amber-300/70">
                Kalkulasi otomatis pendapatan kotor, potongan fee, dan laba kotor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Product preview */}
              <div className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {selectedProduct?.name} x {quantity} unit
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Base: {baseColor} • Shade: {shadeColor}
                </div>
                {hasAddon && addonName && (
                  <Badge variant="outline" className="text-[10px] mt-1.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-300">
                    Add-on: {addonName} (+{formatRupiah(addonPrice || 0)})
                  </Badge>
                )}

                {/* Live Checkout Inventory Deductions Summary */}
                <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 mb-1">
                    <span className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                      <Box className="w-3 h-3" /> Potong Stok Checkout:
                    </span>
                    <strong className="font-mono text-zinc-800 dark:text-zinc-200">
                      {checkoutDeductions.length} bahan
                    </strong>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {checkoutDeductions.map((d, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono"
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-500" />
                        {d.quantity} {d.unit} {d.name.replace(" (Model Ollie)", "").replace(" (Model Lumi)", "").replace(" (Model Kumo)", "").replace(" (Model Pomi)", "").replace(" (Model Nomi)", "")}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Line item breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal Produk</span>
                  <span>{formatRupiah(calculations.productSubtotal)}</span>
                </div>

                {hasAddon && calculations.addonTotal > 0 && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Total Add-on</span>
                    <span>+{formatRupiah(calculations.addonTotal)}</span>
                  </div>
                )}

                {calculations.shipping > 0 && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Ongkos Kirim</span>
                    <span>+{formatRupiah(calculations.shipping)}</span>
                  </div>
                )}

                {calculations.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Potongan Diskon</span>
                    <span>-{formatRupiah(calculations.discount)}</span>
                  </div>
                )}

                {calculations.platformFee > 0 && (
                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium pt-1">
                    <span>Fee Marketplace ({calculations.feeLabel})</span>
                    <span>-{formatRupiah(calculations.platformFee)}</span>
                  </div>
                )}

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 flex justify-between font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  <span>Total Tagihan</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    {formatRupiah(calculations.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Profitability insight card */}
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 border border-zinc-200/80 dark:border-zinc-800/80 text-xs space-y-1.5">
                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
                  Analisis Laba Kotor Riil
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Snapshot HPP Total</span>
                  <span className="font-mono">{formatRupiah(calculations.totalHppSnapshot)}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Estimasi Laba Kotor</span>
                  <span className="font-bold text-emerald-600">
                    {formatRupiah(calculations.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Gross Margin %</span>
                  <span className="font-bold text-emerald-600">
                    {calculations.grossMarginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Payment Status Option */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                  Status Pembayaran Awal
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { value: "UNPAID", label: "Belum Bayar" },
                    { value: "PARTIALLY_PAID", label: "DP (Termin)" },
                    { value: "PAID", label: "Lunas" },
                  ].map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPaymentStatus(p.value as PaymentStatus)}
                      className={`py-1.5 px-2 rounded border text-center transition-all text-[11px] cursor-pointer ${
                        paymentStatus === p.value
                          ? "bg-amber-500 text-zinc-950 border-amber-500 font-semibold shadow-xs"
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {paymentStatus === "PARTIALLY_PAID" && (
                  <div className="mt-2">
                    <label className="text-[11px] text-zinc-500">Jumlah DP Masuk (Rp)</label>
                    <Input
                      type="number"
                      placeholder="Contoh: 50000"
                      value={dpAmount}
                      onChange={(e) =>
                        setDpAmount(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="mt-1 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-2.5 shadow-sm mt-3 cursor-pointer"
              >
                {loading ? "Menyimpan Pesanan..." : "Simpan Pesanan & Kunci Snapshot HPP"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
