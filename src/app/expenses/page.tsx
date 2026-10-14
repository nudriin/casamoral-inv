import React from "react";
import { getExpenses, getExpenseCategories, getExpensesSummary } from "@/lib/services/expenses-service";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ExpensesClient } from "./expenses-client";
import {
  Receipt,
  DollarSign,
  TrendingDown,
  Layers,
  Wallet,
} from "lucide-react";

export const metadata = {
  title: "Pengeluaran Operasional | Casa Moral 3D Printing",
  description: "Pencatatan pengeluaran rutin studio, biaya tetap (overhead), biaya variabel, dan alokasi BEP.",
};

export default async function ExpensesPage() {
  const [expenses, categories, summary] = await Promise.all([
    getExpenses(),
    getExpenseCategories(),
    getExpensesSummary(),
  ]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Pengeluaran Operasional & Overhead
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pencatatan beban operasional bulanan studio (iklan, internet, listrik, maintenance) untuk penentuan titik impas (BEP).
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pengeluaran */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Total Pengeluaran</span>
              <span className="p-1.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-2">
              {formatRupiah(summary.totalExpenses)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center justify-between">
              <span>{summary.count} Transaksi tercatat</span>
              <span className="text-amber-600 font-medium">Beban Studio</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Biaya Tetap (Fixed Cost) */}
        <Card className="border-l-4 border-l-sky-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Biaya Tetap (Fixed Overhead)</span>
              <span className="p-1.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-2">
              {formatRupiah(summary.fixedCostsTotal)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Dasar kalkulasi BEP bulanan studio
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Biaya Variabel */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Biaya Variabel & Perlengkapan</span>
              <span className="p-1.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-2">
              {formatRupiah(summary.variableCostsTotal)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Perlengkapan packing & operasional
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Alokasi Biaya Bulanan */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Rasio Beban Tetap</span>
              <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
              {summary.totalExpenses > 0
                ? ((summary.fixedCostsTotal / summary.totalExpenses) * 100).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Proporsi biaya tetap terhadap total beban
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Expenses Table and Client Form */}
      <ExpensesClient
        initialExpenses={expenses}
        categories={categories}
      />
    </div>
  );
}
