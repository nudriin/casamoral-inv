"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Order, OrderStatus, PaymentStatus, ChannelSource, Product } from "@/types/database";
import { INITIAL_PRODUCTS, ALL_PRODUCTS, ProductWithBOM } from "@/lib/data/initial-data";
import { updateOrderAction } from "@/app/orders/actions";
import { formatRupiah, formatModelName } from "@/lib/utils";
import { calculatePlatformFee, isMarketplaceChannel, getChannelLabel } from "@/lib/financial/platform-fees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Save,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  CreditCard,
  User,
  MapPin,
  FileText,
  AlertCircle,
  Truck,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

interface EditOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedOrder: Order) => void;
  onDeleted?: (deletedOrderId: string) => void;
  availableProducts?: ProductWithBOM[] | Product[];
}

interface EditableOrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitHpp: number;
  colorDetails: string;
  addOnName: string;
  addOnPrice: number;
}

import { DeleteOrderModal } from "./delete-order-modal";

export function EditOrderModal({ order, isOpen, onClose, onSaved, onDeleted, availableProducts }: EditOrderModalProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Dynamic Product Options mapped from Menu Model / Master Catalog
  const productOptions = useMemo(() => {
    const list = availableProducts && availableProducts.length > 0 ? availableProducts : ALL_PRODUCTS;
    return list.map((p) => {
      const cleanName = formatModelName(p);
      const displayName = `Model ${cleanName}`;
      const hasCap = (p as ProductWithBOM).bom?.capGram !== undefined
        ? ((p as ProductWithBOM).bom?.capGram ?? 0) > 0
        : !cleanName.toLowerCase().includes("lumi");

      return {
        id: p.id,
        name: displayName,
        cleanName,
        price: p.selling_price || 0,
        hpp: p.current_hpp || 0,
        hasCap,
      };
    });
  }, [availableProducts]);

  // Local state
  const [orderDate, setOrderDate] = useState(order.order_date ? order.order_date.slice(0, 10) : "");
  const [channel, setChannel] = useState<ChannelSource>(order.channel || "Direct");
  const [status, setStatus] = useState<OrderStatus>(order.status || "PENDING");
  const [customerName, setCustomerName] = useState(order.customer?.name || "");
  const [customerCity, setCustomerCity] = useState(order.customer?.city || "");
  const [customerPhone, setCustomerPhone] = useState(order.customer?.phone || "");
  const [notes, setNotes] = useState(order.notes || "");

  const [shippingCost, setShippingCost] = useState<number>(order.shipping_cost || 0);
  const [discountAmount, setDiscountAmount] = useState<number>(order.discount_amount || 0);

  const [autoMarketplaceFee, setAutoMarketplaceFee] = useState<boolean>(isMarketplaceChannel(order.channel || ""));
  const [platformFee, setPlatformFee] = useState<number>(order.platform_fee || 0);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.payment_status || "UNPAID");
  const [paidAmount, setPaidAmount] = useState<number>(order.paid_amount || 0);

  // Items
  const [items, setItems] = useState<EditableOrderItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever modal opens or order changes
  useEffect(() => {
    if (isOpen && order) {
      setOrderDate(order.order_date ? order.order_date.slice(0, 10) : "");
      setChannel(order.channel || "Direct");
      setStatus(order.status || "PENDING");
      setCustomerName(order.customer?.name || "");
      setCustomerCity(order.customer?.city || "");
      setCustomerPhone(order.customer?.phone || "");
      setNotes(order.notes || "");
      setShippingCost(order.shipping_cost || 0);
      setDiscountAmount(order.discount_amount || 0);
      setAutoMarketplaceFee(isMarketplaceChannel(order.channel || ""));
      setPlatformFee(order.platform_fee || 0);
      setPaymentStatus(order.payment_status || "UNPAID");
      setPaidAmount(order.paid_amount || 0);
      setErrorMsg(null);

      const mappedItems: EditableOrderItem[] = (order.items || []).map((i) => {
        const matched = productOptions.find((p) => p.id === i.product_id);
        const modelName = matched?.cleanName || formatModelName(i);
        return {
          id: i.id,
          productId: i.product_id || matched?.id || "prod-02",
          productName: modelName,
          quantity: i.quantity || 1,
          unitPrice: i.unit_price || matched?.price || 0,
          unitHpp: i.unit_hpp || matched?.hpp || 89705,
          colorDetails: i.color_details || "",
          addOnName: i.add_on_name || "",
          addOnPrice: i.add_on_price || 0,
        };
      });

      const defaultProd = productOptions[0] || {
        id: "prod-01",
        name: "Model Lumi",
        cleanName: "Lumi",
        price: 130000,
        hpp: 76950,
        hasCap: false,
      };

      setItems(
        mappedItems.length > 0
          ? mappedItems
          : [
              {
                productId: defaultProd.id,
                productName: defaultProd.cleanName,
                quantity: 1,
                unitPrice: defaultProd.price,
                unitHpp: defaultProd.hpp,
                colorDetails: defaultProd.hasCap ? "Base Oren + Shade Putih + Cap Oren" : "Base Oren + Shade Putih",
                addOnName: "",
                addOnPrice: 0,
              },
            ]
      );
    }
  }, [isOpen, order, productOptions]);

  // Live calculations
  const financials = useMemo(() => {
    let subtotal = 0;
    let addOnTotal = 0;
    let rawHpp = 0;

    for (const it of items) {
      const q = Math.max(1, it.quantity || 1);
      subtotal += (it.unitPrice || 0) * q;
      addOnTotal += (it.addOnPrice || 0) * q;
      rawHpp += (it.unitHpp || 0) * q;
    }

    const ship = Number(shippingCost) || 0;
    const disc = Number(discountAmount) || 0;
    const totalInvoice = Math.max(0, subtotal + addOnTotal + ship - disc);

    // Platform fee calculation
    let computedFee = Number(platformFee) || 0;
    let feeLabel = "Manual";
    if (autoMarketplaceFee) {
      const breakdown = calculatePlatformFee(channel, totalInvoice);
      computedFee = breakdown.totalFee;
      feeLabel = breakdown.label;
    }

    const netRealizedRevenue = Math.max(0, totalInvoice - computedFee);
    const packagingCost = order.packaging_cost || 0;
    const totalHpp = rawHpp + packagingCost;
    const netProfit = netRealizedRevenue - totalHpp;
    const remainingReceivable = Math.max(0, totalInvoice - (Number(paidAmount) || 0));

    return {
      subtotal,
      addOnTotal,
      totalInvoice,
      computedFee,
      feeLabel,
      netRealizedRevenue,
      packagingCost,
      rawHpp,
      totalHpp,
      netProfit,
      remainingReceivable,
    };
  }, [items, shippingCost, discountAmount, channel, autoMarketplaceFee, platformFee, paidAmount, order.packaging_cost]);

  // Handle Preset Model Selection
  const handleSelectPreset = (index: number, selectedId: string) => {
    if (selectedId === "custom") {
      setItems((prev) =>
        prev.map((it, idx) => (idx === index ? { ...it, productId: "custom" } : it))
      );
      return;
    }

    const preset = productOptions.find((p) => p.id === selectedId);
    if (!preset) return;

    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        let nextColor = it.colorDetails;
        if (!preset.hasCap && nextColor.toLowerCase().includes("cap")) {
          nextColor = nextColor.replace(/\s*\+\s*Cap[^,+]+/i, "").trim();
        }
        return {
          ...it,
          productId: preset.id,
          productName: preset.cleanName,
          unitPrice: preset.price,
          unitHpp: preset.hpp,
          colorDetails: nextColor,
        };
      })
    );
  };

  const handleItemChange = (index: number, field: keyof EditableOrderItem, value: any) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, [field]: value } : it))
    );
  };

  const handleAddItem = () => {
    const defaultProduct = productOptions[0] || {
      id: "prod-01",
      name: "Model Lumi",
      cleanName: "Lumi",
      price: 130000,
      hpp: 76950,
      hasCap: false,
    };

    setItems((prev) => [
      ...prev,
      {
        productId: defaultProduct.id,
        productName: defaultProduct.cleanName,
        quantity: 1,
        unitPrice: defaultProduct.price,
        unitHpp: defaultProduct.hpp,
        colorDetails: defaultProduct.hasCap ? "Base Oren + Shade Putih + Cap Oren" : "Base Oren + Shade Putih",
        addOnName: "",
        addOnPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMsg("Pesanan harus memiliki minimal 1 produk.");
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Quick Payment status setters
  const handleSetPaidInFull = () => {
    setPaidAmount(financials.totalInvoice);
    setPaymentStatus("PAID");
  };

  const handleSetUnpaid = () => {
    setPaidAmount(0);
    setPaymentStatus("UNPAID");
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg("Nama pelanggan wajib diisi.");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("Pesanan harus memiliki minimal 1 item produk.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updateOrderAction({
        order_id: order.id,
        order_date: orderDate ? `${orderDate}T12:00:00Z` : undefined,
        channel,
        status,
        customer_name: customerName.trim(),
        customer_city: customerCity.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          id: it.id,
          product_id: it.productId,
          product_name: it.productName,
          quantity: Number(it.quantity) || 1,
          unit_price: Number(it.unitPrice) || 0,
          unit_hpp: Number(it.unitHpp) || 0,
          color_details: it.colorDetails.trim() || undefined,
          add_on_name: it.addOnName.trim() || undefined,
          add_on_price: Number(it.addOnPrice) || 0,
        })),
        shipping_cost: Number(shippingCost) || 0,
        discount_amount: Number(discountAmount) || 0,
        platform_fee: financials.computedFee,
        recalculate_platform_fee: autoMarketplaceFee,
        payment_status: paymentStatus,
        paid_amount: Number(paidAmount) || 0,
      });

      if (res.success && res.order) {
        if (onSaved) onSaved(res.order);
        onClose();
      } else {
        setErrorMsg(res.error || "Gagal menyimpan perubahan transaksi.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Edit Data Transaksi
                </h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {order.order_number}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">
                Ubah rincian model, add-on, pelanggan, lokasi, status alur, dan pembayaran transaksi ini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Tanggal, Kanal & Status Alur Produksi */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-4">
            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
              <Truck className="w-4 h-4 text-amber-600" /> 1. Kanal, Tanggal & Status Alur Produksi
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Tanggal Transaksi
                </label>
                <Input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Kanal Penjualan
                </label>
                <select
                  value={channel}
                  onChange={(e) => {
                    const nextChan = e.target.value as ChannelSource;
                    setChannel(nextChan);
                    if (isMarketplaceChannel(nextChan)) setAutoMarketplaceFee(true);
                  }}
                  className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 text-xs font-semibold"
                >
                  <option value="Direct">Direct</option>
                  <option value="Shopee">Shopee</option>
                  <option value="TikTokShop">TikTok Shop</option>
                  <option value="Tokopedia">Tokopedia</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Other">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Status Alur Produksi
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 text-xs font-bold text-amber-700 dark:text-amber-400"
                >
                  <option value="PENDING">Menunggu (PENDING)</option>
                  <option value="CONFIRMED">Dikonfirmasi (CONFIRMED)</option>
                  <option value="IN_PRODUCTION">Diproduksi Cetak 3D (IN_PRODUCTION)</option>
                  <option value="READY">Siap Kirim / QC (READY)</option>
                  <option value="SHIPPED">Sedang Dikirim (SHIPPED)</option>
                  <option value="COMPLETED">Pesanan Selesai (COMPLETED)</option>
                  <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Data Pelanggan & Lokasi */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-4">
            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
              <User className="w-4 h-4 text-emerald-600" /> 2. Data Pelanggan & Lokasi Pengiriman
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Nama Pelanggan *
                </label>
                <Input
                  type="text"
                  placeholder="Misal: Mahput / Mama / Wahyu"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-8 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Kota / Wilayah
                </label>
                <Input
                  type="text"
                  placeholder="Misal: Sukamara / Palangka Raya"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  No. WhatsApp / Telepon
                </label>
                <Input
                  type="text"
                  placeholder="08xxxxxxxxxx"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Model Produk, Variasi Warna & Add-On */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-500" /> 3. Model Lampu, Variasi Warna & Add-On
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs gap-1 cursor-pointer border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Produk
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-zinc-400 hover:text-rose-500 cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-0.5">Preset Model</label>
                      <select
                        value={productOptions.some((p) => p.id === item.productId) ? item.productId : "custom"}
                        onChange={(e) => handleSelectPreset(idx, e.target.value)}
                        className="w-full h-7 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 text-xs font-semibold cursor-pointer"
                      >
                        {productOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatRupiah(p.price)})
                          </option>
                        ))}
                        <option value="custom">Produk Custom / Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Model Produk</label>
                      <Input
                        type="text"
                        placeholder="Misal: Ollie"
                        value={item.productName}
                        onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                        className="h-7 text-xs font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-0.5">Jumlah (Qty)</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                        className="h-7 text-xs font-mono font-bold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-0.5">Harga Jual Satuan (Rp)</label>
                      <Input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                        className="h-7 text-xs font-mono font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] text-zinc-500">Variasi Warna & Bentuk</label>
                        {(() => {
                          const matched = productOptions.find((p) => p.id === item.productId);
                          const isNoCap = matched ? !matched.hasCap : item.productName.toLowerCase().includes("lumi");
                          return isNoCap ? (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              (Tanpa Cap)
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <Input
                        type="text"
                        placeholder="Misal: Base Pink + Shade Putih"
                        value={item.colorDetails}
                        onChange={(e) => handleItemChange(idx, "colorDetails", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-0.5">Nama Add-On / Kustomisasi</label>
                      <Input
                        type="text"
                        placeholder="Misal: Cap Custom Figur Lee Jeno"
                        value={item.addOnName}
                        onChange={(e) => handleItemChange(idx, "addOnName", e.target.value)}
                        className="h-7 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-0.5">Harga Add-On (Rp)</label>
                      <Input
                        type="number"
                        min="0"
                        value={item.addOnPrice}
                        onChange={(e) => handleItemChange(idx, "addOnPrice", Number(e.target.value))}
                        className="h-7 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Ongkir, Diskon & Potongan Shopee */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
            <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-orange-600" /> 4. Biaya Ongkir, Diskon & Potongan Fee Shopee
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Ongkos Kirim Ditagih (Rp)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Potongan Diskon (Rp)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-600 dark:text-zinc-400 font-medium">
                    Potongan Fee {getChannelLabel(channel)} (Rp)
                  </label>
                  {isMarketplaceChannel(channel) && (
                    <button
                      type="button"
                      onClick={() => setAutoMarketplaceFee(!autoMarketplaceFee)}
                      className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      {autoMarketplaceFee ? `Otomatis (${financials.feeLabel})` : "Manual"}
                    </button>
                  )}
                </div>
                <Input
                  type="number"
                  min="0"
                  disabled={isMarketplaceChannel(channel) && autoMarketplaceFee}
                  value={financials.computedFee}
                  onChange={(e) => {
                    setAutoMarketplaceFee(false);
                    setPlatformFee(Number(e.target.value));
                  }}
                  className={`h-8 text-xs font-mono ${
                    isMarketplaceChannel(channel) && autoMarketplaceFee ? "bg-zinc-100 dark:bg-zinc-800" : ""
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Status Pembayaran & Kas Masuk */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-blue-600" /> 5. Status Pembayaran & Kas Masuk
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetPaidInFull}
                  className="h-6 text-[10px] px-2 text-emerald-700 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Set Lunas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetUnpaid}
                  className="h-6 text-[10px] px-2 text-rose-700 border-rose-300 dark:border-rose-800 hover:bg-rose-50"
                >
                  Set Belum Bayar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Status Pembayaran
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 text-xs font-bold"
                >
                  <option value="PAID">Lunas (PAID)</option>
                  <option value="PARTIALLY_PAID">DP / Sebagian (PARTIALLY_PAID)</option>
                  <option value="UNPAID">Belum Bayar / Piutang (UNPAID)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                  Kas Masuk Diterima (Rp)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="h-8 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Catatan Pesanan */}
          <div>
            <label className="block text-zinc-600 dark:text-zinc-400 font-medium mb-1">
              Catatan Pesanan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan khusus pengiriman, custom packaging, dll..."
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 text-xs"
            />
          </div>

          {/* Live Realtime Financial Reconciliation Preview */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 text-white border border-zinc-800 space-y-2.5 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
              Preview Rekonsiliasi Finansial Otomatis
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400 block">Nilai Tagihan</span>
                <strong className="text-white font-mono">{formatRupiah(financials.totalInvoice)}</strong>
              </div>

              <div className="p-2 rounded-lg bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400 block">Potongan Fee</span>
                <strong className="text-orange-400 font-mono">
                  {financials.computedFee > 0 ? `-${formatRupiah(financials.computedFee)}` : "Rp 0"}
                </strong>
              </div>

              <div className="p-2 rounded-lg bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400 block">Omzet Riil (Kas)</span>
                <strong className="text-emerald-400 font-mono">
                  {formatRupiah(financials.netRealizedRevenue)}
                </strong>
              </div>

              <div className="p-2 rounded-lg bg-zinc-800/50">
                <span className="text-[10px] text-zinc-400 block">Laba Bersih Riil</span>
                <strong className="text-emerald-300 font-mono">{formatRupiah(financials.netProfit)}</strong>
              </div>
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isSubmitting}
              className="text-xs gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Transaksi
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                {isSubmitting ? "Menyimpan Data..." : "Simpan Perubahan Transaksi"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <DeleteOrderModal
        order={order}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={(deletedId) => {
          if (onDeleted) onDeleted(deletedId);
          onClose();
        }}
      />
    </div>
  );
}
