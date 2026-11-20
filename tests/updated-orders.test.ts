import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrders,
  getOrderSummaryStats,
  resetMemoryOrders,
} from "../src/lib/services/orders-service";
import {
  getPayments,
  getReceivablesSummary,
  resetMemoryPayments,
} from "../src/lib/services/payments-service";
import {
  getMaterials,
  resetMemoryMaterials,
} from "../src/lib/services/materials-service";
import {
  ALL_ORDERS,
  STORE_ORDERS,
  ALL_CUSTOMERS,
  ALL_PAYMENTS,
} from "../src/lib/data/initial-data";
import { formatModelName } from "../src/lib/utils";

describe("Updated Store Orders Integration Tests (Sheet: Orderan Casa Moral Terupdate)", () => {
  beforeEach(() => {
    resetMemoryOrders(false);
    resetMemoryPayments(false);
    resetMemoryMaterials(false);
  });

  it("reconciles all 13 orders totaling exactly Rp 1.485.000", async () => {
    const orders = await getOrders();
    expect(orders).toHaveLength(13);

    const totalVolume = orders.reduce((sum, o) => sum + o.total_amount, 0);
    expect(totalVolume).toBe(1485000);
  });

  it("verifies the 4 new orders (Rajjil, Sahal, Bang Aryadi, tutoke706)", async () => {
    const orders = await getOrders();

    // 1. Rajjil: Lumi, Rp 100.000, Direct, Palangka Raya (Pky)
    const rajjil = orders.find((o) => o.customer?.name === "Rajjil");
    expect(rajjil).toBeDefined();
    expect(rajjil?.total_amount).toBe(100000);
    expect(rajjil?.channel).toBe("Direct");
    expect(rajjil?.payment_status).toBe("PAID");
    expect(rajjil?.items?.[0]?.color_details).toBe("Base Oren + Shade Oren");

    // 2. Sahal: Nomi, Rp 140.000, Shopee, Depok (Uang bersih 115.650, fee 24.350)
    const sahal = orders.find((o) => o.customer?.name === "Sahal");
    expect(sahal).toBeDefined();
    expect(sahal?.total_amount).toBe(140000);
    expect(sahal?.channel).toBe("Shopee");
    expect(sahal?.platform_fee).toBe(24350);
    expect((sahal?.total_amount ?? 0) - (sahal?.platform_fee ?? 0)).toBe(115650);
    expect(sahal?.payment_status).toBe("PAID");
    expect(sahal?.items?.[0]?.color_details).toBe("Base Biru + Shade Putih + Cap Biru");

    // 3. Bang Aryadi: Ollie, Rp 150.000, Direct, Palangka Raya (Pky)
    const aryadi = orders.find((o) => o.customer?.name === "Bang Aryadi");
    expect(aryadi).toBeDefined();
    expect(aryadi?.total_amount).toBe(150000);
    expect(aryadi?.channel).toBe("Direct");
    expect(aryadi?.payment_status).toBe("PAID");
    expect(aryadi?.items?.[0]?.color_details).toBe("Base Pink + Shade Putih + Cap Pink");

    // 4. tutoke706: Ollie, Rp 150.000, Shopee, Bali (Uang bersih 124.000, fee 26.000)
    const tutoke = orders.find((o) => o.customer?.name === "tutoke706");
    expect(tutoke).toBeDefined();
    expect(tutoke?.total_amount).toBe(150000);
    expect(tutoke?.channel).toBe("Shopee");
    expect(tutoke?.platform_fee).toBe(26000);
    expect((tutoke?.total_amount ?? 0) - (tutoke?.platform_fee ?? 0)).toBe(124000);
    expect(tutoke?.payment_status).toBe("PAID");
    expect(tutoke?.items?.[0]?.color_details).toBe("Base Oren + Shade Putih + Cap Oren");
  });

  it("verifies Gress status is updated to LUNAS via Shopee", async () => {
    const orders = await getOrders();
    const gress = orders.find((o) => o.customer?.name === "Gress");

    expect(gress).toBeDefined();
    expect(gress?.channel).toBe("Shopee");
    expect(gress?.total_amount).toBe(115000);
    expect(gress?.platform_fee).toBe(20225);
    expect((gress?.total_amount ?? 0) - (gress?.platform_fee ?? 0)).toBe(94775);
    expect(gress?.payment_status).toBe("PAID");
    expect(gress?.paid_amount).toBe(115000);
  });

  it("verifies realized cash received totals Rp 945.000 from 7 paid orders", async () => {
    const payments = await getPayments();
    expect(payments.length).toBeGreaterThanOrEqual(7);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    expect(totalPaid).toBe(945000);

    const stats = await getOrderSummaryStats();
    expect(stats.totalPaid).toBe(945000);
  });

  it("verifies remaining receivables (piutang) total Rp 540.000 across 4 unpaid orders", async () => {
    const recSummary = await getReceivablesSummary();
    expect(recSummary.totalReceivables).toBe(540000);
    expect(recSummary.totalReceivableOrdersCount).toBe(6); // 4 unpaid + 2 sample orders Rp 0
    expect(recSummary.items.filter((i) => i.remainingAmount > 0)).toHaveLength(4);

    const mahput = recSummary.items.find((i) => i.customerName === "Mahput");
    const acilEly = recSummary.items.filter((i) => i.customerName === "Acil Ely");
    const istriOmRidwan = recSummary.items.find((i) => i.customerName === "Istri Om Ridwan");

    expect(mahput?.remainingAmount).toBe(130000);
    expect(acilEly.reduce((sum, i) => sum + i.remainingAmount, 0)).toBe(280000); // 130k Ollie + 150k Pomi
    expect(istriOmRidwan?.remainingAmount).toBe(130000);
  });

  it("verifies net revenue / uang bersih diterima calculation after Shopee admin fees", async () => {
    const orders = await getOrders();
    const grossTotal = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const platformFeesTotal = orders.reduce((sum, o) => sum + (o.platform_fee || 0), 0);
    const netRevenue = grossTotal - platformFeesTotal;

    expect(grossTotal).toBe(1485000);
    expect(platformFeesTotal).toBe(84825); // 14.250 + 20.225 + 24.350 + 26.000
    expect(netRevenue).toBe(1400175);
  });

  it("verifies all order items display specific model names (Ollie, Pomi, etc.) instead of generic Lampu Ambient", async () => {
    const orders = await getOrders();

    // ORD-2026-003 (Acil Ely) must be Ollie
    const ord03 = orders.find((o) => o.order_number === "ORD-2026-003");
    expect(ord03).toBeDefined();
    expect(formatModelName(ord03?.items?.[0])).toBe("Ollie");

    // ORD-2026-004 (Pelanggan Umum Sukamara) must be Pomi
    const ord04 = orders.find((o) => o.order_number === "ORD-2026-004");
    expect(ord04).toBeDefined();
    expect(formatModelName(ord04?.items?.[0])).toBe("Pomi");

    // ORD-2026-010 (Rajjil) must be Lumi
    const ord10 = orders.find((o) => o.order_number === "ORD-2026-010");
    expect(ord10).toBeDefined();
    expect(formatModelName(ord10?.items?.[0])).toBe("Lumi");

    // ORD-2026-011 (Sahal) must be Nomi
    const ord11 = orders.find((o) => o.order_number === "ORD-2026-011");
    expect(ord11).toBeDefined();
    expect(formatModelName(ord11?.items?.[0])).toBe("Nomi");

    // Every item across all 13 orders should resolve to a specific model name
    for (const order of orders) {
      for (const item of order.items || []) {
        const modelName = formatModelName(item);
        expect(modelName).not.toBe("Lampu Ambient");
        expect(["Ollie", "Pomi", "Lumi", "Kumo", "Nomi"]).toContain(modelName);
      }
    }
  });

  it("verifies unpurchased Sticker Label / Branding Casa Moral has been removed from inventory", async () => {
    const materials = await getMaterials();
    const sticker = materials.find((m) =>
      m.name.toLowerCase().includes("sticker") ||
      m.supplier?.toLowerCase().includes("percetakan vinyl")
    );
    expect(sticker).toBeUndefined();
    // Genuine materials include mat-08 (Kertas Packing Honeycomb 30cm x 50m) from pur-03
    const honeycomb = materials.find((m) => m.id === "mat-08");
    expect(honeycomb).toBeDefined();
    expect(honeycomb?.name).toContain("Honeycomb");
    expect(materials).toHaveLength(8);
  });
});

