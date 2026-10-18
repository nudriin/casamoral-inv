"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Order, Payment, PaymentMethod } from "@/types/database";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createPaymentAction } from "../../actions";
import {
  ArrowLeft,
  Coins,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface PaymentFormClientProps {
  order: Order;
  initialPayments: Payment[];
}

export function PaymentFormClient({ order, initialPayments }: PaymentFormClientProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>(initialPayments);

  const remaining = Math.max(0, order.total_amount - order.paid_amount);

  // Form states
  const [amount, setAmount] = useState<number | "">(remaining > 0 ? remaining : "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TRANSFER");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleQuickAmount = (val: number) => {
    setAmount(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg("Nominal pembayaran harus lebih besar dari Rp 0.");
      return;
    }

    setLoading(true);

    try {
      const res = await createPaymentAction({
        order_id: order.id,
        amount: numAmount,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setLoading(false);

      if (res.success && res.payment) {
        setPayments([res.payment, ...payments]);
        setSuccessMsg(
          `Pembayaran sebesar ${formatRupiah(numAmount)} berhasil dicatat. Status pesanan diperbarui.`
        );
        setAmount("");
        setReferenceNumber("");
        setNotes("");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Gagal mencatat pembayaran.");
      }
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/orders/${order.id}`}>
            <Button variant="outline" size="sm" className="gap-1 h-9">
              <ArrowLeft className="w-4 h-4" /> Detail Pesanan
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-500" /> Catat Pembayaran Kas
            </h1>
            <p className="text-xs text-zinc-500">
              Kelola pembayaran bertahap (DP) atau pelunasan penuh untuk pesanan{" "}
              <strong className="font-mono text-zinc-800 dark:text-zinc-200">{order.order_number}</strong>.
            </p>
          </div>
        </div>

        <div>
          {order.payment_status === "PAID" ? (
            <Badge variant="success" className="px-3 py-1">
              ✓ Telah Lunas Penuh
            </Badge>
          ) : (
            <Badge variant="warning" className="px-3 py-1">
              Sisa Tagihan: {formatRupiah(remaining)}
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

      {/* Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-500 font-medium">Total Nilai Pesanan</div>
            <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
              {formatRupiah(order.total_amount)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Pelanggan: {order.customer?.name}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-500 font-medium">Kas Masuk (Telah Dibayar)</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {formatRupiah(order.paid_amount)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Status: {order.payment_status}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4">
            <div className="text-xs text-zinc-500 font-medium">Sisa Piutang Berjalan</div>
            <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
              {formatRupiah(remaining)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              {remaining === 0 ? "Tidak ada sisa tagihan" : "Menunggu pelunasan"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Entry Form */}
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Formulir Pembayaran Kas Masuk
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>Nominal Pembayaran (Rp) *</span>
                  {remaining > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(remaining)}
                      className="text-[11px] text-emerald-600 hover:underline font-semibold"
                    >
                      Lunasi Penuh ({formatRupiah(remaining)})
                    </button>
                  )}
                </label>
                <Input
                  type="number"
                  placeholder="Contoh: 50000 / 130000"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  required
                  className="mt-1 font-mono text-base font-semibold"
                />

                {/* Quick chip buttons */}
                {remaining > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(remaining)}
                      className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium"
                    >
                      Sisa Tagihan: {formatRupiah(remaining)}
                    </button>
                    {remaining > 50000 && (
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(50000)}
                        className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      >
                        Rp 50.000 (DP)
                      </button>
                    )}
                    {remaining > 100000 && (
                      <button
                        type="button"
                        onClick={() => handleQuickAmount(100000)}
                        className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                      >
                        Rp 100.000
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="TRANSFER">Transfer Bank (BCA / BRI / Mandiri)</option>
                  <option value="CASH">Tunai / Cash</option>
                  <option value="QRIS">QRIS Standar</option>
                  <option value="SHOPEE_PAYOUT">Shopee Payout / Saldo Mitra</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nomor Referensi / No. Transaksi Bank (Opsional)
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: TF-BCA-98124 / Struk Tunai"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Catatan Pembayaran
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Uang muka 50% / Pelunasan saat terima barang..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 mt-2 shadow-xs"
              >
                {loading ? "Menyimpan Pembayaran..." : "Konfirmasi Pembayaran Kas"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payment History Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" /> Riwayat Pembayaran Tercatat
              </span>
              <span className="text-xs font-normal text-zinc-500">
                {payments.length} transaksi
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {payments.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-xs">
                Belum ada pembayaran yang dicatat untuk pesanan ini.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {payments.map((p) => (
                  <div key={p.id} className="py-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                          {p.payment_method}
                        </span>
                        {p.reference_number && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            #{p.reference_number}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {formatDateIndo(p.payment_date)}
                      </div>
                      {p.notes && (
                        <div className="text-[11px] text-zinc-400 italic mt-0.5">
                          {p.notes}
                        </div>
                      )}
                    </div>
                    <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      +{formatRupiah(p.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
