"use server";

import { revalidatePath } from "next/cache";
import {
  createOrder,
  updateOrderStatus,
  updateOrderPayment,
  CreateOrderPayload,
} from "@/lib/services/orders-service";
import { OrderStatus, PaymentStatus } from "@/types/database";

export async function createOrderAction(payload: CreateOrderPayload) {
  try {
    const newOrder = await createOrder(payload);
    revalidatePath("/orders");
    revalidatePath("/");
    return { success: true, order: newOrder };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal membuat pesanan";
    return { success: false, error: message };
  }
}

export async function updateOrderStatusAction(orderId: string, newStatus: OrderStatus) {
  try {
    const updated = await updateOrderStatus(orderId, newStatus);
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/");
    return { success: true, order: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui status pesanan";
    return { success: false, error: message };
  }
}

export async function updateOrderPaymentAction(
  orderId: string,
  paymentStatus: PaymentStatus,
  paidAmount?: number
) {
  try {
    const updated = await updateOrderPayment(orderId, paymentStatus, paidAmount);
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/");
    return { success: true, order: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui status pembayaran";
    return { success: false, error: message };
  }
}

export async function createPaymentAction(payload: {
  order_id: string;
  amount: number;
  payment_method: import("@/types/database").PaymentMethod;
  reference_number?: string;
  proof_url?: string;
  notes?: string;
}) {
  try {
    const { createPayment } = await import("@/lib/services/payments-service");
    const payment = await createPayment(payload);
    revalidatePath("/orders");
    revalidatePath(`/orders/${payload.order_id}`);
    revalidatePath(`/orders/${payload.order_id}/payments`);
    revalidatePath("/orders/receivables");
    revalidatePath("/");
    return { success: true, payment };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mencatat pembayaran";
    return { success: false, error: message };
  }
}

