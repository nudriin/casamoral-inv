import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrders,
  getOrderSummaryStats,
  resetMemoryOrders,
} from "@/lib/services/orders-service";
import {
  getPayments,
  getReceivablesSummary,
  resetMemoryPayments,
} from "@/lib/services/payments-service";
import { getMaterials, resetMemoryMaterials } from "@/lib/services/materials-service";
import { formatModelName } from "@/lib/utils";

describe("Updated Store Orders Integration Tests (Shopee Released + Pending + Offline)", () => {
  beforeEach(() => {
    resetMemoryOrders(false);
    resetMemoryPayments(false);
    resetMemoryMaterials(true);
  });

  it("reconciles all 24 consolidated orders totaling Rp 3.595.000 gross", async () => {
    const orders = await getOrders();
    expect(orders).toHaveLength(24);

    const totalVolume = orders.reduce((sum, o) => sum + o.total_amount, 0);
    expect(totalVolume).toBe(3595000);
  });

  it("verifies offline orders (Ragil, Bang Aryadi, Rafi, Ka Lely) and Shopee released orders", async () => {
    const orders = await getOrders();

    const ragil = orders.find((o) => o.customer?.name === "Ragil");
    expect(ragil).toBeDefined();
    expect(ragil?.total_amount).toBe(100000);
    expect(ragil?.channel).toBe("Direct");
    expect(ragil?.payment_status).toBe("PAID");

    const rafi = orders.find((o) => o.customer?.name === "Rafi");
    expect(rafi).toBeDefined();
    expect(rafi?.total_amount).toBe(200000);
    expect(rafi?.items?.[0].quantity).toBe(2);

    const sahal = orders.find((o) => o.order_number === "261023DKHP29YV");
    expect(sahal).toBeDefined();
    expect(sahal?.total_amount).toBe(140000);
    expect(sahal?.platform_fee).toBe(24350);
    expect(sahal?.paid_amount).toBe(115650);

    const aryadi = orders.find((o) => o.customer?.name === "Bang Aryadi");
    expect(aryadi).toBeDefined();
    expect(aryadi?.total_amount).toBe(150000);

    const tutoke = orders.find((o) => o.order_number === "261024EUPKQUKF");
    expect(tutoke).toBeDefined();
    expect(tutoke?.total_amount).toBe(150000);
    expect(tutoke?.platform_fee).toBe(26000);
    expect(tutoke?.paid_amount).toBe(124000);
  });

  it("verifies Gress (261022A3BA1PSG) and Mahput (26101800YXKBTY) are PAID via Shopee without duplication", async () => {
    const orders = await getOrders();
    const gressMatches = orders.filter((o) => o.customer?.name.includes("Gress"));
    const mahputMatches = orders.filter((o) => o.customer?.name.includes("Mahput"));

    expect(gressMatches).toHaveLength(1);
    expect(gressMatches[0].payment_status).toBe("PAID");
    expect(gressMatches[0].paid_amount).toBe(94775);

    expect(mahputMatches).toHaveLength(1);
    expect(mahputMatches[0].payment_status).toBe("PAID");
    expect(mahputMatches[0].paid_amount).toBe(115750);
  });

  it("verifies realized cash received totals Rp 2.076.311 from 16 paid transactions", async () => {
    const payments = await getPayments();
    expect(payments).toHaveLength(16);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    expect(totalPaid).toBe(2076311);

    const stats = await getOrderSummaryStats();
    expect(stats.totalPaid).toBe(2076311);
  });

  it("verifies remaining receivables & pending Shopee total Rp 1.116.500 across 6 unpaid orders", async () => {
    const recSummary = await getReceivablesSummary();
    expect(recSummary.totalReceivables).toBe(1116500);
    expect(recSummary.totalReceivableOrdersCount).toBe(6); // 2 Offline unpaid (280k) + 4 Shopee pending (836.5k)
  });

  it("verifies net revenue calculation after Shopee platform fees (Rp 402.189)", async () => {
    const orders = await getOrders();
    const grossTotal = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const platformFeesTotal = orders.reduce((sum, o) => sum + (o.platform_fee || 0), 0);
    const netRevenue = grossTotal - platformFeesTotal;

    expect(grossTotal).toBe(3595000);
    expect(platformFeesTotal).toBe(402189);
    expect(netRevenue).toBe(3192811);
  });

  it("verifies all order items display specific model names (Ollie, Pomi, Lyra, etc.)", async () => {
    const orders = await getOrders();
    const ord01 = orders.find((o) => o.order_number === "ORD-OFF-001");
    expect(ord01).toBeDefined();
    expect(formatModelName(ord01?.items?.[0])).toBe("Ollie");

    const ord09 = orders.find((o) => o.order_number === "ORD-OFF-009");
    expect(ord09).toBeDefined();
    expect(formatModelName(ord09?.items?.[0])).toBe("Lyra");
  });

  it("verifies unpurchased Sticker Label / Branding Casa Moral has been removed from inventory", async () => {
    const materials = await getMaterials();
    const sticker = materials.find((m) => m.name.toLowerCase().includes("sticker"));
    expect(sticker).toBeUndefined();
  });
});
