import { INITIAL_PAYMENTS, STORE_PAYMENTS, ALL_PAYMENTS } from "@/lib/data/initial-data";
import { Payment, PaymentMethod, PaymentStatus, Order } from "@/types/database";
import { getServiceSupabaseClient, isValidUuid } from "@/lib/supabase/db";
import { getEnvStatus } from "@/lib/env";
import { getOrderById, updateOrderPayment } from "./orders-service";
import Decimal from "decimal.js";

// In-memory store for fallback & testing
let memoryPayments: Payment[] = JSON.parse(JSON.stringify(ALL_PAYMENTS));

export interface CreatePaymentPayload {
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  proof_url?: string;
  notes?: string;
}

export interface ReceivableItem {
  order: Order;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  daysAging: number;
  customerName: string;
  customerCity: string;
}

export interface ReceivablesSummary {
  totalReceivables: number;
  totalReceivableOrdersCount: number;
  items: ReceivableItem[];
  byChannel: Record<string, number>;
}

/**
 * Get all recorded payments with optional filters
 */
export async function getPayments(filters?: { order_id?: string; method?: PaymentMethod }): Promise<Payment[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await getServiceSupabaseClient();
      let query = supabase.from("payments").select("*").order("payment_date", { ascending: false });

      if (filters?.order_id) {
        query = query.eq("order_id", filters.order_id);
      }
      if (filters?.method) {
        query = query.eq("payment_method", filters.method);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as Payment[];
      }
    } catch {
      // Fallback
    }
  }

  let result = [...memoryPayments];
  if (filters?.order_id) {
    result = result.filter((p) => p.order_id === filters.order_id);
  }
  if (filters?.method) {
    result = result.filter((p) => p.payment_method === filters.method);
  }

  return result.sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
}

/**
 * Record a payment (DP or full settlement) for an order
 */
export async function createPayment(payload: CreatePaymentPayload): Promise<Payment> {
  const amountDec = new Decimal(payload.amount);
  if (amountDec.lessThanOrEqualTo(0)) {
    throw new Error("Nominal pembayaran harus lebih besar dari Rp 0.");
  }

  const order = await getOrderById(payload.order_id);
  if (!order) {
    throw new Error(`Pesanan dengan ID ${payload.order_id} tidak ditemukan.`);
  }

  if (order.status === "CANCELLED") {
    throw new Error("Tidak dapat mencatat pembayaran pada pesanan yang telah dibatalkan.");
  }

  const currentPaid = new Decimal(order.paid_amount || 0);
  const totalAmount = new Decimal(order.total_amount || 0);
  const newPaid = currentPaid.plus(amountDec);

  let newPaymentStatus: PaymentStatus = "PARTIALLY_PAID";
  if (newPaid.greaterThanOrEqualTo(totalAmount)) {
    newPaymentStatus = "PAID";
  }

  const nowIso = new Date().toISOString();
  const paymentId = crypto.randomUUID();

  const payment: Payment = {
    id: paymentId,
    order_id: order.id,
    payment_date: nowIso,
    amount: amountDec.toNumber(),
    payment_method: payload.payment_method,
    reference_number: payload.reference_number || null,
    proof_url: payload.proof_url || null,
    notes: payload.notes || null,
    created_at: nowIso,
  };

  // Push to Supabase if configured
  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("payments").insert({
      id: payment.id,
      order_id: payment.order_id,
      payment_date: payment.payment_date,
      amount: payment.amount,
      payment_method: payment.payment_method,
      reference_number: payment.reference_number,
      proof_url: payment.proof_url,
      notes: payment.notes,
    });
    if (error) {
      throw new Error(`Gagal menyimpan pembayaran ke database: ${error.message}`);
    }
    await updateOrderPayment(order.id, newPaymentStatus, newPaid.toNumber());
    return payment;
  }

  // Add to local memory store
  memoryPayments.unshift(payment);

  // Update order's paid amount and payment status
  await updateOrderPayment(order.id, newPaymentStatus, newPaid.toNumber());

  return payment;
}

/**
 * Compute Accounts Receivable (Piutang) summary across all orders
 */
export async function getReceivablesSummary(): Promise<ReceivablesSummary> {
  // Use memory or database orders
  const { isConfigured } = getEnvStatus();
  let orders: Order[] = [];

  if (isConfigured) {
    try {
      const supabase = await getServiceSupabaseClient();
      const { data, error } = await supabase
        .from("orders")
        .select(`*, customer:customers(*), items:order_items(*)`)
        .order("order_date", { ascending: false });
      if (!error && data) {
        orders = data as Order[];
      }
    } catch {
      // Fallback
    }
  }

  if (orders.length === 0) {
    const { getOrders } = await import("./orders-service");
    orders = await getOrders();
  }

  const now = new Date().getTime();
  let totalReceivablesDec = new Decimal(0);
  const items: ReceivableItem[] = [];
  const byChannel: Record<string, number> = {};

  for (const ord of orders) {
    // Only count active non-cancelled orders
    if (ord.status === "CANCELLED") continue;

    const total = new Decimal(ord.total_amount);
    const fee = new Decimal(ord.platform_fee || 0);
    const isMarketplace = ["Shopee", "TikTokShop", "Tokopedia"].includes(ord.channel);
    const netCollectible = isMarketplace ? Decimal.max(0, total.minus(fee)) : total;
    const paid = new Decimal(ord.paid_amount || 0);
    const remaining = ord.payment_status === "PAID" ? new Decimal(0) : Decimal.max(0, netCollectible.minus(paid));

    // Only include orders that are unpaid or partially paid
    if (ord.payment_status !== "PAID" && remaining.greaterThan(0)) {
      totalReceivablesDec = totalReceivablesDec.plus(remaining);

      const orderTime = new Date(ord.order_date).getTime();
      const diffDays = Math.max(0, Math.floor((now - orderTime) / (1000 * 60 * 60 * 24)));

      items.push({
        order: ord,
        totalAmount: total.toNumber(),
        paidAmount: paid.toNumber(),
        remainingAmount: remaining.toNumber(),
        daysAging: diffDays,
        customerName: ord.customer?.name || "Pelanggan Umum",
        customerCity: ord.customer?.city || "Sukamara",
      });

      byChannel[ord.channel] = (byChannel[ord.channel] || 0) + remaining.toNumber();
    }
  }

  return {
    totalReceivables: totalReceivablesDec.toNumber(),
    totalReceivableOrdersCount: items.length,
    items: items.sort((a, b) => b.remainingAmount - a.remainingAmount),
    byChannel,
  };
}

/**
 * Delete all payments associated with an order (called during order deletion)
 */
export async function deletePaymentsByOrderId(orderId: string): Promise<number> {
  const { isConfigured } = getEnvStatus();
  if (isConfigured && isValidUuid(orderId)) {
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("payments").delete().eq("order_id", orderId);
    if (error) {
      throw new Error(`Gagal menghapus pembayaran pesanan di database: ${error.message}`);
    }
    return 1;
  }

  const initialLen = memoryPayments.length;
  memoryPayments = memoryPayments.filter((p) => p.order_id !== orderId);
  const deletedCount = initialLen - memoryPayments.length;

  return deletedCount;
}

/**
 * Reset memory payments (used for automated test cleanup)
 */
export function resetMemoryPayments(initialOnly = false): void {
  if (initialOnly) {
    memoryPayments = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
  } else {
    memoryPayments = JSON.parse(JSON.stringify(ALL_PAYMENTS));
  }
}
