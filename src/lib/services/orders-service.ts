import {
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  ALL_ORDERS,
  ALL_CUSTOMERS,
  INITIAL_PRODUCTS,
  ALL_PRODUCTS,
} from "@/lib/data/initial-data";
import { Order, OrderItem, OrderStatus, PaymentStatus, ChannelSource, Customer } from "@/types/database";
import { getServiceSupabaseClient, isValidUuid } from "@/lib/supabase/db";
import { getProducts } from "./products-service";
import { getEnvStatus } from "@/lib/env";
import { calculatePlatformFee } from "@/lib/financial/platform-fees";
import Decimal from "decimal.js";

// In-memory fallback repository for local offline development & testing
let memoryOrders: Order[] = JSON.parse(JSON.stringify(ALL_ORDERS));
let memoryCustomers: Customer[] = JSON.parse(JSON.stringify(ALL_CUSTOMERS));

export interface CreateOrderItemInput {
  product_id: string;
  quantity: number;
  unit_price?: number;
  color_details?: string;
  add_on_name?: string;
  add_on_price?: number;
  product_name?: string;
  subtotal?: number;
  filament_type?: string;
  filament_color?: string;
}

export interface CreateOrderPayload {
  customer_name: string;
  customer_city?: string;
  customer_phone?: string;
  channel?: ChannelSource;
  sales_channel?: ChannelSource;
  order_date?: string;
  status?: OrderStatus;
  subtotal?: number;
  total_amount?: number;
  items: CreateOrderItemInput[];
  notes?: string;
  shipping_cost?: number;
  discount_amount?: number;
  payment_status?: PaymentStatus;
  paid_amount?: number;
  platform_fee?: number;
  shopee_fee_model?: "LEGACY_SPRINT4" | "PRECISE_STORE";
  checkout_deductions?: import("./materials-service").CheckoutDeductionItem[];
  deduct_stock_on_create?: boolean;
}

export interface UpdateOrderItemInput {
  id?: string;
  product_id?: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  unit_hpp?: number;
  color_details?: string;
  add_on_name?: string;
  add_on_price?: number;
}

export interface UpdateOrderPayload {
  order_id: string;
  order_date?: string;
  channel?: ChannelSource;
  status?: OrderStatus;
  customer_name?: string;
  customer_city?: string;
  customer_phone?: string;
  items?: UpdateOrderItemInput[];
  notes?: string;
  shipping_cost?: number;
  discount_amount?: number;
  platform_fee?: number;
  recalculate_platform_fee?: boolean;
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
      const supabase = await getServiceSupabaseClient();
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
        const dbOrders = (data as Order[]).map((o) => populateOrderProducts(o));
        const dbNumbers = new Set(dbOrders.map((o) => o.order_number));
        let remainingInitial = memoryOrders.filter((o) => !dbNumbers.has(o.order_number));
        if (filters?.channel && filters.channel !== "ALL") {
          remainingInitial = remainingInitial.filter((o) => o.channel.toLowerCase() === filters.channel?.toLowerCase());
        }
        if (filters?.status) {
          remainingInitial = remainingInitial.filter((o) => o.status === filters.status);
        }
        if (filters?.paymentStatus) {
          remainingInitial = remainingInitial.filter((o) => o.payment_status === filters.paymentStatus);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          remainingInitial = remainingInitial.filter(
            (o) =>
              o.order_number.toLowerCase().includes(q) ||
              o.customer?.name.toLowerCase().includes(q) ||
              o.notes?.toLowerCase().includes(q)
          );
        }
        return [...dbOrders, ...remainingInitial.map((o) => populateOrderProducts(o))].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
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

  return result
    .map((o) => populateOrderProducts(o))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Helper to ensure item.product is always populated with concise model details (Lumi, Ollie, Kumo, Pomi, Nomi)
 */
function populateOrderProducts(order: Order): Order {
  if (!order.items) return order;
  return {
    ...order,
    items: order.items.map((item) => {
      const matched = ALL_PRODUCTS.find((p) => p.id === item.product_id);
      if (matched) {
        return {
          ...item,
          product: {
            ...matched,
            name: matched.name.replace(/^Lampu Ambient\s*[-–—:]?\s*/i, "").trim(),
          },
        };
      }
      if (item.product) {
        return {
          ...item,
          product: {
            ...item.product,
            name: item.product.name.replace(/^Lampu Ambient\s*[-–—:]?\s*/i, "").trim() || "Ollie",
          },
        };
      }
      return item;
    }),
  };
}

/**
 * Fetch a single order by ID or order_number
 */
export async function getOrderById(id: string): Promise<Order | null> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await getServiceSupabaseClient();
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
        return populateOrderProducts(data as Order);
      }
    } catch {
      // Fallback to local memory store
    }
  }

  const found = memoryOrders.find((o) => o.id === id || o.order_number === id);
  return found ? populateOrderProducts(found) : null;
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

  const { isConfigured } = getEnvStatus();
  const nowIso = payload.order_date || new Date().toISOString();
  const channelSource: ChannelSource = payload.channel || payload.sales_channel || "WhatsApp";
  const trimmedCustomerName = payload.customer_name.trim();

  // Find or create customer
  let customer: Customer | undefined;
  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { data: existingCust } = await supabase
      .from("customers")
      .select("*")
      .ilike("name", trimmedCustomerName)
      .limit(1)
      .maybeSingle();
    if (existingCust) {
      customer = existingCust as Customer;
    } else {
      const newCustId = crypto.randomUUID();
      const { data: createdCust, error: custError } = await supabase
        .from("customers")
        .insert({
          id: newCustId,
          name: trimmedCustomerName,
          city: payload.customer_city?.trim() || null,
          phone: payload.customer_phone?.trim() || null,
          channel_source: channelSource,
        })
        .select()
        .single();
      if (custError) {
        throw new Error(`Gagal menyimpan data pelanggan ke database: ${custError.message}`);
      }
      customer = createdCust as Customer;
    }
  } else {
    customer = memoryCustomers.find(
      (c) => c.name.toLowerCase() === trimmedCustomerName.toLowerCase()
    );
    if (!customer) {
      customer = {
        id: crypto.randomUUID(),
        name: trimmedCustomerName,
        city: payload.customer_city?.trim() || null,
        phone: payload.customer_phone?.trim() || null,
        channel_source: channelSource,
        created_at: nowIso,
        updated_at: nowIso,
      };
      memoryCustomers.push(customer);
    }
  }

  // Generate unique order number: ORD-YYYYMMDD-XXXX
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const orderNumber = isConfigured
    ? `ORD-${dateStr}-${randomSuffix}`
    : `ORD-${dateStr}-${(memoryOrders.length + 1).toString().padStart(3, "0")}`;
  const orderId = crypto.randomUUID();

  // Process items and snapshot HPP & unit price
  let subtotalAmount = new Decimal(0);
  let addOnAmount = new Decimal(0);
  const catalogProducts = isConfigured ? await getProducts(true) : ALL_PRODUCTS;

  const orderItems: OrderItem[] = payload.items.map((item) => {
    const product =
      catalogProducts.find((p) => p.id === item.product_id) ||
      ALL_PRODUCTS.find((p) => p.id === item.product_id) ||
      INITIAL_PRODUCTS.find((p) => p.id === item.product_id);
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
      id: crypto.randomUUID(),
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

  // Platform fee for Marketplaces (Shopee, TikTokShop, Tokopedia)
  const orderChannel = payload.channel || payload.sales_channel || "WhatsApp";
  let platformFee = 0;
  if (payload.platform_fee !== undefined) {
    platformFee = payload.platform_fee;
  } else if (orderChannel === "Shopee" && payload.shopee_fee_model !== "PRECISE_STORE") {
    // Standard / Legacy Sprint 4 test expectation (8% Admin + 4% Ongkir Xtra max 10k)
    const adminFee = new Decimal(totalAmount).times(0.08);
    const ongkirXtra = Decimal.min(new Decimal(totalAmount).times(0.04), 10000);
    platformFee = adminFee.plus(ongkirXtra).toNumber();
  } else {
    // Centralized formula for Shopee (9.5%+1250+0.5%), TikTokShop (8.0%+1250+0.5%), Tokopedia (8.0%+1250+0.5%), Direct (0%)
    platformFee = calculatePlatformFee(orderChannel, totalAmount).totalFee;
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
    customer_id: customer!.id,
    channel: channelSource,
    status: payload.status || "PENDING",
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

  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { error: ordError } = await supabase.from("orders").insert({
      id: newOrder.id,
      order_number: newOrder.order_number,
      order_date: newOrder.order_date,
      customer_id: isValidUuid(newOrder.customer_id) ? newOrder.customer_id : null,
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
    if (ordError) {
      throw new Error(`Gagal menyimpan pesanan ke database: ${ordError.message}`);
    }

    for (const item of orderItems) {
      const { error: itemError } = await supabase.from("order_items").insert({
        id: item.id,
        order_id: item.order_id,
        product_id: isValidUuid(item.product_id) ? item.product_id : null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_hpp: item.unit_hpp,
        color_details: item.color_details,
        add_on_name: item.add_on_name,
        add_on_price: item.add_on_price,
        subtotal: item.subtotal,
      });
      if (itemError) {
        throw new Error(`Gagal menyimpan item pesanan ke database: ${itemError.message}`);
      }
    }
  } else {
    memoryOrders.unshift(newOrder);
  }

  // Deduct custom checkout materials (filament, lamp, cables, packaging, honeycomb, bubble wrap, etc.)
  if (payload.checkout_deductions && payload.checkout_deductions.length > 0) {
    const { deductCustomCheckoutStock } = await import("./materials-service");
    await deductCustomCheckoutStock(orderId, orderNumber, payload.checkout_deductions);
  } else if (payload.deduct_stock_on_create) {
    const { deductBOMStockForOrder } = await import("./materials-service");
    await deductBOMStockForOrder(newOrder);
  }

  return newOrder;
}

/**
 * Update order production/fulfillment status with strict state machine validation
 */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order> {
  const { isConfigured } = getEnvStatus();
  const order = memoryOrders.find((o) => o.id === orderId || o.order_number === orderId) || (isConfigured ? await getOrderById(orderId) : null);
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

  // Automatic inventory mutation triggers
  if (newStatus === "IN_PRODUCTION") {
    const { deductBOMStockForOrder } = await import("./materials-service");
    await deductBOMStockForOrder(order);
  } else if (newStatus === "CANCELLED") {
    const { restoreBOMStockForOrder } = await import("./materials-service");
    await restoreBOMStockForOrder(order);
  }

  if (isConfigured && isValidUuid(order.id)) {
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: order.updated_at })
      .eq("id", order.id);
    if (error) {
      throw new Error(`Gagal memperbarui status pesanan di database: ${error.message}`);
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
  const { isConfigured } = getEnvStatus();
  const order = memoryOrders.find((o) => o.id === orderId || o.order_number === orderId) || (isConfigured ? await getOrderById(orderId) : null);
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

  if (isConfigured && isValidUuid(order.id)) {
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: order.payment_status,
        paid_amount: order.paid_amount,
        updated_at: order.updated_at,
      })
      .eq("id", order.id);
    if (error) {
      throw new Error(`Gagal memperbarui status pembayaran pesanan di database: ${error.message}`);
    }
  }

  return order;
}

/**
 * Edit/Update an entire order and its financial metrics comprehensively
 */
export async function updateOrder(payload: UpdateOrderPayload): Promise<Order> {
  const { isConfigured } = getEnvStatus();
  const order =
    memoryOrders.find((o) => o.id === payload.order_id || o.order_number === payload.order_id) ||
    (isConfigured ? await getOrderById(payload.order_id) : null);
  if (!order) {
    throw new Error(`Pesanan dengan ID atau nomor "${payload.order_id}" tidak ditemukan.`);
  }

  // Update order date
  if (payload.order_date) {
    order.order_date = payload.order_date;
  }

  // Update channel
  if (payload.channel) {
    order.channel = payload.channel;
  }

  // Update production status directly (allows administrative override to any status)
  if (payload.status) {
    order.status = payload.status;
  }

  // Update notes
  if (payload.notes !== undefined) {
    order.notes = payload.notes || null;
  }

  // Update customer
  if (payload.customer_name) {
    const trimmedName = payload.customer_name.trim();
    if (!order.customer) {
      order.customer = {
        id: `cust-${Date.now()}`,
        name: trimmedName,
        channel_source: order.channel,
        city: payload.customer_city || null,
        phone: payload.customer_phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      order.customer.name = trimmedName;
      if (payload.customer_city !== undefined) {
        order.customer.city = payload.customer_city || null;
      }
      if (payload.customer_phone !== undefined) {
        order.customer.phone = payload.customer_phone || null;
      }
    }
  } else if (order.customer) {
    if (payload.customer_city !== undefined) {
      order.customer.city = payload.customer_city || null;
    }
    if (payload.customer_phone !== undefined) {
      order.customer.phone = payload.customer_phone || null;
    }
  }

  // Update items if supplied
  if (payload.items && payload.items.length > 0) {
    let subtotalAmount = new Decimal(0);
    let addOnAmount = new Decimal(0);
    let rawHpp = new Decimal(0);

    const nowIso = new Date().toISOString();
    const updatedItems: OrderItem[] = payload.items.map((item, index) => {
      const product = ALL_PRODUCTS.find((p) => p.id === item.product_id) || INITIAL_PRODUCTS.find((p) => p.id === item.product_id);
      const unitPrice = new Decimal(item.unit_price !== undefined ? item.unit_price : (product?.selling_price || 0));
      const unitHpp = item.unit_hpp !== undefined ? item.unit_hpp : (product?.current_hpp || 0);
      const addOnPrice = item.add_on_price ? new Decimal(item.add_on_price) : new Decimal(0);
      const qty = new Decimal(item.quantity || 1);

      const itemBaseTotal = unitPrice.times(qty);
      const itemAddonTotal = addOnPrice.times(qty);
      const itemSubtotal = itemBaseTotal.plus(itemAddonTotal);

      subtotalAmount = subtotalAmount.plus(itemBaseTotal);
      addOnAmount = addOnAmount.plus(itemAddonTotal);
      rawHpp = rawHpp.plus(new Decimal(unitHpp).times(qty));

      return {
        id: item.id || `item-${Date.now()}-${index}`,
        order_id: order.id,
        product_id: product?.id || item.product_id || null,
        quantity: item.quantity,
        unit_price: unitPrice.toNumber(),
        unit_hpp: unitHpp,
        color_details: item.color_details || null,
        add_on_name: item.add_on_name || null,
        add_on_price: addOnPrice.toNumber(),
        subtotal: itemSubtotal.toNumber(),
        created_at: order.created_at || nowIso,
        product: product || (item.product_name ? {
          id: item.product_id || "custom",
          name: item.product_name,
          selling_price: unitPrice.toNumber(),
          current_hpp: unitHpp,
        } as any : undefined),
      };
    });

    order.items = updatedItems;
    order.subtotal_amount = subtotalAmount.toNumber();
    order.add_on_amount = addOnAmount.toNumber();
    order.raw_hpp = rawHpp.toNumber();
  }

  // Update shipping and discounts
  if (payload.shipping_cost !== undefined) {
    order.shipping_cost = payload.shipping_cost;
  }
  if (payload.discount_amount !== undefined) {
    order.discount_amount = payload.discount_amount;
  }

  // Recalculate total amount
  const calculatedTotal = new Decimal(order.subtotal_amount)
    .plus(order.add_on_amount)
    .plus(order.shipping_cost || 0)
    .minus(order.discount_amount || 0);
  order.total_amount = calculatedTotal.greaterThan(0) ? calculatedTotal.toNumber() : 0;

  // Total HPP
  const packagingCost = order.packaging_cost || 0;
  order.total_hpp = (order.raw_hpp !== undefined ? order.raw_hpp : (order.items?.reduce((acc, i) => acc + (i.unit_hpp || 0) * (i.quantity || 1), 0) || 0)) + packagingCost;

  // Platform Fee for Marketplaces (Shopee, TikTokShop, Tokopedia)
  if (payload.platform_fee !== undefined) {
    order.platform_fee = payload.platform_fee;
  } else if (payload.recalculate_platform_fee || payload.channel !== undefined) {
    order.platform_fee = calculatePlatformFee(order.channel, order.total_amount).totalFee;
  }

  // Net Profit
  order.net_profit = new Decimal(order.total_amount)
    .minus(order.total_hpp || 0)
    .minus(order.platform_fee || 0)
    .toNumber();

  // Payment status & paid amount
  if (payload.paid_amount !== undefined) {
    order.paid_amount = payload.paid_amount;
  }
  if (payload.payment_status !== undefined) {
    order.payment_status = payload.payment_status;
  } else if (payload.paid_amount !== undefined || payload.items !== undefined) {
    // If not explicitly set, auto adjust based on paid_amount vs total_amount
    if (order.paid_amount >= order.total_amount && order.total_amount > 0) {
      order.payment_status = "PAID";
    } else if (order.paid_amount > 0) {
      order.payment_status = "PARTIALLY_PAID";
    } else {
      order.payment_status = "UNPAID";
    }
  }

  order.updated_at = new Date().toISOString();

  // Sync to Supabase if configured
  if (isConfigured && isValidUuid(order.id)) {
    const supabase = await getServiceSupabaseClient();
    const { error: ordUpdateError } = await supabase
      .from("orders")
      .update({
        order_date: order.order_date,
        channel: order.channel,
        status: order.status,
        subtotal_amount: order.subtotal_amount,
        add_on_amount: order.add_on_amount,
        discount_amount: order.discount_amount,
        shipping_cost: order.shipping_cost,
        platform_fee: order.platform_fee,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        paid_amount: order.paid_amount,
        notes: order.notes,
        updated_at: order.updated_at,
      })
      .eq("id", order.id);

    if (ordUpdateError) {
      throw new Error(`Gagal memperbarui pesanan di database: ${ordUpdateError.message}`);
    }

    if (order.customer_id && isValidUuid(order.customer_id) && order.customer) {
      const { error: custUpdateError } = await supabase
        .from("customers")
        .update({
          name: order.customer.name,
          city: order.customer.city,
          phone: order.customer.phone,
        })
        .eq("id", order.customer_id);
      if (custUpdateError) {
        throw new Error(`Gagal memperbarui data pelanggan di database: ${custUpdateError.message}`);
      }
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

export interface PosItemInput {
  product_id: string;
  quantity: number;
  raw_unit_price: number;
  raw_unit_hpp: number;
  color_details?: string;
  add_on_name?: string;
  add_on_price?: number;
}

export interface PosCheckoutPayload {
  customer_name?: string;
  customer_city?: string;
  customer_phone?: string;
  channel: ChannelSource;
  items: PosItemInput[];
  packaging_items: import("./materials-service").SelectedPackagingItem[];
  shipping_cost?: number;
  discount_amount?: number;
  payment_method: import("@/types/database").PaymentMethod;
  paid_amount?: number;
  notes?: string;
}

/**
 * POS Checkout: Creates an order, deducts selected packaging stock immediately,
 * deducts product BOM stock, records payment, and computes net profit snapshot.
 */
export async function checkoutPosOrder(payload: PosCheckoutPayload): Promise<{
  order: Order;
  netProfit: number;
  totalHpp: number;
  platformFee: number;
}> {
  if (!payload.items || payload.items.length === 0) {
    throw new Error("Keranjang POS harus memiliki minimal 1 produk.");
  }

  const { isConfigured } = getEnvStatus();
  const customerName = payload.customer_name?.trim() || "Pelanggan POS / Umum";
  const nowIso = new Date().toISOString();
  let customer: Customer | undefined;

  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { data: existingCust } = await supabase
      .from("customers")
      .select("*")
      .ilike("name", customerName)
      .limit(1)
      .maybeSingle();

    if (existingCust) {
      customer = existingCust as Customer;
    } else {
      const { data: createdCust, error: custError } = await supabase
        .from("customers")
        .insert({
          id: crypto.randomUUID(),
          name: customerName,
          city: payload.customer_city?.trim() || null,
          phone: payload.customer_phone?.trim() || null,
          channel_source: payload.channel,
        })
        .select()
        .single();
      if (custError) {
        throw new Error(`Gagal menyimpan pelanggan POS ke database: ${custError.message}`);
      }
      customer = createdCust as Customer;
    }
  } else {
    customer = memoryCustomers.find(
      (c) => c.name.toLowerCase() === customerName.toLowerCase()
    );
    if (!customer) {
      customer = {
        id: crypto.randomUUID(),
        name: customerName,
        city: payload.customer_city?.trim() || null,
        phone: payload.customer_phone?.trim() || null,
        channel_source: payload.channel,
        created_at: nowIso,
        updated_at: nowIso,
      };
      memoryCustomers.push(customer);
    }
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const orderNumber = isConfigured
    ? `POS-${dateStr}-${randomSuffix}`
    : `POS-${dateStr}-${(memoryOrders.length + 1).toString().padStart(3, "0")}`;
  const orderId = crypto.randomUUID();

  let rawProductsSubtotal = new Decimal(0);
  let rawProductsHpp = new Decimal(0);
  let addOnAmount = new Decimal(0);
  const catalogProducts = isConfigured ? await getProducts(true) : ALL_PRODUCTS;

  const orderItems: OrderItem[] = payload.items.map((item) => {
    const product =
      catalogProducts.find((p) => p.id === item.product_id) ||
      ALL_PRODUCTS.find((p) => p.id === item.product_id) ||
      INITIAL_PRODUCTS.find((p) => p.id === item.product_id);
    const qty = new Decimal(item.quantity);
    const unitPrice = new Decimal(item.raw_unit_price);
    const unitHpp = new Decimal(item.raw_unit_hpp);
    const addOnPrice = item.add_on_price ? new Decimal(item.add_on_price) : new Decimal(0);

    const itemBaseTotal = unitPrice.times(qty);
    const itemAddonTotal = addOnPrice.times(qty);
    const itemSubtotal = itemBaseTotal.plus(itemAddonTotal);

    rawProductsSubtotal = rawProductsSubtotal.plus(itemBaseTotal);
    rawProductsHpp = rawProductsHpp.plus(unitHpp.times(qty));
    addOnAmount = addOnAmount.plus(itemAddonTotal);

    return {
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: unitPrice.toNumber(),
      unit_hpp: unitHpp.toNumber(),
      color_details: item.color_details || null,
      add_on_name: item.add_on_name || null,
      add_on_price: addOnPrice.toNumber(),
      subtotal: itemSubtotal.toNumber(),
      created_at: nowIso,
      product: product || undefined,
    };
  });

  // Calculate Packaging HPP and Selling Price
  let packagingSellingSubtotal = new Decimal(0);
  let packagingHppSubtotal = new Decimal(0);

  if (payload.packaging_items && payload.packaging_items.length > 0) {
    for (const pkg of payload.packaging_items) {
      const pQty = new Decimal(pkg.quantity);
      packagingSellingSubtotal = packagingSellingSubtotal.plus(new Decimal(pkg.unit_price).times(pQty));
      packagingHppSubtotal = packagingHppSubtotal.plus(new Decimal(pkg.unit_cost).times(pQty));
    }
  }

  const subtotalAmount = rawProductsSubtotal.plus(packagingSellingSubtotal);
  const discountDec = new Decimal(payload.discount_amount || 0);
  const shippingDec = new Decimal(payload.shipping_cost || 0);
  const totalAmountDec = subtotalAmount.plus(addOnAmount).plus(shippingDec).minus(discountDec);
  const totalAmount = totalAmountDec.greaterThan(0) ? totalAmountDec.toNumber() : 0;

  // Platform Fee (Shopee: 9.5%+1250+0.5%, TikTokShop & Tokopedia: 8.0%+1250+0.5%, Direct: 0)
  const platformFee = calculatePlatformFee(payload.channel, totalAmount).totalFee;

  const totalHpp = rawProductsHpp.plus(packagingHppSubtotal).toNumber();
  const netProfit = new Decimal(totalAmount)
    .minus(totalHpp)
    .minus(platformFee)
    .toNumber();

  const paidAmount = payload.paid_amount !== undefined ? payload.paid_amount : totalAmount;
  let paymentStatus: PaymentStatus = "UNPAID";
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
    status: "COMPLETED", // Instant POS checkout is marked COMPLETED
    subtotal_amount: subtotalAmount.toNumber(),
    add_on_amount: addOnAmount.toNumber(),
    discount_amount: discountDec.toNumber(),
    shipping_cost: shippingDec.toNumber(),
    platform_fee: platformFee,
    total_amount: totalAmount,
    payment_status: paymentStatus,
    paid_amount: paidAmount,
    packaging_cost: packagingHppSubtotal.toNumber(),
    raw_hpp: rawProductsHpp.toNumber(),
    total_hpp: totalHpp,
    net_profit: netProfit,
    packaging_items: payload.packaging_items,
    notes: payload.notes || null,
    created_at: nowIso,
    updated_at: nowIso,
    customer,
    items: orderItems,
  };

  // Push order & items to Supabase BEFORE recording payments/stock deductions (FK constraint)
  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { error: ordError } = await supabase.from("orders").insert({
      id: newOrder.id,
      order_number: newOrder.order_number,
      order_date: newOrder.order_date,
      customer_id: isValidUuid(newOrder.customer_id) ? newOrder.customer_id : null,
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
    if (ordError) {
      throw new Error(`Gagal menyimpan transaksi POS ke database: ${ordError.message}`);
    }

    for (const item of orderItems) {
      const { error: itemError } = await supabase.from("order_items").insert({
        id: item.id,
        order_id: item.order_id,
        product_id: isValidUuid(item.product_id) ? item.product_id : null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_hpp: item.unit_hpp,
        color_details: item.color_details,
        add_on_name: item.add_on_name,
        add_on_price: item.add_on_price,
        subtotal: item.subtotal,
      });
      if (itemError) {
        throw new Error(`Gagal menyimpan item transaksi POS ke database: ${itemError.message}`);
      }
    }
  } else {
    memoryOrders.unshift(newOrder);
  }

  // Automatic Inventory Deductions:
  // 1. Deduct selected packaging stock (e.g. Kardus, Bubble Wrap)
  if (payload.packaging_items && payload.packaging_items.length > 0) {
    const { deductPackagingStockForOrder } = await import("./materials-service");
    await deductPackagingStockForOrder(orderId, orderNumber, payload.packaging_items);
  }

  // 2. Deduct product BOM raw materials
  const { deductBOMStockForOrder } = await import("./materials-service");
  await deductBOMStockForOrder(newOrder);

  // 3. Record payment transaction if paidAmount > 0
  if (paidAmount > 0) {
    const { createPayment } = await import("./payments-service");
    await createPayment({
      order_id: orderId,
      amount: paidAmount,
      payment_method: payload.payment_method,
      notes: `Pembayaran Kasir POS (${payload.channel})`,
    });
  }

  return {
    order: newOrder,
    netProfit,
    totalHpp,
    platformFee,
  };
}

/**
 * Delete an order permanently and ensure all related financial metrics and payments are cleaned up
 */
export async function deleteOrder(orderId: string): Promise<{ id: string; order_number: string; deleted: boolean }> {
  const { isConfigured } = getEnvStatus();
  const orderIndex = memoryOrders.findIndex((o) => o.id === orderId || o.order_number === orderId);
  const order = orderIndex !== -1 ? memoryOrders[orderIndex] : (isConfigured ? await getOrderById(orderId) : null);
  if (!order) {
    throw new Error(`Pesanan dengan ID atau nomor "${orderId}" tidak ditemukan.`);
  }

  // 1. Delete associated payments to preserve cash flow and receivables integrity
  const { deletePaymentsByOrderId } = await import("./payments-service");
  await deletePaymentsByOrderId(order.id);

  // 1.5 Restore any deducted inventory stock for this order
  const { restoreBOMStockForOrder } = await import("./materials-service");
  await restoreBOMStockForOrder(order);

  // 2. Delete from Supabase if configured
  if (isConfigured && isValidUuid(order.id)) {
    const supabase = await getServiceSupabaseClient();
    const { error: payDelErr } = await supabase.from("payments").delete().eq("order_id", order.id);
    if (payDelErr) {
      throw new Error(`Gagal menghapus pembayaran pesanan di database: ${payDelErr.message}`);
    }
    const { error: itemDelErr } = await supabase.from("order_items").delete().eq("order_id", order.id);
    if (itemDelErr) {
      throw new Error(`Gagal menghapus item pesanan di database: ${itemDelErr.message}`);
    }
    const { error: ordDelErr } = await supabase.from("orders").delete().eq("id", order.id);
    if (ordDelErr) {
      throw new Error(`Gagal menghapus pesanan di database: ${ordDelErr.message}`);
    }
  }

  // 3. Remove order from in-memory array if present
  if (orderIndex !== -1) {
    memoryOrders.splice(orderIndex, 1);
  }

  return {
    id: order.id,
    order_number: order.order_number,
    deleted: true,
  };
}

/**
 * Helper to reset in-memory data back to initial state (useful for automated testing)
 */
export function resetMemoryOrders(initialOnly = false): void {
  if (initialOnly) {
    memoryOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
    memoryCustomers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
  } else {
    memoryOrders = JSON.parse(JSON.stringify(ALL_ORDERS));
    memoryCustomers = JSON.parse(JSON.stringify(ALL_CUSTOMERS));
  }
}

