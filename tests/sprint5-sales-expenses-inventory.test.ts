import { describe, it, expect, beforeEach } from "vitest";
import {
  getPayments,
  createPayment,
  getReceivablesSummary,
  resetMemoryPayments,
} from "../src/lib/services/payments-service";
import {
  createExpense,
  getExpensesSummary,
  resetMemoryExpenses,
} from "../src/lib/services/expenses-service";
import {
  getMaterials,
  getStockMovements,
  resetMemoryMaterials,
} from "../src/lib/services/materials-service";
import {
  getOrderById,
  createOrder,
  updateOrderStatus,
  resetMemoryOrders,
} from "../src/lib/services/orders-service";

describe("Sprint 5 — Sales, Expenses, and Inventory Management Tests", () => {
  beforeEach(() => {
    resetMemoryOrders(true);
    resetMemoryPayments(true);
    resetMemoryExpenses(false);
    resetMemoryMaterials(true);
  });

  describe("1. Receivables (Piutang) & Initial Balance Verification", () => {
    it("should accurately reflect Rp 280.000 in offline receivables across 2 unpaid orders", async () => {
      const summary = await getReceivablesSummary();
      expect(summary.totalReceivables).toBe(280000);
      expect(summary.totalReceivableOrdersCount).toBe(2);

      const acilEly = summary.items.find((i) => i.customerName === "Acil Ely");
      expect(acilEly?.remainingAmount).toBe(130000);

      const pomiR10 = summary.items.find((i) => i.customerName.includes("Pelanggan Umum"));
      expect(pomiR10?.remainingAmount).toBe(150000);
    });

    it("should verify verified offline cash receipts of Rp 840.000 across 6 paid orders", async () => {
      const payments = await getPayments();
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

      expect(totalPaid).toBe(840000);
      expect(payments.length).toBe(6);

      const wahyuPay = payments.find((p) => p.order_id === "ord-05");
      expect(wahyuPay?.amount).toBe(160000);
      expect(wahyuPay?.payment_method).toBe("TRANSFER");

      const mamaPay = payments.find((p) => p.order_id === "ord-06");
      expect(mamaPay?.amount).toBe(130000);
      expect(mamaPay?.payment_method).toBe("CASH");
    });
  });

  describe("2. Payment Transactions & Multi-Stage Settlement (DP)", () => {
    it("should process a down payment (DP) and transition status to PARTIALLY_PAID", async () => {
      // Acil Ely order is ord-01 with total 130.000
      const payment1 = await createPayment({
        order_id: "ord-01",
        amount: 50000,
        payment_method: "TRANSFER",
        reference_number: "TF-DP01",
        notes: "Uang muka DP 50.000 via Transfer",
      });

      expect(payment1.id).toBeDefined();
      expect(payment1.amount).toBe(50000);

      const updatedOrder = await getOrderById("ord-01");
      expect(updatedOrder?.payment_status).toBe("PARTIALLY_PAID");
      expect(updatedOrder?.paid_amount).toBe(50000);

      // Remaining receivables should decrease by 50.000
      const recSummary = await getReceivablesSummary();
      expect(recSummary.totalReceivables).toBe(230000); // 280k - 50k
    });

    it("should settle remaining balance and transition status to PAID", async () => {
      // Step 1: Pay DP 50.000
      await createPayment({
        order_id: "ord-01",
        amount: 50000,
        payment_method: "TRANSFER",
      });

      // Step 2: Pay Remaining 80.000
      await createPayment({
        order_id: "ord-01",
        amount: 80000,
        payment_method: "TRANSFER",
        reference_number: "TF-PELUNASAN-01",
        notes: "Pelunasan sisa tagihan 80.000",
      });

      const updatedOrder = await getOrderById("ord-01");
      expect(updatedOrder?.payment_status).toBe("PAID");
      expect(updatedOrder?.paid_amount).toBe(130000);

      const recSummary = await getReceivablesSummary();
      expect(recSummary.totalReceivables).toBe(150000); // 280k - 130k
      expect(recSummary.totalReceivableOrdersCount).toBe(1); // 1 order remaining
    });

    it("should reject payment with zero or negative amount", async () => {
      await expect(
        createPayment({
          order_id: "ord-01",
          amount: 0,
          payment_method: "CASH",
        })
      ).rejects.toThrow("Nominal pembayaran harus lebih besar dari Rp 0.");
    });
  });

  describe("3. Automated Inventory & BOM Stock Mutation Triggers", () => {
    it("should automatically deduct filament and components when order enters IN_PRODUCTION", async () => {
      // Initial filament stock is 10.000g, bulb is 10 pcs, fitting is 20 pcs
      const initialMaterials = await getMaterials();
      const initialFilament = initialMaterials.find((m) => m.id === "mat-01")?.current_stock || 0;
      const initialBulbs = initialMaterials.find((m) => m.id === "mat-02")?.current_stock || 0;
      const initialFittings = initialMaterials.find((m) => m.id === "mat-03")?.current_stock || 0;

      expect(initialFilament).toBe(10000);
      expect(initialBulbs).toBe(10);
      expect(initialFittings).toBe(20);

      // Create new order for 1x Lumi (CM-LUMI-01: 166.40g filament, 1 bulb, 1 fitting)
      const order = await createOrder({
        customer_name: "Produksi Test",
        channel: "Direct",
        items: [{ product_id: "prod-01", quantity: 1 }],
      });

      // Progress order to IN_PRODUCTION
      await updateOrderStatus(order.id, "CONFIRMED");
      await updateOrderStatus(order.id, "IN_PRODUCTION");

      // Verify stock deducted
      const updatedMaterials = await getMaterials();
      const updatedFilament = updatedMaterials.find((m) => m.id === "mat-01")?.current_stock;
      const updatedBulbs = updatedMaterials.find((m) => m.id === "mat-02")?.current_stock;
      const updatedFittings = updatedMaterials.find((m) => m.id === "mat-03")?.current_stock;

      expect(updatedFilament).toBe(10000 - 166.4); // 9833.6g
      expect(updatedBulbs).toBe(9);
      expect(updatedFittings).toBe(19);

      // Verify stock movements recorded
      const movements = await getStockMovements();
      const orderMovements = movements.filter((m) => m.reference_id === order.id);
      expect(orderMovements.length).toBeGreaterThan(0);
      expect(orderMovements[0].movement_type).toBe("PRODUCTION_USAGE");
      expect(orderMovements.some((m) => m.quantity === -166.4)).toBe(true);
    });

    it("should automatically restore stock when an in-production order is CANCELLED", async () => {
      const order = await createOrder({
        customer_name: "Batal Test",
        channel: "Direct",
        items: [{ product_id: "prod-01", quantity: 1 }],
      });

      await updateOrderStatus(order.id, "CONFIRMED");
      await updateOrderStatus(order.id, "IN_PRODUCTION");

      // Stock has been deducted
      const inProdMaterials = await getMaterials();
      expect(inProdMaterials.find((m) => m.id === "mat-01")?.current_stock).toBe(9833.6);

      // Now cancel the order
      await updateOrderStatus(order.id, "CANCELLED");

      // Stock must be restored back to 10.000g
      const restoredMaterials = await getMaterials();
      expect(restoredMaterials.find((m) => m.id === "mat-01")?.current_stock).toBe(10000);
      expect(restoredMaterials.find((m) => m.id === "mat-02")?.current_stock).toBe(10);
      expect(restoredMaterials.find((m) => m.id === "mat-03")?.current_stock).toBe(20);

      // Verify return movement logged
      const movements = await getStockMovements();
      const returnMovs = movements.filter(
        (m) => m.reference_id === order.id && m.movement_type === "RETURN"
      );
      expect(returnMovs.length).toBeGreaterThan(0);
    });
  });

  describe("4. Operational Expenses Management", () => {
    it("should accurately reflect CSV operational expenses of Rp 1.211.091 across 10 items", async () => {
      const summary = await getExpensesSummary();
      expect(summary.totalExpenses).toBe(1211091);
      expect(summary.fixedCostsTotal).toBe(1211091);
      expect(summary.variableCostsTotal).toBe(0);
      expect(summary.count).toBe(10);
    });

    it("should record a new operational expense and update summary", async () => {
      const newExp = await createExpense({
        expense_date: "2026-11-21",
        category_id: "exp-cat-01", // Ads
        description: "Shopee Search Ads & Iklan Produk Serupa",
        amount: 200000,
        payment_method: "TRANSFER",
        notes: "Optimasi kata kunci lampu ambient",
      });

      expect(newExp.id).toBeDefined();
      expect(newExp.amount).toBe(200000);

      const summary = await getExpensesSummary();
      expect(summary.totalExpenses).toBe(1411091); // 1.211.091 + 200k
      expect(summary.count).toBe(11);
    });

    it("should reject expense with non-positive amount", async () => {
      await expect(
        createExpense({
          expense_date: "2026-08-15",
          category_id: "exp-cat-01",
          description: "Biaya 0",
          amount: 0,
          payment_method: "CASH",
        })
      ).rejects.toThrow("Nominal pengeluaran harus lebih besar dari Rp 0.");
    });
  });
});
