import { INITIAL_EXPENSES, STORE_EXPENSES, ALL_EXPENSES, INITIAL_EXPENSE_CATEGORIES } from "@/lib/data/initial-data";
import { Expense, ExpenseCategory, PaymentMethod } from "@/types/database";
import { getServiceSupabaseClient, isValidUuid } from "@/lib/supabase/db";
import { getEnvStatus } from "@/lib/env";
import Decimal from "decimal.js";

// In-memory store for fallback & testing
let memoryExpenses: Expense[] = JSON.parse(JSON.stringify(ALL_EXPENSES));
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
      const supabase = await getServiceSupabaseClient();
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
      const supabase = await getServiceSupabaseClient();
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
      if (!error && data && data.length > 0) {
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

  const nowIso = new Date().toISOString();
  const expenseId = crypto.randomUUID();
  const expenseDate = payload.expense_date || nowIso.slice(0, 10);

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        id: expenseId,
        expense_date: expenseDate,
        category_id: payload.category_id,
        description: payload.description.trim(),
        amount: amountDec.toNumber(),
        payment_method: payload.payment_method,
        is_capital_expenditure: payload.is_capital_expenditure || false,
        notes: payload.notes || null,
      })
      .select(`*, category:expense_categories(*)`)
      .single();

    if (error) {
      throw new Error(`Gagal menyimpan pengeluaran ke database: ${error.message}`);
    }
    return data as Expense;
  }

  const category = memoryCategories.find((c) => c.id === payload.category_id);

  const newExpense: Expense = {
    id: expenseId,
    expense_date: expenseDate,
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
 * Create a new expense category
 */
export async function createExpenseCategory(category: { name: string; is_fixed_cost?: boolean; description?: string }): Promise<ExpenseCategory> {
  const { isConfigured } = getEnvStatus();
  const catId = crypto.randomUUID();

  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("expense_categories")
      .insert([{ id: catId, name: category.name, is_fixed_cost: category.is_fixed_cost ?? true }])
      .select()
      .single();
    if (error) {
      throw new Error(`Gagal membuat kategori pengeluaran di database: ${error.message}`);
    }
    return data as ExpenseCategory;
  }

  const newCat: ExpenseCategory = {
    id: catId,
    name: category.name,
    is_fixed_cost: category.is_fixed_cost ?? true,
    description: category.description || null,
    created_at: new Date().toISOString(),
  };
  memoryCategories.push(newCat);
  return newCat;
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<boolean> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured && isValidUuid(id)) {
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      throw new Error(`Gagal menghapus pengeluaran di database: ${error.message}`);
    }
    return true;
  }

  const initialLen = memoryExpenses.length;
  memoryExpenses = memoryExpenses.filter((e) => e.id !== id);
  return memoryExpenses.length < initialLen;
}

/**
 * Reset memory expenses (used for test isolation)
 */
export function resetMemoryExpenses(initialOnly = false): void {
  if (initialOnly) {
    memoryExpenses = JSON.parse(JSON.stringify(INITIAL_EXPENSES));
  } else {
    memoryExpenses = JSON.parse(JSON.stringify(ALL_EXPENSES));
  }
  memoryCategories = JSON.parse(JSON.stringify(INITIAL_EXPENSE_CATEGORIES));
}

