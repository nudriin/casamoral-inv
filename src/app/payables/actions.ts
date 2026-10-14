"use server";

import { revalidatePath } from "next/cache";
import {
  recordInstallmentPayment,
  createPayable,
  deletePayable,
  RecordInstallmentPaymentPayload,
  CreatePayablePayload,
} from "@/lib/services/payables-service";

export async function recordInstallmentPaymentAction(payload: RecordInstallmentPaymentPayload) {
  try {
    const result = await recordInstallmentPayment(payload);
    revalidatePath("/payables");
    revalidatePath("/reports/cash-flow");
    revalidatePath("/");
    return { success: true, ...result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mencatat pembayaran angsuran.";
    return { success: false, error: message };
  }
}

export async function createPayableAction(payload: CreatePayablePayload) {
  try {
    const payable = await createPayable(payload);
    revalidatePath("/payables");
    revalidatePath("/");
    return { success: true, payable };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menambah kewajiban utang baru.";
    return { success: false, error: message };
  }
}

export async function deletePayableAction(id: string) {
  try {
    await deletePayable(id);
    revalidatePath("/payables");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus data utang.";
    return { success: false, error: message };
  }
}
