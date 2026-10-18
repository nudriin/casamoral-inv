"use server";

import { revalidatePath } from "next/cache";
import { checkoutPosOrder, PosCheckoutPayload } from "@/lib/services/orders-service";

export async function checkoutPosAction(payload: PosCheckoutPayload) {
  try {
    const result = await checkoutPosOrder(payload);
    revalidatePath("/pos");
    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/reports");
    revalidatePath("/reports/recap");
    revalidatePath("/");
    return {
      success: true,
      order: result.order,
      netProfit: result.netProfit,
      totalHpp: result.totalHpp,
      platformFee: result.platformFee,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memproses transaksi kasir POS.";
    return { success: false, error: message };
  }
}
