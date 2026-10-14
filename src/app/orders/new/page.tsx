"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INITIAL_PRODUCTS } from "@/lib/data/initial-data";
import { formatRupiah } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChannelSource, PaymentStatus } from "@/types/database";
import { createOrderAction } from "../actions";
import {
  ArrowLeft,
  ShoppingCart,
  Sparkles,
  Palette,
  Calculator,
  AlertCircle,
} from "lucide-react";
import Decimal from "decimal.js";

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

export default function NewOrderPage() {
  const router = useRouter();

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerCity, setCustomerCity] = useState("Sukamara");
  const [customerPhone, setCustomerPhone] = useState("");
  const [channel, setChannel] = useState<ChannelSource>("Direct");

  // Product selection
  const [selectedProductId, setSelectedProductId] = useState(INITIAL_PRODUCTS[1].id); // Default Ollie
  const selectedProduct = useMemo(
    () => INITIAL_PRODUCTS.find((p) => p.id === selectedProductId) || INITIAL_PRODUCTS[0],
    [selectedProductId]
  );

  // Pricing & Quantities
  const [quantity, setQuantity] = useState(1);
  const [customUnitPrice, setCustomUnitPrice] = useState<number | "">("");
  const unitPrice = customUnitPrice !== "" ? Number(customUnitPrice) : selectedProduct.selling_price;

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

    // Platform Fee (Shopee: 8% Admin + 4% Gratis Ongkir Xtra max 10k)
    let platformFee = new Decimal(0);
    if (channel === "Shopee") {
      const adminFee = totalAmount.times(0.08);
      const ongkirXtra = Decimal.min(totalAmount.times(0.04), 10000);
      platformFee = adminFee.plus(ongkirXtra);
    }

    // Total Snapshot HPP for items
    const totalHppSnapshot = new Decimal(selectedProduct.current_hpp).times(qty);
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

    const colorDetails = `Base ${baseColor} + Shade ${shadeColor} + Cap ${capColor}`;

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
        customer_city: customerCity.trim(),
        customer_phone: customerPhone.trim() || undefined,
        channel,
        items: [
          {
            product_id: selectedProduct.id,
            quantity,
            unit_price: unitPrice,
            color_details: colorDetails,
            add_on_name: hasAddon && addonName.trim() ? addonName.trim() : undefined,
            add_on_price: hasAddon && addonPrice !== "" ? Number(addonPrice) : 0,
          },
        ],
        notes: notes.trim() || undefined,
        shipping_cost: calculations.shipping,
        discount_amount: calculations.discount,
        payment_status: paymentStatus,
        paid_amount: paid,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal membuat pesanan.");
        setLoading(false);
        return;
      }

      router.push(`/orders/${res.order?.id}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="outline" size="sm" className="gap-1 h-9">
              <ArrowLeft className="w-4 h-4" /> Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" /> Buat Pesanan Baru
            </h1>
            <p className="text-xs text-zinc-500">
              Formulir pencatatan transaksi omnichannel dengan kustomisasi warna dan live kalkulasi laba.
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
                    No. WhatsApp / Kontak (Opsional)
                  </label>
                  <Input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
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
                    className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Direct">Direct / Langsung (Sukamara)</option>
                    <option value="Shopee">Shopee (Marketplace)</option>
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
                Pilih model lampu dan rincian kombinasi filamen (Base, Shade, Cap).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product selector grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INITIAL_PRODUCTS.map((prod) => {
                  const isSelected = prod.id === selectedProductId;
                  return (
                    <button
                      type="button"
                      key={prod.id}
                      onClick={() => {
                        setSelectedProductId(prod.id);
                        setCustomUnitPrice(""); // Reset custom price when product changes
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500 dark:bg-amber-500/10"
                          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {prod.name.replace("Lampu Ambient - ", "")}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {formatRupiah(prod.selling_price)}
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-mono">
                        HPP {formatRupiah(prod.current_hpp)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Quantity and Custom Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Jumlah (Quantity)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>Harga Satuan (Rp)</span>
                    <span className="text-[11px] text-zinc-400">
                      Default: {formatRupiah(selectedProduct.selling_price)}
                    </span>
                  </label>
                  <Input
                    type="number"
                    placeholder={`Default: ${selectedProduct.selling_price}`}
                    value={customUnitPrice}
                    onChange={(e) =>
                      setCustomUnitPrice(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Color Details (Base, Shade, Cap) */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  <Palette className="w-4 h-4 text-amber-500" />
                  Kombinasi Warna Komponen (BOM)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Warna Dudukan (Base)
                    </label>
                    <Input
                      type="text"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Warna Kap / Penutup (Shade)
                    </label>
                    <Input
                      type="text"
                      value={shadeColor}
                      onChange={(e) => setShadeColor(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Warna Tutup Atas (Cap)
                    </label>
                    <Input
                      type="text"
                      value={capColor}
                      onChange={(e) => setCapColor(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                {/* Quick Color Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-zinc-400">Preset Cepat:</span>
                  {COLOR_PRESETS.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setBaseColor(color)}
                      className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                    >
                      {color.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Add-on & Extra Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Add-On Kustom & Catatan Khusus
              </CardTitle>
              <CardDescription>
                Kustomisasi khusus seperti miniatur figur, ukiran nama, kabel dimmer, atau kemasan kado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="addon-toggle"
                  checked={hasAddon}
                  onChange={(e) => setHasAddon(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="addon-toggle" className="text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Tambahkan Add-On Kustom (contoh: Kustom Cap Figur Lee Jeno Wahyu)
                </label>
              </div>

              {hasAddon && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Nama Add-On / Deskripsi
                    </label>
                    <Input
                      type="text"
                      placeholder="Contoh: Cap Custom Figur Lee Jeno"
                      value={addonName}
                      onChange={(e) => setAddonName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Biaya Tambahan Add-On (Rp)
                    </label>
                    <Input
                      type="number"
                      placeholder="30000"
                      value={addonPrice}
                      onChange={(e) =>
                        setAddonPrice(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Adjustments: Discount, Shipping, Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Diskon / Potongan Harga (Rp)
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
                    Ongkos Kirim Ditagih (Rp)
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
                  Catatan Transaksi / Instruksi Khusus
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Pengiriman COD, packing kayu, hadiah ulang tahun..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Financial Preview & Payment */}
        <div className="space-y-6">
          <Card className="sticky top-6 border-amber-500/40 shadow-md">
            <CardHeader className="bg-amber-500/5 dark:bg-amber-500/10 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-500" />
                Live Kalkulasi & Proyeksi Laba
              </CardTitle>
              <CardDescription>
                Snapshot HPP terkunci otomatis saat pesanan disimpan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Product summary */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Produk:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {selectedProduct.name} ({quantity}x)
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Subtotal Produk:</span>
                  <span className="font-mono">{formatRupiah(calculations.productSubtotal)}</span>
                </div>
                {calculations.addonTotal > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400">
                    <span>Add-On ({addonName || "Kustom"}):</span>
                    <span className="font-mono">+{formatRupiah(calculations.addonTotal)}</span>
                  </div>
                )}
                {calculations.shipping > 0 && (
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Ongkir:</span>
                    <span className="font-mono">+{formatRupiah(calculations.shipping)}</span>
                  </div>
                )}
                {calculations.discount > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Diskon:</span>
                    <span className="font-mono">-{formatRupiah(calculations.discount)}</span>
                  </div>
                )}

                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 flex justify-between font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-base text-amber-600 dark:text-amber-400">
                    {formatRupiah(calculations.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Financial snapshot details */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Analisis Finansial</span>
                  <Badge variant="outline" className="text-[10px]">
                    Snapshot
                  </Badge>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Snapshot HPP Total:</span>
                  <span className="font-mono">{formatRupiah(calculations.totalHppSnapshot)}</span>
                </div>
                {channel === "Shopee" && (
                  <div className="flex justify-between text-orange-600 dark:text-orange-400">
                    <span>Potongan Shopee (12%):</span>
                    <span className="font-mono">-{formatRupiah(calculations.platformFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span>Proyeksi Laba Kotor:</span>
                  <span
                    className={`font-mono ${
                      calculations.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatRupiah(calculations.grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>Margin Kotor Sejati:</span>
                  <span className="font-semibold text-emerald-600">
                    {calculations.grossMarginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Payment Section */}
              <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Status Pembayaran Awal
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "Belum Lunas", val: "UNPAID" },
                    { label: "DP (Sebagian)", val: "PARTIALLY_PAID" },
                    { label: "Lunas", val: "PAID" },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.val}
                      onClick={() => setPaymentStatus(p.val as PaymentStatus)}
                      className={`text-[11px] py-1.5 px-2 rounded-md font-medium border text-center transition-all ${
                        paymentStatus === p.val
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
                className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-2.5 shadow-sm mt-3"
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
