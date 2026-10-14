"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Expense, ExpenseCategory, PaymentMethod } from "@/types/database";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createExpenseAction, createExpenseCategoryAction, deleteExpenseAction } from "./actions";
import {
  Search,
  Receipt,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
  Trash2,
  Tag,
} from "lucide-react";

interface ExpensesClientProps {
  initialExpenses: Expense[];
  categories: ExpenseCategory[];
}

export function ExpensesClient({ initialExpenses, categories: initialCategories }: ExpensesClientProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [categories, setCategories] = useState<ExpenseCategory[]>(initialCategories);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // New Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatIsFixed, setNewCatIsFixed] = useState(true);
  const [newCatDesc, setNewCatDesc] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedMethod, setSelectedMethod] = useState("ALL");

  // Form states
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState(initialCategories[0]?.id || "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("TRANSFER");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategory !== "ALL" && e.category_id !== selectedCategory) {
        return false;
      }
      if (selectedMethod !== "ALL" && e.payment_method !== selectedMethod) {
        return false;
      }
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const mDesc = e.description.toLowerCase().includes(q);
        const mNotes = e.notes?.toLowerCase().includes(q) || false;
        const mCat = e.category?.name.toLowerCase().includes(q) || false;
        return mDesc || mNotes || mCat;
      }
      return true;
    });
  }, [expenses, search, selectedCategory, selectedMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg("Nominal pengeluaran harus lebih besar dari Rp 0.");
      return;
    }
    if (!description.trim()) {
      setErrorMsg("Deskripsi pengeluaran wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const res = await createExpenseAction({
        expense_date: expenseDate,
        category_id: categoryId,
        description: description.trim(),
        amount: numAmount,
        payment_method: paymentMethod,
        notes: notes.trim() || undefined,
      });

      setLoading(false);

      if (res.success && res.expense) {
        setExpenses([res.expense, ...expenses]);
        setSuccessMsg(`Pengeluaran ${formatRupiah(numAmount)} berhasil dicatat.`);
        setDescription("");
        setNotes("");
        setShowAddForm(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Gagal mencatat pengeluaran.");
      }
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsSubmittingCat(true);
    setErrorMsg(null);

    const res = await createExpenseCategoryAction(newCatName.trim(), newCatIsFixed, newCatDesc.trim());
    setIsSubmittingCat(false);

    if (res.success && res.category) {
      setCategories((prev) => [...prev, res.category!]);
      setCategoryId(res.category.id);
      setSuccessMsg(`Kategori "${res.category.name}" berhasil dibuat.`);
      setShowAddCategoryModal(false);
      setNewCatName("");
      setNewCatDesc("");
    } else {
      setErrorMsg(res.error || "Gagal menambahkan kategori.");
    }
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (!confirm(`Hapus catatan pengeluaran "${desc}"?`)) return;
    const res = await deleteExpenseAction(id);
    if (res.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setSuccessMsg(`Pengeluaran "${desc}" berhasil dihapus.`);
    } else {
      setErrorMsg(res.error || "Gagal menghapus pengeluaran.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header & Toggle Form Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-zinc-500">
          Total {filteredExpenses.length} transaksi pengeluaran terdaftar.
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddCategoryModal(true)}
            className="gap-1.5 text-xs"
          >
            <Tag className="w-3.5 h-3.5" />
            Tambah Kategori
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-xs shadow-xs"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? "Tutup Formulir" : "Catat Pengeluaran Baru"}
          </Button>
        </div>
      </div>

      {/* Category Creation Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                Tambah Kategori Pengeluaran
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nama Kategori *
                </label>
                <Input
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Contoh: Perawatan Printer & Nozzle"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Klasifikasi Biaya
                </label>
                <select
                  value={newCatIsFixed ? "fixed" : "variable"}
                  onChange={(e) => setNewCatIsFixed(e.target.value === "fixed")}
                  className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <option value="fixed">Biaya Tetap (Fixed Cost - BEP)</option>
                  <option value="variable">Biaya Variabel (Variable Cost)</option>
                </select>
                <span className="text-[10px] text-zinc-500 block">
                  Biaya tetap masuk dalam target BEP bulanan (seperti listrik, sewa, internet).
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Deskripsi (Opsional)
                </label>
                <Input
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Keterangan singkat kategori"
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowAddCategoryModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingCat || !newCatName.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-xs"
                >
                  {isSubmittingCat ? "Menyimpan..." : "Simpan Kategori"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Expandable Add Expense Form */}
      {showAddForm && (
        <Card className="border-amber-500/40 bg-amber-50/10 dark:bg-amber-950/10 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" />
              Formulir Pengeluaran Operasional Studio
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Tanggal Pengeluaran *
                  </label>
                  <Input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Kategori Biaya *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.is_fixed_cost ? "(Biaya Tetap)" : "(Biaya Variabel)"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Nominal Biaya (Rp) *
                  </label>
                  <Input
                    type="number"
                    placeholder="Contoh: 150000"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    required
                    className="mt-1 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Deskripsi / Keperluan *
                  </label>
                  <Input
                    type="text"
                    placeholder="Contoh: Token listrik studio / Iklan Meta Ads Instagram..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="CASH">Tunai (Cash)</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Catatan Tambahan (Opsional)
                </label>
                <Input
                  type="text"
                  placeholder="Keterangan tambahan atau link nota/faktur..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-xs shadow-xs"
                >
                  {loading ? "Menyimpan..." : "Simpan Pengeluaran"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Toolbar Filters */}
      <div className="p-4 rounded-xl border border-zinc-200/80 bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Cari deskripsi, catatan, atau kategori pengeluaran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs focus:outline-none"
            >
              <option value="ALL">Semua Metode</option>
              <option value="TRANSFER">Transfer</option>
              <option value="CASH">Tunai</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <Receipt className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Tidak ada pengeluaran yang sesuai filter
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Ubah kata kunci pencarian atau kategori untuk melihat transaksi lain.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs font-semibold text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kategori Biaya</th>
                  <th className="py-3 px-4">Deskripsi & Keperluan</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4 text-center">Jenis Biaya</th>
                  <th className="py-3 px-4 text-right">Nominal Pengeluaran</th>
                  <th className="py-3 px-4 text-center w-12">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 align-top font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {formatDateIndo(exp.expense_date)}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {exp.category?.name || "Operasional"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">
                        {exp.description}
                      </div>
                      {exp.notes && (
                        <div className="text-[11px] text-zinc-400 italic mt-0.5">
                          {exp.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <Badge variant="outline" className="text-[11px]">
                        {exp.payment_method}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 align-top text-center">
                      {exp.category?.is_fixed_cost ? (
                        <Badge variant="secondary" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400">
                          Biaya Tetap (BEP)
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Biaya Variabel
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-top text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(exp.amount)}
                    </td>

                    <td className="py-3.5 px-4 align-top text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.description)}
                        className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                        title="Hapus Pengeluaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
