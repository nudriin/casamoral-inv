"use client";

import React, { useState } from "react";
import { Payable, PayableInstallment, PaymentMethod } from "@/types/database";
import { PayablesSummary } from "@/lib/services/payables-service";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { recordInstallmentPaymentAction, createPayableAction } from "./actions";
import {
  HandCoins,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Plus,
  X,
  Printer,
  Building,
} from "lucide-react";

interface PayablesClientProps {
  initialPayables: Payable[];
  summary: PayablesSummary;
}

export function PayablesClient({ initialPayables, summary }: PayablesClientProps) {
  const [payables, setPayables] = useState<Payable[]>(initialPayables);
  const [activeTab, setActiveTab] = useState<"ALL" | "UNPAID" | "PAID">("ALL");

  // Payment Recording Modal
  const [selectedInstallment, setSelectedInstallment] = useState<{
    payableTitle: string;
    installment: PayableInstallment;
  } | null>(null);

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TRANSFER");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Add Payable Modal
  const [showAddPayableModal, setShowAddPayableModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCreditor, setNewCreditor] = useState("");
  const [newTotalAmount, setNewTotalAmount] = useState<number | "">("");
  const [newTermMonths, setNewTermMonths] = useState(3);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newNotes, setNewNotes] = useState("");

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openPaymentModal = (payableTitle: string, inst: PayableInstallment) => {
    setSelectedInstallment({ payableTitle, installment: inst });
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentAmount(inst.amount - inst.paid_amount);
    setPaymentMethod("TRANSFER");
    setReferenceNumber("");
    setPaymentNotes("");
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;

    const numAmount = Number(paymentAmount);
    if (!numAmount || numAmount <= 0) {
      setFeedback({ type: "error", message: "Nominal pembayaran angsuran harus lebih dari Rp 0." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const res = await recordInstallmentPaymentAction({
      installment_id: selectedInstallment.installment.id,
      payment_date: paymentDate,
      amount: numAmount,
      payment_method: paymentMethod,
      reference_number: referenceNumber.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
    });

    if (res.success && "payable" in res) {
      setPayables((prev) =>
        prev.map((p) => (p.id === res.payable.id ? res.payable : p))
      );
      setFeedback({
        type: "success",
        message: `Pembayaran angsuran ke-${selectedInstallment.installment.installment_number} senilai ${formatRupiah(
          numAmount
        )} berhasil dicatat!`,
      });
      setSelectedInstallment(null);
    } else {
      setFeedback({ type: "error", message: (!res.success && res.error) ? res.error : "Gagal mencatat pembayaran angsuran." });
    }
    setSubmitting(false);
  };

  const handleCreatePayable = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTotal = Number(newTotalAmount);
    if (!newTitle.trim() || !newCreditor.trim() || !numTotal || numTotal <= 0) {
      setFeedback({ type: "error", message: "Lengkapi seluruh field wajib kewajiban utang." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const res = await createPayableAction({
      title: newTitle.trim(),
      creditor_name: newCreditor.trim(),
      total_amount: numTotal,
      term_months: newTermMonths,
      start_date: newStartDate,
      notes: newNotes.trim() || undefined,
    });

    if (res.success && res.payable) {
      setPayables((prev) => [res.payable, ...prev]);
      setFeedback({
        type: "success",
        message: `Kewajiban utang "${res.payable.title}" berhasil ditambahkan!`,
      });
      setShowAddPayableModal(false);
      setNewTitle("");
      setNewCreditor("");
      setNewTotalAmount("");
      setNewNotes("");
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal menambah kewajiban utang." });
    }
    setSubmitting(false);
  };

  const filteredPayables = payables.filter((p) => {
    if (activeTab === "UNPAID") return p.status !== "PAID";
    if (activeTab === "PAID") return p.status === "PAID";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Accounting Compliance Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 dark:border-amber-500/20">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400 shrink-0">
            <HandCoins className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                Pemisahan Akuntansi Utang & Cicilan Pembelian Aset
              </span>
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                Section 8 Master Prompt
              </Badge>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Cicilan pembelian aset (Shopee PayLater Anycubic Kobra X) dicatat sebagai <strong>Arus Kas Keluar Aktivitas Pendanaan (Financing Outflow)</strong> untuk melunasi kewajiban aset tetap, dan <strong>TIDAK dikurangkan sebagai beban operasional studio</strong> agar tidak mendistorsi laba bersih usaha.
            </p>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Total Kewajiban Terjadwal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
              {formatRupiah(summary.totalObligations)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Total seluruh pokok angsuran & utang</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500">Sisa Kewajiban Berjalan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatRupiah(summary.totalRemaining)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Belum dibayar ({summary.countActive} kewajiban)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500">Realisasi Pelunasan Kas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(summary.totalPaid)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Total kas keluar angsuran dibayar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500">Jatuh Tempo Bulan Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {formatRupiah(summary.dueThisMonthAmount)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Tagihan aktif periode berjalan</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2">
          {[
            { value: "ALL", label: "Semua Utang" },
            { value: "UNPAID", label: "Belum Lunas" },
            { value: "PAID", label: "Sudah Lunas" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value as "ALL" | "UNPAID" | "PAID")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.value
                  ? "bg-amber-500 text-zinc-950 shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="accent"
          onClick={() => setShowAddPayableModal(true)}
          className="gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Tambah Kewajiban Baru
        </Button>
      </div>

      {/* Payables List & Installment Schedules */}
      <div className="space-y-6">
        {filteredPayables.map((payable) => {
          const paidAmount = payable.total_amount - payable.remaining_amount;
          const progressPercent = (paidAmount / payable.total_amount) * 100;

          return (
            <Card key={payable.id} className="overflow-hidden border-zinc-200/90 dark:border-zinc-800/90 shadow-xs">
              <CardHeader className="bg-zinc-50/60 dark:bg-zinc-900/40 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      {payable.payable_type === "ASSET_INSTALLMENT" ? (
                        <Printer className="h-5 w-5" />
                      ) : (
                        <Building className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                          {payable.title}
                        </CardTitle>
                        <Badge
                          variant={
                            payable.status === "PAID"
                              ? "success"
                              : payable.status === "PARTIALLY_PAID"
                              ? "warning"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {payable.status === "PAID"
                            ? "LUNAS"
                            : payable.status === "PARTIALLY_PAID"
                            ? "DIBAYAR SEBAGIAN"
                            : "BELUM DIBAYAR"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-zinc-500 mt-0.5">
                        Kreditur: {payable.creditor_name} • Tenor: {payable.term_months} Bulan (@ {formatRupiah(payable.monthly_installment)})
                      </CardDescription>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-zinc-400 block">Sisa Kewajiban</span>
                    <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(payable.remaining_amount)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      Total: {formatRupiah(payable.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="pt-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
                    <span>Realisasi Pelunasan: {formatRupiah(paidAmount)}</span>
                    <span className="font-semibold">{progressPercent.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold w-16 text-center">Bulan</th>
                        <th className="py-2.5 px-4 font-semibold">Jatuh Tempo</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Nominal Tagihan</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Sudah Dibayar</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                        <th className="py-2.5 px-4 font-semibold">Tgl Bayar & Ref</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                      {(payable.installments || []).map((inst) => {
                        const isPaid = inst.status === "PAID";
                        const isOverdue = inst.status === "OVERDUE";

                        return (
                          <tr
                            key={inst.id}
                            className={`transition-colors ${
                              isPaid
                                ? "bg-emerald-500/5"
                                : isOverdue
                                ? "bg-rose-500/5"
                                : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-center text-zinc-700 dark:text-zinc-300">
                              Ke-{inst.installment_number}
                            </td>
                            <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                                <span>{formatDateIndo(inst.due_date)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatRupiah(inst.amount)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                              {formatRupiah(inst.paid_amount)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isPaid ? (
                                <Badge variant="success" className="text-[10px]">
                                  LUNAS
                                </Badge>
                              ) : isOverdue ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  TERLAMBAT
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-300">
                                  BELUM JATUH TEMPO
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                              {inst.payment_date ? (
                                <div className="text-[11px]">
                                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                    {formatDateIndo(inst.payment_date)} ({inst.payment_method})
                                  </span>
                                  {inst.reference_number && (
                                    <span className="block font-mono text-[10px] text-zinc-500">
                                      Ref: {inst.reference_number}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-zinc-400 text-[11px]">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {!isPaid ? (
                                <Button
                                  size="sm"
                                  variant="accent"
                                  onClick={() => openPaymentModal(payable.title, inst)}
                                  className="text-xs h-7 gap-1 font-semibold cursor-pointer"
                                >
                                  <CreditCard className="h-3 w-3" /> Catat Bayar
                                </Button>
                              ) : (
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Dialog: Catat Pembayaran Angsuran */}
      {selectedInstallment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    Catat Pembayaran Angsuran Ke-{selectedInstallment.installment.installment_number}
                  </h3>
                  <p className="text-[11px] text-zinc-500">{selectedInstallment.payableTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInstallment(null)}
                className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Tanggal Pembayaran
                </label>
                <Input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nominal Pembayaran (Rp)
                </label>
                <Input
                  type="number"
                  step="1000"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="text-xs h-9 font-bold text-amber-600 dark:text-amber-400"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Tagihan angsuran: {formatRupiah(selectedInstallment.installment.amount)}
                </span>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full h-9 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs cursor-pointer"
                >
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="CASH">Tunai (Kas Kasir)</option>
                  <option value="QRIS">QRIS Studio</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nomor Referensi Transaksi / Bukti Transfer
                </label>
                <Input
                  placeholder="Contoh: REF-BCA-987291"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Catatan Pembayaran
                </label>
                <Input
                  placeholder="Keterangan tambahan..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedInstallment(null)}
                  className="text-xs h-8 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={submitting}
                  className="text-xs h-8 font-semibold cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Konfirmasi Pembayaran"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Tambah Kewajiban Baru */}
      {showAddPayableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-amber-500" /> Tambah Kewajiban Utang Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPayableModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayable} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Nama Kewajiban <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Contoh: Cicilan Mesin Printer Anycubic"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Pihak Kreditur / Pemasok <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Contoh: Shopee PayLater / PT Commerce Finance"
                  value={newCreditor}
                  onChange={(e) => setNewCreditor(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Total Kewajiban (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 5872800"
                    value={newTotalAmount}
                    onChange={(e) =>
                      setNewTotalAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="text-xs h-9 font-semibold text-amber-600 dark:text-amber-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Tenor (Bulan)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={newTermMonths}
                    onChange={(e) => setNewTermMonths(Math.max(1, Number(e.target.value) || 1))}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Tanggal Mulai Angsuran Pertama
                </label>
                <Input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan nomor kontrak atau aset yang terkait..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddPayableModal(false)}
                  className="text-xs h-8 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={submitting}
                  className="text-xs h-8 font-semibold cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Kewajiban"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
