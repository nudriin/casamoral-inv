"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Order, OrderStatus, PaymentStatus } from "@/types/database";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateOrderStatusAction, updateOrderPaymentAction } from "../actions";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  PackageCheck,
  Truck,
  XCircle,
  Coins,
  CreditCard,
  User,
  MapPin,
  FileText,
  AlertCircle,
} from "lucide-react";

interface OrderDetailClientProps {
  initialOrder: Order;
}

const PRODUCTION_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: "PENDING", label: "Menunggu", icon: Clock },
  { status: "CONFIRMED", label: "Dikonfirmasi", icon: CheckCircle2 },
  { status: "IN_PRODUCTION", label: "Diproduksi", icon: Sparkles },
  { status: "READY", label: "Siap Kirim", icon: PackageCheck },
  { status: "SHIPPED", label: "Dikirim", icon: Truck },
  { status: "COMPLETED", label: "Selesai", icon: CheckCircle2 },
];

export function OrderDetailClient({ initialOrder }: OrderDetailClientProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Financial calculations
  const totalHppSnapshot = order.items?.reduce(
    (sum, item) => sum + (item.unit_hpp || 0) * (item.quantity || 1),
    0
  ) || 0;

  const grossProfit = order.total_amount - (order.platform_fee || 0) - totalHppSnapshot;
  const grossMargin = order.total_amount > 0 ? (grossProfit / order.total_amount) * 100 : 0;
  const remainingReceivable = Math.max(0, order.total_amount - order.paid_amount);

  const currentStepIndex = PRODUCTION_STEPS.findIndex((s) => s.status === order.status);

  const handleStatusChange = async (nextStatus: OrderStatus) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateOrderStatusAction(order.id, nextStatus);
    setLoading(false);

    if (res.success && res.order) {
      setOrder(res.order);
      setSuccessMsg(`Status produksi berhasil diperbarui menjadi ${nextStatus}.`);
    } else {
      setErrorMsg(res.error || "Gagal memperbarui status.");
    }
  };

  const handlePaymentUpdate = async (newPaymentStatus: PaymentStatus, amount?: number) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await updateOrderPaymentAction(order.id, newPaymentStatus, amount);
    setLoading(false);

    if (res.success && res.order) {
      setOrder(res.order);
      setSuccessMsg(`Status pembayaran berhasil diperbarui menjadi ${newPaymentStatus}.`);
    } else {
      setErrorMsg(res.error || "Gagal memperbarui pembayaran.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/orders">
            <Button variant="outline" size="sm" className="gap-1 h-9">
              <ArrowLeft className="w-4 h-4" /> Daftar Pesanan
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
                {order.order_number}
              </h1>
              <Badge variant="outline" className="text-xs">
                {order.channel}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500">
              Dibuat pada {formatDateIndo(order.order_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {order.payment_status === "PAID" ? (
            <Badge variant="success" className="px-3 py-1 text-xs">
              Lunas ({formatRupiah(order.paid_amount)})
            </Badge>
          ) : (
            <Badge variant="warning" className="px-3 py-1 text-xs">
              Belum Lunas (Sisa: {formatRupiah(remainingReceivable)})
            </Badge>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Production Stepper Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Alur Status Produksi Studio
            </span>
            <span className="text-xs font-normal text-zinc-500">
              Status saat ini: <strong className="text-zinc-900 dark:text-zinc-100">{order.status}</strong>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          {order.status === "CANCELLED" ? (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-center text-red-700 dark:text-red-400">
              <XCircle className="w-8 h-8 mx-auto mb-1" />
              <div className="font-semibold text-sm">Pesanan Ini Telah Dibatalkan</div>
              <div className="text-xs text-red-500 mt-0.5">
                Tidak ada mutasi stok atau pengakuan pendapatan pada pesanan batal.
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Stepper bar */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {PRODUCTION_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isCurrent = order.status === step.status;
                  const isPassed = currentStepIndex > idx;

                  return (
                    <div
                      key={step.status}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrent
                          ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold ring-1 ring-amber-500"
                          : isPassed
                          ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50"
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1.5" />
                      <div className="text-xs">{step.label}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                        {step.status}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                <div className="text-xs text-zinc-500">
                  Transisi status otomatis terkunci dengan validasi state machine.
                </div>

                <div className="flex items-center gap-2">
                  {order.status === "PENDING" && (
                    <Button
                      onClick={() => handleStatusChange("CONFIRMED")}
                      disabled={loading}
                      size="sm"
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi Pesanan
                    </Button>
                  )}

                  {order.status === "CONFIRMED" && (
                    <Button
                      onClick={() => handleStatusChange("IN_PRODUCTION")}
                      disabled={loading}
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-xs gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Mulai Produksi (Cetak 3D)
                    </Button>
                  )}

                  {order.status === "IN_PRODUCTION" && (
                    <Button
                      onClick={() => handleStatusChange("READY")}
                      disabled={loading}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1"
                    >
                      <PackageCheck className="w-3.5 h-3.5" /> Tandai Siap Kirim (QC Selesai)
                    </Button>
                  )}

                  {order.status === "READY" && (
                    <Button
                      onClick={() => handleStatusChange("SHIPPED")}
                      disabled={loading}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" /> Kirim ke Pelanggan / Kurir
                    </Button>
                  )}

                  {order.status === "SHIPPED" && (
                    <Button
                      onClick={() => handleStatusChange("COMPLETED")}
                      disabled={loading}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selesaikan Pesanan (Diterima)
                    </Button>
                  )}

                  {order.status !== "COMPLETED" && (
                    <Button
                      onClick={() => handleStatusChange("CANCELLED")}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Batalkan
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Items & Customer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Rincian Produk & Snapshot HPP Terkunci</span>
                <span className="text-xs text-zinc-400 font-normal">
                  Snapshot tersimpan permanen
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Produk</th>
                      <th className="py-2.5 px-4 font-semibold">Kustomisasi Warna & Add-On</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Harga Satuan</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Snapshot HPP</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                    {order.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                          <div>{item.product?.name || "Lampu Ambient"}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {item.product?.sku}
                          </div>
                        </td>

                        <td className="py-3 px-4 space-y-1">
                          {item.color_details && (
                            <div className="text-zinc-600 dark:text-zinc-300 italic">
                              {item.color_details}
                            </div>
                          )}
                          {item.add_on_name && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                              {item.add_on_name} (+{formatRupiah(item.add_on_price || 0)})
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-zinc-700 dark:text-zinc-300">
                          {formatRupiah(item.unit_price)}
                          {item.quantity > 1 && (
                            <span className="text-[10px] text-zinc-400 block">
                              x {item.quantity}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400">
                          {formatRupiah(item.unit_hpp)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Subtotals in Table Footer */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal Produk:</span>
                  <span className="font-mono">{formatRupiah(order.subtotal_amount)}</span>
                </div>
                {order.add_on_amount > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                    <span>Biaya Tambahan Add-On:</span>
                    <span className="font-mono">+{formatRupiah(order.add_on_amount)}</span>
                  </div>
                )}
                {order.shipping_cost > 0 && (
                  <div className="flex justify-between">
                    <span>Ongkos Kirim Ditagih:</span>
                    <span className="font-mono">+{formatRupiah(order.shipping_cost)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Potongan Diskon:</span>
                    <span className="font-mono">-{formatRupiah(order.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 flex justify-between font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  <span>Total Tagihan Pesanan:</span>
                  <span className="font-mono text-base text-amber-600 dark:text-amber-400">
                    {formatRupiah(order.total_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Shipping Information Card */}
          <Card>
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-amber-500" />
                Informasi Pelanggan & Catatan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-zinc-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Nama Pelanggan
                  </div>
                  <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {order.customer?.name || "Pelanggan Umum"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-zinc-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Lokasi / Kota
                  </div>
                  <div className="font-medium text-zinc-800 dark:text-zinc-200">
                    {order.customer?.city || "Sukamara, Kalimantan Tengah"}
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" /> Catatan Pesanan:
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400 italic">
                    {order.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Financial Card & Payment Management */}
        <div className="space-y-6">
          {/* Financial Analysis */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                Rekonsiliasi Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Total Omzet:</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatRupiah(order.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Snapshot HPP Total:</span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {formatRupiah(totalHppSnapshot)}
                  </span>
                </div>
                {order.platform_fee > 0 && (
                  <div className="flex justify-between text-orange-600 dark:text-orange-400">
                    <span>Biaya Platform (Shopee):</span>
                    <span className="font-mono">-{formatRupiah(order.platform_fee)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2 flex justify-between font-bold text-sm">
                  <span>Laba Kotor (Gross Profit):</span>
                  <span
                    className={`font-mono ${
                      grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatRupiah(grossProfit)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-500 pt-1">
                  <span>Margin Kotor:</span>
                  <span className="font-semibold text-emerald-600 font-mono">
                    {grossMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status & Action Card */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Manajemen Kas & Piutang
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status Pembayaran:</span>
                  <span className="font-semibold">
                    {order.payment_status === "PAID"
                      ? "Lunas"
                      : order.payment_status === "PARTIALLY_PAID"
                      ? "DP (Sebagian)"
                      : "Belum Lunas"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kas Masuk Diterima:</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {formatRupiah(order.paid_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sisa Piutang Berjalan:</span>
                  <span className="font-mono font-semibold text-rose-600">
                    {formatRupiah(remainingReceivable)}
                  </span>
                </div>
              </div>

              {/* Payment Action Buttons */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <Link href={`/orders/${order.id}/payments`} className="block">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Catat Kas / DP / Riwayat Bayar
                  </Button>
                </Link>

                {order.payment_status !== "PAID" && (
                  <Button
                    onClick={() => handlePaymentUpdate("PAID", order.total_amount)}
                    disabled={loading}
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Konfirmasi Pelunasan Cepat
                  </Button>
                )}

                {order.payment_status === "PAID" && (
                  <div className="pt-1 text-center text-emerald-600 font-medium">
                    ✓ Pembayaran telah lunas secara penuh.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
