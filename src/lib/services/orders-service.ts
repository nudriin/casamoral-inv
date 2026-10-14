import { INITIAL_ORDERS, INITIAL_CUSTOMERS, INITIAL_PRODUCTS } from "@/lib/data/initial-data";
import { Order, OrderItem, OrderStatus, PaymentStatus, ChannelSource, Customer } from "@/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEnvStatus } from "@/lib/env";
import Decimal from "decimal.js";

// In-memory fallback repository for local offline development & testing
let memoryOrders: Order[] = JSON.parse(JSON.stringify(INITIAL_ORDERS));
let memoryCustomers: Customer[] = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));

export interface CreateOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price?: number;
  color_details?: string;
  add_on_name?: string;
  add_on_price?: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_city?: string;
  customer_phone?: string;
  channel: ChannelSource;
  items: CreateOrderItemInput[];
  notes?: string;
  shipping_cost?: number;
  discount_amount?: number;
  payment_status?: PaymentStatus;
  paid_amount?: number;
}

export interface OrderFilters {
  channel?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
}

// State Machine Validation Rule
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["READY", "CANCELLED"],
  READY: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  if (currentStatus === newStatus) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Fetch all orders with optional filtering
 */
export async function getOrders(filters?: OrderFilters): Promise<Order[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      let query = supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .order("created_at", { ascending: false });

      if (filters?.channel && filters.channel !== "ALL") {
        query = query.eq("channel", filters.channel);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.paymentStatus) {
        query = query.eq("payment_status", filters.paymentStatus);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Order[];
      }
    } catch {
      // Fallback to local memory store
    }
  }

  // Filter local store
  let result = [...memoryOrders];

  if (filters?.channel && filters.channel !== "ALL") {
    result = result.filter((o) => o.channel.toLowerCase() === filters.channel?.toLowerCase());
  }
  if (filters?.status) {
    result = result.filter((o) => o.status === filters.status);
  }
  if (filters?.paymentStatus) {
    result = result.filter((o) => o.payment_status === filters.paymentStatus);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer?.name.toLowerCase().includes(q) ||
        o.notes?.toLowerCase().includes(q) ||
        o.items?.some((i) => i.color_details?.toLowerCase().includes(q) || i.add_on_name?.toLowerCase().includes(q))
    );
  }

  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Fetch a single order by ID or order_number
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single();

      if (!error && data) {
        return data as Order;
      }
    } catch {
      // Fallback to local memory store
    }
  }

  const found = memoryOrders.find((o) => o.id === id || o.order_number === id);
  return found || null;
}

/**
 * Create a new order with automated HPP snapshots and financial calculations
 */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  if (!payload.items || payload.items.length === 0) {
    throw new Error("Pesanan harus memiliki minimal 1 item produk.");
  }
  if (!payload.customer_name || payload.customer_name.trim() === "") {
    throw new Error("Nama pelanggan wajib diisi.");
  }

  // Find or create customer
  let customer = memoryCustomers.find(
    (c) => c.name.toLowerCase() === payload.customer_name.trim().toLowerCase()
  );

  const nowIso = new Date().toISOString();

  if (!customer) {
    customer = {
      id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: payload.customer_name.trim(),
      city: payload.customer_city?.trim() || "Sukamara",
      phone: payload.customer_phone?.trim() || null,
      channel_source: payload.channel,
      created_at: nowIso,
      updated_at: nowIso,
    };
    memoryCustomers.push(customer);
  }

  // Generate unique order number: ORD-YYYYMMDD-XXXX
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const orderNumber = `ORD-${dateStr}-${(memoryOrders.length + 1).toString().padStart(3, "0")}`;
  const orderId = `ord-${Date.now()}`;

  // Process items and snapshot HPP & unit price
  let subtotalAmount = new Decimal(0);
  let addOnAmount = new Decimal(0);

  const orderItems: OrderItem[] = payload.items.map((item, index) => {
    const product = INITIAL_PRODUCTS.find((p) => p.id === item.product_id);
    if (!product) {
      throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan.`);
    }

    const unitPrice = item.unit_price !== undefined ? item.unit_price : product.selling_price;
    const unitHpp = product.current_hpp; // Immutable snapshot at moment of purchase
    const addOnPrice = item.add_on_price ? new Decimal(item.add_on_price) : new Decimal(0);
    const qty = new Decimal(item.quantity);

    const itemBaseTotal = new Decimal(unitPrice).times(qty);
    const itemAddonTotal = addOnPrice.times(qty);
    const itemSubtotal = itemBaseTotal.plus(itemAddonTotal);

    subtotalAmount = subtotalAmount.plus(itemBaseTotal);
    addOnAmount = addOnAmount.plus(itemAddonTotal);

    return {
      id: `item-${Date.now()}-${index}`,
      order_id: orderId,
      product_id: product.id,
      quantity: item.quantity,
      unit_price: unitPrice,
      unit_hpp: unitHpp,
      color_details: item.color_details || null,
      add_on_name: item.add_on_name || null,
      add_on_price: addOnPrice.toNumber(),
      subtotal: itemSubtotal.toNumber(),
      created_at: nowIso,
      product,
    };
  });

  const discountDec = new Decimal(payload.discount_amount || 0);
  const shippingDec = new Decimal(payload.shipping_cost || 0);
  const totalAmountDec = subtotalAmount.plus(addOnAmount).plus(shippingDec).minus(discountDec);
  const totalAmount = totalAmountDec.greaterThan(0) ? totalAmountDec.toNumber() : 0;

  // Platform fee for Shopee (8% admin + 4% ongkir xtra max 10k)
  let platformFee = 0;
  if (payload.channel === "Shopee") {
    const adminFee = new Decimal(totalAmount).times(0.08);
    const ongkirXtra = Decimal.min(new Decimal(totalAmount).times(0.04), 10000);
    platformFee = adminFee.plus(ongkirXtra).toNumber();
  }

  const paidAmount = payload.paid_amount || 0;
  let paymentStatus: PaymentStatus = payload.payment_status || "UNPAID";
  if (paidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = "PAID";
  } else if (paidAmount > 0 && paidAmount < totalAmount) {
    paymentStatus = "PARTIALLY_PAID";
  }

  const newOrder: Order = {
    id: orderId,
    order_number: orderNumber,
    order_date: nowIso,
    customer_id: customer.id,
    channel: payload.channel,
    status: "PENDING",
    subtotal_amount: subtotalAmount.toNumber(),
    add_on_amount: addOnAmount.toNumber(),
    discount_amount: discountDec.toNumber(),
    shipping_cost: shippingDec.toNumber(),
    platform_fee: platformFee,
    total_amount: totalAmount,
    payment_status: paymentStatus,
    paid_amount: paidAmount,
    notes: payload.notes || null,
    created_at: nowIso,
    updated_at: nowIso,
    customer,
    items: orderItems,
  };

  // Persist to local memory store
  memoryOrders.unshift(newOrder);

  // If Supabase is configured, also push to DB
  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("orders").insert({
        id: newOrder.id,
        order_number: newOrder.order_number,
        order_date: newOrder.order_date,
        customer_id: newOrder.customer_id,
        channel: newOrder.channel,
        status: newOrder.status,
        subtotal_amount: newOrder.subtotal_amount,
        add_on_amount: newOrder.add_on_amount,
        discount_amount: newOrder.discount_amount,
        shipping_cost: newOrder.shipping_cost,
        platform_fee: newOrder.platform_fee,
        total_amount: newOrder.total_amount,
        payment_status: newOrder.payment_status,
        paid_amount: newOrder.paid_amount,
        notes: newOrder.notes,
      });

      for (const item of orderItems) {
        await supabase.from("order_items").insert({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_hpp: item.unit_hpp,
          color_details: item.color_details,
          add_on_name: item.add_on_name,
          add_on_price: item.add_on_price,
          subtotal: item.subtotal,
        });
      }
    } catch {
      // Log or handle gracefully
    }
  }

  return newOrder;
}

/**
 * Update order production/fulfillment status with strict state machine validation
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
  const order = memoryOrders.find((o) => o.id === orderId || o.order_number === orderId);
  if (!order) {
    throw new Error(`Pesanan dengan ID ${orderId} tidak ditemukan.`);
  }

  if (!isValidStatusTransition(order.status, newStatus)) {
    throw new Error(
      `Transisi status tidak valid: dari "${order.status}" tidak diperbolehkan langsung ke "${newStatus}".`
    );
  }

  order.status = newStatus;
  order.updated_at = new Date().toISOString();

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: order.updated_at })
        .eq("id", order.id);
    } catch {
      // Fallback
    }
  }

  return order;
}

/**
 * Update payment status & paid amount
 */
export async function updateOrderPayment(
  orderId: string,
  paymentStatus: PaymentStatus,
  paidAmount?: number
): Promise<Order> {
  const order = memoryOrders.find((o) => o.id === orderId || o.order_number === orderId);
  if (!order) {
    throw new Error(`Pesanan dengan ID ${orderId} tidak ditemukan.`);
  }

  order.payment_status = paymentStatus;
  if (paidAmount !== undefined) {
    order.paid_amount = paidAmount;
  } else if (paymentStatus === "PAID") {
    order.paid_amount = order.total_amount;
  } else if (paymentStatus === "UNPAID") {
    order.paid_amount = 0;
  }
  order.updated_at = new Date().toISOString();

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase
        .from("orders")
        .update({
          payment_status: order.payment_status,
          paid_amount: order.paid_amount,
          updated_at: order.updated_at,
        })
        .eq("id", order.id);
    } catch {
      // Fallback
    }
  }

  return order;
}

/**
 * Compute aggregate summary statistics for the Order Module
 */
export async function getOrderSummaryStats(): Promise<{
  totalOrders: number;
  totalRevenue: number;
  totalPaid: number;
  totalReceivables: number;
  statusCounts: Record<OrderStatus, number>;
  channelCounts: Record<string, number>;
}> {
  const orders = await getOrders();

  let totalRevDec = new Decimal(0);
  let totalPaidDec = new Decimal(0);

  const statusCounts: Record<OrderStatus, number> = {
    PENDING: 0,
    CONFIRMED: 0,
    IN_PRODUCTION: 0,
    READY: 0,
    SHIPPED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };

  const channelCounts: Record<string, number> = {};

  for (const o of orders) {
    // Only count active non-cancelled orders towards revenue
    if (o.status !== "CANCELLED") {
      totalRevDec = totalRevDec.plus(o.total_amount);
      totalPaidDec = totalPaidDec.plus(o.paid_amount);
    }

    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    channelCounts[o.channel] = (channelCounts[o.channel] || 0) + 1;
  }

  const receivablesDec = Decimal.max(0, totalRevDec.minus(totalPaidDec));

  return {
    totalOrders: orders.length,
    totalRevenue: totalRevDec.toNumber(),
    totalPaid: totalPaidDec.toNumber(),
    totalReceivables: receivablesDec.toNumber(),
    statusCounts,
    channelCounts,
  };
}

/**
 * Helper to reset in-memory data back to initial state (useful for automated testing)
 */
export function resetMemoryOrders(): void {
  memoryOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
  memoryCustomers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
}
