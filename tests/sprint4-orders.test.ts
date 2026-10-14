import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderPayment,
  getOrderSummaryStats,
  resetMemoryOrders,
  isValidStatusTransition,
} from "../src/lib/services/orders-service";

describe("Sprint 4 — Order and Production Management Tests", () => {
  beforeEach(() => {
    resetMemoryOrders();
  });

  describe("1. Historical Orders Integrity (Sheet: Orderan Casa Moral.xlsx)", () => {
    it("should accurately reflect 9 historical orders totaling exactly Rp 945.000", async () => {
      const orders = await getOrders();
      expect(orders.length).toBe(9);

      const totalVolume = orders.reduce((sum, o) => sum + o.total_amount, 0);
      expect(totalVolume).toBe(945000);
    });

    it("should accurately partition realized cash (Rp 290.000) and receivables (Rp 655.000)", async () => {
      const stats = await getOrderSummaryStats();
      expect(stats.totalRevenue).toBe(945000);
      expect(stats.totalPaid).toBe(290000);
      expect(stats.totalReceivables).toBe(655000);
    });

    it("should verify Wahyu's custom add-on order (Rp 130.000 + Rp 30.000 = Rp 160.000) is Lunas", async () => {
      const orders = await getOrders();
      const wahyuOrder = orders.find((o) => o.customer?.name === "Wahyu");

      expect(wahyuOrder).toBeDefined();
      expect(wahyuOrder?.total_amount).toBe(160000);
      expect(wahyuOrder?.add_on_amount).toBe(30000);
      expect(wahyuOrder?.payment_status).toBe("PAID");
      expect(wahyuOrder?.paid_amount).toBe(160000);

      const item = wahyuOrder?.items?.[0];
      expect(item?.add_on_name).toBe("Cap Custom Figur Lee Jeno");
      expect(item?.add_on_price).toBe(30000);
      expect(item?.unit_price).toBe(130000);
      expect(item?.unit_hpp).toBe(89705.28); // Ollie HPP snapshot
    });

    it("should verify promotional Rp 0 orders for Bang Dona and Studio Display Kumo", async () => {
      const orders = await getOrders();

      const bangDona = orders.find((o) => o.customer?.name === "Bang Dona");
      expect(bangDona).toBeDefined();
      expect(bangDona?.total_amount).toBe(0);

      const displayKumo = orders.find((o) => o.customer?.name.includes("Display"));
      expect(displayKumo).toBeDefined();
      expect(displayKumo?.total_amount).toBe(0);
    });

    it("should verify omnichannel channel split (8 Direct, 1 Shopee)", async () => {
      const orders = await getOrders();
      const directOrders = orders.filter((o) => o.channel === "Direct");
      const shopeeOrders = orders.filter((o) => o.channel === "Shopee");

      expect(directOrders.length).toBe(8);
      expect(shopeeOrders.length).toBe(1);
    });

    it("should fetch single order by ID or order_number using getOrderById", async () => {
      const order = await getOrderById("ORD-2026-001");
      expect(order).toBeDefined();
      expect(order?.customer?.name).toBe("Mahput");
      expect(order?.channel).toBe("Shopee");

      const byUuid = await getOrderById("ord-01");
      expect(byUuid?.order_number).toBe("ORD-2026-001");
    });
  });

  describe("2. Order Creation & HPP Snapshot Integrity", () => {
    it("should create a new order with proper HPP and price snapshot", async () => {
      const newOrder = await createOrder({
        customer_name: "Budi Santoso",
        customer_city: "Sukamara",
        channel: "Direct",
        items: [
          {
            product_id: "prod-01", // Lumi
            quantity: 2,
            unit_price: 120000,
            color_details: "Base Hitam + Shade Putih",
          },
        ],
        notes: "Pesanan kantor",
      });

      expect(newOrder.id).toBeDefined();
      expect(newOrder.order_number).toMatch(/^ORD-\d{8}-\d{3}$/);
      expect(newOrder.status).toBe("PENDING");
      expect(newOrder.payment_status).toBe("UNPAID");
      expect(newOrder.subtotal_amount).toBe(240000);
      expect(newOrder.total_amount).toBe(240000);

      // Verify item snapshot
      expect(newOrder.items?.[0].unit_hpp).toBe(81182.4); // Lumi exact snapshot
      expect(newOrder.items?.[0].unit_price).toBe(120000);
      expect(newOrder.items?.[0].subtotal).toBe(240000);
    });

    it("should handle custom add-ons and calculate total accurately", async () => {
      const orderWithAddon = await createOrder({
        customer_name: "Citra Kirana",
        channel: "WhatsApp",
        items: [
          {
            product_id: "prod-02", // Ollie
            quantity: 1,
            unit_price: 130000,
            add_on_name: "Custom Base Engraving",
            add_on_price: 25000,
          },
        ],
        shipping_cost: 15000,
        discount_amount: 10000,
      });

      // 130k + 25k (addon) + 15k (shipping) - 10k (discount) = 160.000
      expect(orderWithAddon.subtotal_amount).toBe(130000);
      expect(orderWithAddon.add_on_amount).toBe(25000);
      expect(orderWithAddon.shipping_cost).toBe(15000);
      expect(orderWithAddon.discount_amount).toBe(10000);
      expect(orderWithAddon.total_amount).toBe(160000);
    });

    it("should compute Shopee platform fee correctly (8% admin + 4% ongkir xtra max 10k)", async () => {
      const shopeeOrder = await createOrder({
        customer_name: "Shopee Buyer Sukamara",
        channel: "Shopee",
        items: [
          {
            product_id: "prod-04", // Pomi
            quantity: 1,
            unit_price: 150000,
          },
        ],
      });

      // Total = 150.000
      // 8% admin = 12.000
      // 4% ongkir xtra = 6.000 (under 10.000 cap)
      // Total fee = 18.000
      expect(shopeeOrder.platform_fee).toBe(18000);
    });

    it("should reject creation when items array is empty", async () => {
      await expect(
        createOrder({
          customer_name: "Tanpa Item",
          channel: "Direct",
          items: [],
        })
      ).rejects.toThrow("Pesanan harus memiliki minimal 1 item produk.");
    });
  });

  describe("3. State Machine & Order Status Progression", () => {
    it("should validate allowed status transitions correctly", () => {
      expect(isValidStatusTransition("PENDING", "CONFIRMED")).toBe(true);
      expect(isValidStatusTransition("CONFIRMED", "IN_PRODUCTION")).toBe(true);
      expect(isValidStatusTransition("IN_PRODUCTION", "READY")).toBe(true);
      expect(isValidStatusTransition("READY", "SHIPPED")).toBe(true);
      expect(isValidStatusTransition("SHIPPED", "COMPLETED")).toBe(true);
      expect(isValidStatusTransition("PENDING", "CANCELLED")).toBe(true);
      expect(isValidStatusTransition("IN_PRODUCTION", "CANCELLED")).toBe(true);

      // Disallowed transitions
      expect(isValidStatusTransition("PENDING", "COMPLETED")).toBe(false);
      expect(isValidStatusTransition("PENDING", "SHIPPED")).toBe(false);
      expect(isValidStatusTransition("COMPLETED", "IN_PRODUCTION")).toBe(false);
      expect(isValidStatusTransition("CANCELLED", "PENDING")).toBe(false);
    });

    it("should successfully progress order through complete production lifecycle", async () => {
      const order = await createOrder({
        customer_name: "Test Flow",
        channel: "Direct",
        items: [{ product_id: "prod-01", quantity: 1 }],
      });

      expect(order.status).toBe("PENDING");

      const step1 = await updateOrderStatus(order.id, "CONFIRMED");
      expect(step1.status).toBe("CONFIRMED");

      const step2 = await updateOrderStatus(order.id, "IN_PRODUCTION");
      expect(step2.status).toBe("IN_PRODUCTION");

      const step3 = await updateOrderStatus(order.id, "READY");
      expect(step3.status).toBe("READY");

      const step4 = await updateOrderStatus(order.id, "SHIPPED");
      expect(step4.status).toBe("SHIPPED");

      const step5 = await updateOrderStatus(order.id, "COMPLETED");
      expect(step5.status).toBe("COMPLETED");
    });

    it("should reject invalid jump directly from PENDING to COMPLETED", async () => {
      const order = await createOrder({
        customer_name: "Invalid Jump",
        channel: "Direct",
        items: [{ product_id: "prod-01", quantity: 1 }],
      });

      await expect(updateOrderStatus(order.id, "COMPLETED")).rejects.toThrow(
        /Transisi status tidak valid/
      );
    });
  });

  describe("4. Payment Updates & Filtering", () => {
    it("should update payment status to PAID and update paid_amount", async () => {
      const order = await createOrder({
        customer_name: "Rendy",
        channel: "Direct",
        items: [{ product_id: "prod-03", quantity: 1, unit_price: 125000 }],
      });

      expect(order.payment_status).toBe("UNPAID");

      const updated = await updateOrderPayment(order.id, "PAID");
      expect(updated.payment_status).toBe("PAID");
      expect(updated.paid_amount).toBe(125000);
    });

    it("should filter orders by channel, status, and search query", async () => {
      const shopeeOnly = await getOrders({ channel: "Shopee" });
      expect(shopeeOnly.length).toBe(1);
      expect(shopeeOnly[0].customer?.name).toBe("Mahput");

      const paidOnly = await getOrders({ paymentStatus: "PAID" });
      expect(paidOnly.length).toBe(2);

      const searched = await getOrders({ search: "Acil Ely" });
      expect(searched.length).toBe(1);
      expect(searched[0].customer?.name).toBe("Acil Ely");
    });
  });
});
