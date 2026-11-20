import { describe, it, expect, beforeEach } from "vitest";
import {
  ALL_ORDERS,
  ALL_PAYMENTS,
  ALL_PRODUCTS,
  INITIAL_ORDERS,
  STORE_ORDERS,
  INITIAL_PAYMENTS,
  STORE_PAYMENTS,
} from "@/lib/data/initial-data";
import { calculateStandardHpp } from "@/lib/financial/hpp-calculator";
import { getReceivablesSummary, getPayments, resetMemoryPayments } from "@/lib/services/payments-service";
import { getExecutiveDashboardMetrics, getProfitLossStatement, getCashFlowStatement } from "@/lib/services/reports-service";
import { resetMemoryOrders } from "@/lib/services/orders-service";
import { resetMemoryExpenses } from "@/lib/services/expenses-service";

describe("Consolidated Sales & Income Reconciliation (Shopee Released + Shopee Pending + Offline)", () => {
  beforeEach(() => {
    resetMemoryOrders(false);
    resetMemoryPayments(false);
    resetMemoryExpenses(false);
  });

  it("verifies Lyra product (prod-06) BOM and Standard HPP = Rp 96.237,12", () => {
    const lyra = ALL_PRODUCTS.find((p) => p.id === "prod-06");
    expect(lyra).toBeDefined();
    expect(lyra?.name).toContain("Lyra");
    expect(lyra?.bom.shadeGram).toBe(94.52);
    expect(lyra?.bom.baseGram).toBe(133.35);
    expect(lyra?.bom.capGram).toBe(5.45);
    expect(lyra?.bom.totalFilamentGram).toBe(233.32);

    const hpp = calculateStandardHpp({ filamentGram: 233.32 });
    expect(hpp.totalHpp).toBe(96237.12);
    expect(lyra?.current_hpp).toBe(96237.12);
  });

  it("verifies 24 consolidated orders (27 units) with zero duplicates and Istri Om Ridwan removed", () => {
    expect(ALL_ORDERS).toHaveLength(24);
    expect(INITIAL_ORDERS).toHaveLength(10); // 10 Offline Murni
    expect(STORE_ORDERS).toHaveLength(14);   // 10 Shopee Dilepas + 4 Shopee Pending

    const totalUnits = ALL_ORDERS.reduce(
      (sum, o) => sum + (o.items?.reduce((s, it) => s + it.quantity, 0) || 0),
      0
    );
    expect(totalUnits).toBe(27);

    // No duplicate order numbers
    const orderNumbers = ALL_ORDERS.map((o) => o.order_number);
    expect(new Set(orderNumbers).size).toBe(24);

    // Istri Om Ridwan removed
    expect(ALL_ORDERS.find((o) => o.customer?.name.includes("Ridwan"))).toBeUndefined();
  });

  it("reconciles Shopee Sudah Dilepas (10 orders): Rp 1.485.000 gross, Rp 248.689 fee, Rp 1.236.311 net", () => {
    const released = STORE_ORDERS.filter((o) => o.payment_status === "PAID");
    expect(released).toHaveLength(10);

    const gross = released.reduce((s, o) => s + o.total_amount, 0);
    const fee = released.reduce((s, o) => s + o.platform_fee, 0);
    const paid = released.reduce((s, o) => s + o.paid_amount, 0);

    expect(gross).toBe(1485000);
    expect(fee).toBe(248689);
    expect(paid).toBe(1236311);
    expect(gross - fee).toBe(paid);

    const shpPaymentsTotal = STORE_PAYMENTS.reduce((s, p) => s + p.amount, 0);
    expect(shpPaymentsTotal).toBe(1236311);
  });

  it("reconciles Shopee Pending (4 orders, 6 units): Rp 990.000 gross, Rp 153.500 fee, Rp 836.500 net pending", () => {
    const pending = STORE_ORDERS.filter((o) => o.payment_status === "UNPAID");
    expect(pending).toHaveLength(4);

    const gross = pending.reduce((s, o) => s + o.total_amount, 0);
    const fee = pending.reduce((s, o) => s + o.platform_fee, 0);
    const netPending = gross - fee;

    expect(gross).toBe(990000);
    expect(fee).toBe(153500);
    expect(netPending).toBe(836500);

    // Verify order 261120RA6KUH4H has 2+1=3 units Lyra
    const lyraOrder = pending.find((o) => o.order_number === "261120RA6KUH4H");
    expect(lyraOrder?.items).toHaveLength(2);
    expect(lyraOrder?.total_amount).toBe(570000);
    expect(lyraOrder?.total_amount! - lyraOrder?.platform_fee!).toBe(483250);
  });

  it("reconciles Offline Murni (10 orders, 11 units): Rp 1.120.000 total, Rp 840.000 lunas, Rp 280.000 piutang", () => {
    const totalOffline = INITIAL_ORDERS.reduce((s, o) => s + o.total_amount, 0);
    const paidOffline = INITIAL_ORDERS.reduce((s, o) => s + o.paid_amount, 0);
    const paymentsOffline = INITIAL_PAYMENTS.reduce((s, p) => s + p.amount, 0);

    expect(totalOffline).toBe(1120000);
    expect(paidOffline).toBe(840000);
    expect(paymentsOffline).toBe(840000);
    expect(totalOffline - paidOffline).toBe(280000);
  });

  it("reconciles Dashboard, Receivables, Profit & Loss, and Cash Flow with zero double counting", async () => {
    const payments = await getPayments();
    const totalPayments = payments.reduce((s, p) => s + p.amount, 0);
    expect(ALL_PAYMENTS).toHaveLength(16);
    expect(totalPayments).toBe(2076311); // 1.236.311 + 840.000

    const receivables = await getReceivablesSummary();
    // 2 Offline unpaid (280.000) + 4 Shopee pending net (836.500) = 1.116.500
    expect(receivables.totalReceivableOrdersCount).toBe(6);
    expect(receivables.totalReceivables).toBe(1116500);

    const dash = await getExecutiveDashboardMetrics();
    expect(dash.kpis.grossRevenue).toBe(3595000); // 1.485.000 + 990.000 + 1.120.000
    expect(dash.kpis.totalCashReceived).toBe(2076311);
    expect(dash.kpis.totalReceivables).toBe(1116500);

    const pl = await getProfitLossStatement();
    expect(pl.grossRevenue).toBe(3595000);
    expect(pl.platformFees).toBe(402189); // 248.689 + 153.500
    expect(pl.netRevenue).toBe(3595000 - 402189); // 3.192.811

    const cf = await getCashFlowStatement();
    expect(cf.operatingInflows.customerPayments).toBe(2076311);
  });
});
