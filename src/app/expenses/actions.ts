"use server";

import { revalidatePath } from "next/cache";
import { createExpense, CreateExpensePayload } from "@/lib/services/expenses-service";

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
