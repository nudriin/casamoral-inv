"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Order, OrderStatus, PaymentStatus, Product } from "@/types/database";
import { ProductWithBOM } from "@/lib/data/initial-data";
import { formatRupiah, formatDateIndo, formatModelName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewModeToggle, ViewMode } from "@/components/ui/view-mode-toggle";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  ShoppingCart,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  PackageCheck,
  XCircle,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react";
import { EditOrderModal } from "@/components/orders/edit-order-modal";
import { DeleteOrderModal } from "@/components/orders/delete-order-modal";

interface OrderListClientProps {
  initialOrders: Order[];
  products?: ProductWithBOM[] | Product[];
}

export function OrderListClient({ initialOrders, products }: OrderListClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Channel
      if (channelFilter !== "ALL" && o.channel.toLowerCase() !== channelFilter.toLowerCase()) {
        return false;
      }
      // Status
      if (statusFilter !== "ALL" && o.status !== statusFilter) {
        return false;
      }
      // Payment
      if (paymentFilter !== "ALL" && o.payment_status !== paymentFilter) {
        return false;
      }
      // Search
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const matchesNumber = o.order_number.toLowerCase().includes(q);
        const matchesCustomer = o.customer?.name.toLowerCase().includes(q) || false;
        const matchesCity = o.customer?.city?.toLowerCase().includes(q) || false;
        const matchesNotes = o.notes?.toLowerCase().includes(q) || false;
        const matchesItems = o.items?.some(
          (i) =>
            i.color_details?.toLowerCase().includes(q) ||
            i.add_on_name?.toLowerCase().includes(q) ||
            i.product?.name.toLowerCase().includes(q)
        );
        return matchesNumber || matchesCustomer || matchesCity || matchesNotes || matchesItems;
      }
      return true;
    });
  }, [orders, search, channelFilter, statusFilter, paymentFilter]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" /> Menunggu
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Dikonfirmasi
          </Badge>
        );
      case "IN_PRODUCTION":
        return (
          <Badge variant="accent" className="gap-1">
            <Sparkles className="w-3 h-3" /> Diproduksi
          </Badge>
        );
      case "READY":
        return (
          <Badge variant="secondary" className="gap-1">
            <PackageCheck className="w-3 h-3" /> Siap Kirim
          </Badge>
        );
      case "SHIPPED":
        return (
          <Badge variant="secondary" className="gap-1">
            <Truck className="w-3 h-3" /> Dikirim
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" /> Dibatalkan
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus, paid: number) => {
    switch (status) {
      case "PAID":
        return (
          <Badge variant="secondary" className="gap-1 text-[11px]">
            Lunas
          </Badge>
        );
      case "PARTIALLY_PAID":
        return (
          <Badge variant="outline" className="gap-1 text-[11px]">
            DP: {formatRupiah(paid)}
          </Badge>
        );
      case "UNPAID":
      default:
        return (
          <Badge variant="warning" className="gap-1 text-[11px]">
            <AlertCircle className="w-3 h-3" /> Belum Lunas
          </Badge>
        );
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel.toLowerCase().replace(/\s+/g, "")) {
      case "shopee":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
            Shopee
          </span>
        );
      case "tiktokshop":
      case "tiktok":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-950">
            TikTok Shop
          </span>
        );
      case "tokopedia":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Tokopedia
          </span>
        );
      case "whatsapp":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            WhatsApp
          </span>
        );
      case "instagram":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Instagram
          </span>
        );
      case "direct":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Direct
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-xl border border-zinc-200/80 bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Cari nomor order, nama pelanggan, kota, variasi warna..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Channel filter */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full overflow-x-auto max-w-full">
              <span className="text-xs font-medium text-zinc-500 px-2 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" /> Kanal:
              </span>
              {[
                { key: "ALL", label: "Semua" },
                { key: "Direct", label: "Direct" },
                { key: "Shopee", label: "Shopee" },
                { key: "TikTokShop", label: "TikTok Shop" },
                { key: "Tokopedia", label: "Tokopedia" },
              ].map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => setChannelFilter(ch.key)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all shrink-0 ${
                    channelFilter.toLowerCase() === ch.key.toLowerCase()
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Payment filter */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full">
              <span className="text-xs font-medium text-zinc-500 px-2">Bayar:</span>
              {[
                { label: "Semua", val: "ALL" },
                { label: "Lunas", val: "PAID" },
                { label: "Belum Lunas", val: "UNPAID" },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setPaymentFilter(p.val)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    paymentFilter === p.val
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-500 shrink-0">Status:</span>
          {[
            { label: "Semua Status", val: "ALL" },
            { label: "Menunggu", val: "PENDING" },
            { label: "Dikonfirmasi", val: "CONFIRMED" },
            { label: "Diproduksi", val: "IN_PRODUCTION" },
            { label: "Siap Kirim", val: "READY" },
            { label: "Dikirim", val: "SHIPPED" },
            { label: "Selesai", val: "COMPLETED" },
            { label: "Batal", val: "CANCELLED" },
          ].map((st) => (
            <button
              key={st.val}
              onClick={() => setStatusFilter(st.val)}
              className={`px-3 py-1 rounded-full shrink-0 font-medium border transition-colors ${
                statusFilter === st.val
                  ? "bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30 font-semibold"
                  : "bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table & Cards */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <ShoppingCart className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Tidak ada pesanan yang sesuai filter
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau reset filter kanal dan status untuk melihat data lainnya.
          </p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const firstItem = order.items?.[0];
            const netValue =
              order.platform_fee && order.platform_fee > 0
                ? order.total_amount - order.platform_fee
                : order.total_amount;
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-zinc-800/70 dark:bg-zinc-900/70 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono text-sm font-semibold text-zinc-900 hover:text-orange-600 dark:text-zinc-100 dark:hover:text-orange-400 hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {formatDateIndo(order.order_date)}
                      </div>
                    </div>
                    {getChannelBadge(order.channel)}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {order.customer?.name || "Pelanggan Umum"}
                    </div>
                    <div className="text-xs text-zinc-500">{order.customer?.city || "-"}</div>
                  </div>

                  {firstItem && (
                    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-2.5 text-xs space-y-0.5">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatModelName(firstItem)}
                        {firstItem.quantity > 1 && ` (${firstItem.quantity} unit)`}
                      </div>
                      {firstItem.color_details && (
                        <div className="text-[11px] text-zinc-500 italic">{firstItem.color_details}</div>
                      )}
                      {order.items && order.items.length > 1 && (
                        <div className="text-[11px] text-zinc-400">+{order.items.length - 1} item lainnya</div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-50">
                        {formatRupiah(netValue)}
                      </div>
                      {order.platform_fee && order.platform_fee > 0 ? (
                        <div className="text-[10px] text-zinc-400">
                          Tagihan {formatRupiah(order.total_amount)} • Fee -{formatRupiah(order.platform_fee)}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getPaymentBadge(order.payment_status, order.paid_amount)}
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(order)}
                    className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500/10 hover:text-orange-600 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-2.5 h-2.5" /> Edit
                  </button>
                  <div className="flex items-center gap-1">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 gap-0.5 text-[11px]">
                        Detail <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeletingOrder(order)}
                      title="Hapus Transaksi"
                      className="inline-flex items-center justify-center h-7 w-7 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-500/10 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800/70 dark:bg-zinc-900/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs font-semibold text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">No. Order & Tanggal</th>
                  <th className="py-3 px-4">Pelanggan & Lokasi</th>
                  <th className="py-3 px-4">Kanal</th>
                  <th className="py-3 px-4">Rincian Produk & Kustomisasi</th>
                  <th className="py-3 px-4 text-right">Omzet / Nilai</th>
                  <th className="py-3 px-4 text-center">Status Pembayaran</th>
                  <th className="py-3 px-4 text-center">Status Produksi</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                {filteredOrders.map((order) => {
                  const firstItem = order.items?.[0];
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono font-semibold text-zinc-900 hover:text-orange-600 dark:text-zinc-100 dark:hover:text-orange-400 hover:underline"
                          >
                            {order.order_number}
                          </Link>
                          {order.order_number.startsWith("POS-") && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400">
                              Kasir POS
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {formatDateIndo(order.order_date)}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {order.customer?.name || "Pelanggan Umum"}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {order.customer?.city || "-"}
                        </div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        {getChannelBadge(order.channel)}
                      </td>

                      <td className="py-3 px-4 align-top">
                        {firstItem ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatModelName(firstItem)}
                              {firstItem.quantity > 1 && (
                                <span className="ml-1 text-xs text-zinc-500 font-normal">
                                  ({firstItem.quantity} unit)
                                </span>
                              )}
                            </div>
                            {firstItem.color_details && (
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                                {firstItem.color_details}
                              </div>
                            )}
                            {firstItem.add_on_name && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                <Sparkles className="w-2.5 h-2.5 text-orange-500" />
                                {firstItem.add_on_name} (+{formatRupiah(firstItem.add_on_price || 0)})
                              </div>
                            )}
                            {order.items && order.items.length > 1 && (
                              <div className="text-xs text-zinc-400">
                                +{order.items.length - 1} item lainnya
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {order.platform_fee && order.platform_fee > 0 ? (
                          <div>
                            <span className="text-zinc-900 dark:text-zinc-50 font-bold block">
                              {formatRupiah(order.total_amount - order.platform_fee)}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-normal block">
                              Tagihan: {formatRupiah(order.total_amount)}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-normal block">
                              Fee: -{formatRupiah(order.platform_fee)}
                            </span>
                          </div>
                        ) : (
                          <>
                            {formatRupiah(order.total_amount)}
                            {order.total_amount === 0 && (
                              <div className="text-[11px] text-zinc-400 font-normal">
                                Sampel / Promosi
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top text-center">
                        {getPaymentBadge(order.payment_status, order.paid_amount)}
                        {order.payment_status === "UNPAID" && order.total_amount > 0 && (
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                            Piutang {formatRupiah(order.total_amount - order.paid_amount)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top text-center">
                        {getStatusBadge(order.status)}
                      </td>

                      <td className="py-3 px-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingOrder(order)}
                            className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:bg-orange-500/15 dark:hover:text-orange-400 cursor-pointer transition-colors"
                          >
                            <Pencil className="w-2.5 h-2.5" /> Edit
                          </button>
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2.5 gap-0.5 text-[11px]">
                              Detail <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeletingOrder(order)}
                            title="Hapus Transaksi"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-500/10 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          isOpen={true}
          availableProducts={products}
          onClose={() => setEditingOrder(null)}
          onSaved={(updatedOrder) => {
            setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
            setEditingOrder(null);
          }}
          onDeleted={(deletedId) => {
            setOrders((prev) => prev.filter((o) => o.id !== deletedId));
            setEditingOrder(null);
          }}
        />
      )}

      <DeleteOrderModal
        order={deletingOrder}
        isOpen={deletingOrder !== null}
        onClose={() => setDeletingOrder(null)}
        onDeleted={(deletedId) => {
          setOrders((prev) => prev.filter((o) => o.id !== deletedId));
          setDeletingOrder(null);
        }}
      />
    </div>
  );
}
