"use server";

import { revalidatePath } from "next/cache";
import { createExpense, createExpenseCategory, deleteExpense, CreateExpensePayload } from "@/lib/services/expenses-service";

export async function createExpenseAction(payload: CreateExpensePayload) {
  try {
    const expense = await createExpense(payload);
    revalidatePath("/expenses");
    revalidatePath("/");
    return { success: true, expense };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mencatat pengeluaran";
    return { success: false, error: message };
  }
}

export async function createExpenseCategoryAction(name: string, isFixedCost: boolean, description?: string) {
  try {
    if (!name || !name.trim()) {
      return { success: false, error: "Nama kategori wajib diisi." };
    }
    const category = await createExpenseCategory({
      name: name.trim(),
      is_fixed_cost: isFixedCost,
      description: description?.trim(),
    });
    revalidatePath("/expenses");
    return { success: true, category };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal membuat kategori";
    return { success: false, error: message };
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    const success = await deleteExpense(id);
    if (!success) {
      return { success: false, error: "Gagal menghapus pengeluaran." };
    }
    revalidatePath("/expenses");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus pengeluaran";
    return { success: false, error: message };
  }
}
