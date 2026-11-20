import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderPayment,
  updateOrder,
  getOrderSummaryStats,
  deleteOrder,
  resetMemoryOrders,
  isValidStatusTransition,
} from "../src/lib/services/orders-service";
import { getPayments, createPayment, resetMemoryPayments } from "../src/lib/services/payments-service";

describe("Sprint 4 — Order and Production Management Tests", () => {
  beforeEach(() => {
    resetMemoryOrders(true);
    resetMemoryPayments(true);
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

    it("should compute TikTok Shop platform fee accurately (8.0% komisi + Rp 1.250 proses + 0.5% PPh 22)", async () => {
      const tiktokOrder = await createOrder({
        customer_name: "TikTok Buyer Jakarta",
        channel: "TikTokShop",
        items: [
          {
            product_id: "prod-02", // Ollie (Rp 130.000)
            quantity: 1,
            unit_price: 130000,
          },
        ],
      });

      // Total = 130.000
      // 8.0% Komisi = 10.400
      // Rp 1.250 Biaya Proses
      // 0.5% PPh 22 = 650
      // Total Fee = 12.300
      expect(tiktokOrder.total_amount).toBe(130000);
      expect(tiktokOrder.platform_fee).toBe(12300);
      expect(tiktokOrder.channel).toBe("TikTokShop");
    });

    it("should compute Tokopedia platform fee accurately (8.0% layanan + Rp 1.250 proses + 0.5% PPh 22)", async () => {
      const tokpedOrder = await createOrder({
        customer_name: "Tokopedia Buyer Bandung",
        channel: "Tokopedia",
        items: [
          {
            product_id: "prod-02", // Ollie (Rp 130.000)
            quantity: 1,
            unit_price: 130000,
          },
        ],
      });

      // Total = 130.000
      // Total Fee = 8.5% * 130.000 + 1.250 = 11.050 + 1.250 = 12.300
      expect(tokpedOrder.total_amount).toBe(130000);
      expect(tokpedOrder.platform_fee).toBe(12300);
      expect(tokpedOrder.channel).toBe("Tokopedia");
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

  describe("5. Comprehensive Transaction Editing (updateOrder)", () => {
    it("should allow editing customer, channel, model, add-on, status, and payment", async () => {
      // 1. Create a initial order
      const initial = await createOrder({
        customer_name: "Budi Santoso",
        customer_city: "Sukamara",
        channel: "Direct",
        items: [
          {
            product_id: "prod-02",
            quantity: 1,
            unit_price: 130000,
          },
        ],
      });

      expect(initial.customer?.name).toBe("Budi Santoso");
      expect(initial.status).toBe("PENDING");
      expect(initial.total_amount).toBe(130000);
      expect(initial.channel).toBe("Direct");

      // 2. Comprehensive edit: change customer, city, add add-on, change channel to Shopee, set status to COMPLETED, set payment to PAID
      const edited = await updateOrder({
        order_id: initial.id,
        customer_name: "Budi Santoso (Updated)",
        customer_city: "Palangka Raya",
        channel: "Shopee",
        status: "COMPLETED",
        items: [
          {
            product_id: "prod-02",
            quantity: 1,
            unit_price: 130000,
            color_details: "Base Hitam + Shade Emas",
            add_on_name: "Figur Khusus",
            add_on_price: 25000,
          },
        ],
        shipping_cost: 10000,
        discount_amount: 5000,
        paid_amount: 160000,
        payment_status: "PAID",
        notes: "Pengiriman cepat via J&T",
      });

      // Verify customer updates
      expect(edited.customer?.name).toBe("Budi Santoso (Updated)");
      expect(edited.customer?.city).toBe("Palangka Raya");

      // Verify channel and status updates
      expect(edited.channel).toBe("Shopee");
      expect(edited.status).toBe("COMPLETED");

      // Verify financial recalculations:
      // Subtotal = 130.000 + 25.000 = 155.000
      // Total amount = 155.000 + 10.000 (ongkir) - 5.000 (diskon) = 160.000
      expect(edited.subtotal_amount).toBe(130000);
      expect(edited.add_on_amount).toBe(25000);
      expect(edited.shipping_cost).toBe(10000);
      expect(edited.discount_amount).toBe(5000);
      expect(edited.total_amount).toBe(160000);

      // Verify item updates
      expect(edited.items?.length).toBe(1);
      expect(edited.items?.[0].color_details).toBe("Base Hitam + Shade Emas");
      expect(edited.items?.[0].add_on_name).toBe("Figur Khusus");
      expect(edited.items?.[0].add_on_price).toBe(25000);

      // Verify payment updates
      expect(edited.payment_status).toBe("PAID");
      expect(edited.paid_amount).toBe(160000);

      // Verify Shopee platform fee calculation on Rp 160.000:
      // 9.5% (15.200) + 1.250 + 0.5% (800) = 17.250
      expect(edited.platform_fee).toBe(17250);

      // Verify notes
      expect(edited.notes).toBe("Pengiriman cepat via J&T");
    });

    it("should allow creating an order for Lumi without Cap and with custom city Palangka Raya", async () => {
      const lumiOrder = await createOrder({
        customer_name: "Rian Palangka",
        customer_city: "Palangka Raya",
        channel: "Direct",
        items: [
          {
            product_id: "prod-01", // Lumi
            quantity: 1,
            unit_price: 130000,
            color_details: "Base Hitam + Shade Putih", // No cap
          },
        ],
        payment_status: "PAID",
        paid_amount: 130000,
      });

      expect(lumiOrder.customer?.city).toBe("Palangka Raya");
      expect(lumiOrder.channel).toBe("Direct");
      expect(lumiOrder.items?.[0].color_details).not.toContain("Cap");
      expect(lumiOrder.platform_fee).toBe(0); // Direct channel fee is 0
    });
  });

  describe("7. Transaction Deletion & Financial Recalculation", () => {
    it("should delete an order and automatically recalculate total revenue, cash, and receivables", async () => {
      // Baseline before creating test order
      const initialStats = await getOrderSummaryStats();
      const initialOrders = await getOrders();
      expect(initialStats.totalOrders).toBe(9);
      expect(initialStats.totalRevenue).toBe(945000);
      expect(initialStats.totalPaid).toBe(290000);
      expect(initialStats.totalReceivables).toBe(655000);

      // Create a new order: Rp 150.000 with DP Rp 50.000 (Piutang: Rp 100.000)
      const order = await createOrder({
        customer_name: "Pelanggan Tes Hapus",
        customer_city: "Jakarta",
        channel: "Direct",
        items: [
          {
            product_id: "prod-02",
            quantity: 1,
            unit_price: 150000,
            color_details: "Base Hitam + Shade Putih + Cap Oren",
          },
        ],
        payment_status: "PARTIALLY_PAID",
        paid_amount: 50000,
      });

      // Verify stats increased
      const afterCreateStats = await getOrderSummaryStats();
      expect(afterCreateStats.totalOrders).toBe(10);
      expect(afterCreateStats.totalRevenue).toBe(945000 + 150000); // 1.095.000
      expect(afterCreateStats.totalPaid).toBe(290000 + 50000);     // 340.000
      expect(afterCreateStats.totalReceivables).toBe(655000 + 100000); // 755.000

      // Also record an explicit payment for this order
      await createPayment({
        order_id: order.id,
        amount: 50000,
        payment_method: "TRANSFER",
        notes: "DP Pelanggan Tes",
      });

      const paymentsBefore = await getPayments({ order_id: order.id });
      expect(paymentsBefore.length).toBeGreaterThanOrEqual(1);

      // Now DELETE the order
      const deleteResult = await deleteOrder(order.id);
      expect(deleteResult.deleted).toBe(true);
      expect(deleteResult.id).toBe(order.id);

      // Verify order is gone
      const deletedLookup = await getOrderById(order.id);
      expect(deletedLookup).toBeNull();

      // Verify associated payments are wiped
      const paymentsAfter = await getPayments({ order_id: order.id });
      expect(paymentsAfter.length).toBe(0);

      // Verify financial metrics reset exactly back to initial values
      const afterDeleteStats = await getOrderSummaryStats();
      expect(afterDeleteStats.totalOrders).toBe(9);
      expect(afterDeleteStats.totalRevenue).toBe(945000);
      expect(afterDeleteStats.totalPaid).toBe(290000);
      expect(afterDeleteStats.totalReceivables).toBe(655000);

      // Verify orders list does not contain deleted order
      const finalOrders = await getOrders();
      expect(finalOrders.length).toBe(9);
      expect(finalOrders.some((o) => o.id === order.id)).toBe(false);
    });

    it("should throw an error when attempting to delete a non-existent order", async () => {
      await expect(deleteOrder("non-existent-order-id")).rejects.toThrow(
        'Pesanan dengan ID atau nomor "non-existent-order-id" tidak ditemukan.'
      );
    });
  });
});
