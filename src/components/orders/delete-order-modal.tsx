"use client";

import React, { useState } from "react";
import { Order } from "@/types/database";
import { deleteOrderAction } from "@/app/orders/actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Trash2,
  X,
  CreditCard,
  User,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";

interface DeleteOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (deletedOrderId: string) => void;
}

export function DeleteOrderModal({
  order,
  isOpen,
  onClose,
  onDeleted,
}: DeleteOrderModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await deleteOrderAction(order.id);
      if (res.success) {
        onDeleted(order.id);
        onClose();
      } else {
        setErrorMsg(res.error || "Gagal menghapus transaksi.");
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus transaksi."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-start justify-between bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Hapus Transaksi?
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {errorMsg}
            </div>
          )}

          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Anda akan menghapus transaksi <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{order.order_number}</strong> secara permanen.
          </p>

          {/* Order Details Preview Box */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
              <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100">
                {order.order_number}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {order.channel}
              </Badge>
            </div>

            <div className="space-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <User className="w-3.5 h-3.5" /> Pelanggan:
                </span>
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {order.customer?.name || "Pelanggan Umum"}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal:
                </span>
                <span>{formatDateIndo(order.order_date)}</span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
                  <CreditCard className="w-3.5 h-3.5" /> Total Tagihan:
                </span>
                <strong className="font-mono text-zinc-900 dark:text-zinc-100 text-xs">
                  {formatRupiah(order.total_amount)}
                </strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Kas Terbayar:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  {formatRupiah(order.paid_amount || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Automatic Financial Recalculation Notice */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              Penyesuaian Finansial Otomatis:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-300/90 pl-1 text-[10px]">
              <li>Total omzet/pendapatan studio berkurang {formatRupiah(order.total_amount)}.</li>
              <li>Realisasi kas masuk berkurang {formatRupiah(order.paid_amount || 0)}.</li>
              <li>Piutang usaha, laba kotor, dan rekap keuangan disesuaikan seketika.</li>
            </ul>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 cursor-pointer shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? "Menghapus..." : "Ya, Hapus Transaksi Ini"}
          </Button>
        </div>
      </div>
    </div>
  );
}
