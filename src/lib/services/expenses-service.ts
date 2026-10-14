import { INITIAL_EXPENSES, INITIAL_EXPENSE_CATEGORIES } from "@/lib/data/initial-data";
import { Expense, ExpenseCategory, PaymentMethod } from "@/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEnvStatus } from "@/lib/env";
import Decimal from "decimal.js";

// In-memory store for fallback & testing
let memoryExpenses: Expense[] = JSON.parse(JSON.stringify(INITIAL_EXPENSES));
let memoryCategories: ExpenseCategory[] = JSON.parse(JSON.stringify(INITIAL_EXPENSE_CATEGORIES));

export interface CreateExpensePayload {
  expense_date: string;
  category_id: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod;
  is_capital_expenditure?: boolean;
  notes?: string;
}

export interface ExpenseFilters {
  category_id?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  payment_method?: PaymentMethod;
}

export interface ExpensesSummary {
  totalExpenses: number;
  fixedCostsTotal: number;
  variableCostsTotal: number;
  count: number;
  byCategory: Record<string, number>;
}

/**
 * Fetch all available expense categories
 */
export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.from("expense_categories").select("*").order("name");
      if (!error && data && data.length > 0) {
        return data as ExpenseCategory[];
      }
    } catch {
      // Fallback
    }
  }

  return memoryCategories;
}

/**
 * Fetch operational expenses with optional filtering
 */
export async function getExpenses(filters?: ExpenseFilters): Promise<Expense[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      let query = supabase
        .from("expenses")
        .select(`*, category:expense_categories(*)`)
        .order("expense_date", { ascending: false });

      if (filters?.category_id && filters.category_id !== "ALL") {
        query = query.eq("category_id", filters.category_id);
      }
      if (filters?.payment_method) {
        query = query.eq("payment_method", filters.payment_method);
      }
      if (filters?.startDate) {
        query = query.gte("expense_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("expense_date", filters.endDate);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as Expense[];
      }
    } catch {
      // Fallback
    }
  }

  let result = [...memoryExpenses];

  if (filters?.category_id && filters.category_id !== "ALL") {
    result = result.filter((e) => e.category_id === filters.category_id);
  }
  if (filters?.payment_method) {
    result = result.filter((e) => e.payment_method === filters.payment_method);
  }
  if (filters?.startDate) {
    result = result.filter((e) => e.expense_date >= filters.startDate!);
  }
  if (filters?.endDate) {
    result = result.filter((e) => e.expense_date <= filters.endDate!);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q) ||
        e.category?.name.toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());
}

/**
 * Record a new operational expense
 */
export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const amountDec = new Decimal(payload.amount);
  if (amountDec.lessThanOrEqualTo(0)) {
    throw new Error("Nominal pengeluaran harus lebih besar dari Rp 0.");
  }
  if (!payload.description || payload.description.trim() === "") {
    throw new Error("Deskripsi pengeluaran wajib diisi.");
  }

  const category = memoryCategories.find((c) => c.id === payload.category_id);
  const nowIso = new Date().toISOString();
  const expenseId = `exp-${Date.now()}`;

  const newExpense: Expense = {
    id: expenseId,
    expense_date: payload.expense_date || nowIso.slice(0, 10),
    category_id: payload.category_id,
    description: payload.description.trim(),
    amount: amountDec.toNumber(),
    payment_method: payload.payment_method,
    is_capital_expenditure: payload.is_capital_expenditure || false,
    notes: payload.notes || null,
    created_at: nowIso,
    category,
  };

  memoryExpenses.unshift(newExpense);

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("expenses").insert({
        id: newExpense.id,
        expense_date: newExpense.expense_date,
        category_id: newExpense.category_id,
        description: newExpense.description,
        amount: newExpense.amount,
        payment_method: newExpense.payment_method,
        is_capital_expenditure: newExpense.is_capital_expenditure,
        notes: newExpense.notes,
      });
    } catch {
      // Fallback
    }
  }

  return newExpense;
}

/**
 * Compute total and categorized operational expenses summary
 */
export async function getExpensesSummary(): Promise<ExpensesSummary> {
  const expenses = await getExpenses();

  let totalDec = new Decimal(0);
  let fixedDec = new Decimal(0);
  let variableDec = new Decimal(0);
  const byCategory: Record<string, number> = {};

  for (const exp of expenses) {
    const amt = new Decimal(exp.amount);
    totalDec = totalDec.plus(amt);

    const isFixed = exp.category?.is_fixed_cost ?? true;
    if (isFixed) {
      fixedDec = fixedDec.plus(amt);
    } else {
      variableDec = variableDec.plus(amt);
    }

    const catName = exp.category?.name || "Lain-lain";
    byCategory[catName] = (byCategory[catName] || 0) + exp.amount;
  }

  return {
    totalExpenses: totalDec.toNumber(),
    fixedCostsTotal: fixedDec.toNumber(),
    variableCostsTotal: variableDec.toNumber(),
    count: expenses.length,
    byCategory,
  };
}

/**
 * Reset memory expenses (used for test isolation)
 */
export function resetMemoryExpenses(): void {
  memoryExpenses = JSON.parse(JSON.stringify(INITIAL_EXPENSES));
  memoryCategories = JSON.parse(JSON.stringify(INITIAL_EXPENSE_CATEGORIES));
}
