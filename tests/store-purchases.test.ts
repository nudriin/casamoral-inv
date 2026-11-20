import { describe, it, expect } from "vitest";
import {
  STORE_PURCHASES,
  INITIAL_CAPITAL_PURCHASES,
  ALL_CAPITAL_PURCHASES,
  ALL_ASSETS,
  ALL_EXPENSES,
} from "@/lib/data/initial-data";
import { getCapitalSummary, getCapitalPurchases } from "@/lib/services/capital-service";
import { getExpenses } from "@/lib/services/expenses-service";

describe("Store Purchases & Moral Lab CSV Integration Tests", () => {
  it("reconciles the 23 store restock & tool purchase transactions (15 Oct - 20 Nov 2026) to Rp 3.265.377", () => {
    expect(STORE_PURCHASES).toHaveLength(23);

    const totalSum = STORE_PURCHASES.reduce((sum, item) => sum + item.totalCost, 0);
    expect(totalSum).toBe(3265377);
  });

  it("verifies Bambulab A1 Mini split (3.589.221 + 499.088 filaments = 4.088.309) and Anycubic Kobra X (5.870.800)", () => {
    const a1Mini = INITIAL_CAPITAL_PURCHASES.find((p) => p.id === "cap-01");
    expect(a1Mini?.totalCost).toBe(3589221);
    expect(a1Mini?.purchaseDate).toBe("2026-09-23");

    const bundleFilaments = INITIAL_CAPITAL_PURCHASES.filter((p) =>
      ["cap-02", "cap-03", "cap-04", "cap-05"].includes(p.id)
    );
    expect(bundleFilaments).toHaveLength(4);
    const bundleSum = bundleFilaments.reduce((sum, item) => sum + item.totalCost, 0);
    expect((a1Mini?.totalCost ?? 0) + bundleSum).toBe(4088309);

    const anycubic = INITIAL_CAPITAL_PURCHASES.find((p) => p.id === "cap-20");
    expect(anycubic?.totalCost).toBe(5870800);
    expect(anycubic?.purchaseDate).toBe("2026-10-14");
    expect(anycubic?.account).toBe("Shopeepay Later");
  });

  it("verifies zero duplication between capital purchases and operational expenses", async () => {
    const capitalPurchases = await getCapitalPurchases();
    const expenses = await getExpenses();

    // Canva Pro Lite is only in operational expenses, not capital
    expect(capitalPurchases.find((p) => p.name.includes("Canva"))).toBeUndefined();
    expect(expenses.find((e) => e.description.includes("Canva"))?.amount).toBe(35000);

    // Mr.DIY and Stempel are only in capital/tools, not duplicated in expenses
    expect(capitalPurchases.find((p) => p.name.includes("Mr.DIY"))?.totalCost).toBe(92000);
    expect(capitalPurchases.find((p) => p.name.includes("Stempel"))?.totalCost).toBe(75000);
    expect(expenses.find((e) => e.description.toLowerCase().includes("mr.diy"))).toBeUndefined();
    expect(expenses.find((e) => e.description.toLowerCase().includes("stempel"))).toBeUndefined();

    // Ad expenses are excluded from capital and included in expenses
    expect(capitalPurchases.find((p) => p.name.includes("Iklan"))).toBeUndefined();
    expect(expenses.find((e) => e.description.includes("Iklan Produk Shopee") && e.amount === 278500)).toBeDefined();
    expect(expenses.find((e) => e.description.includes("Promosi Video Tiktok") && e.amount === 65000)).toBeDefined();
    expect(expenses.find((e) => e.description.includes("Iklan Produk Shopee") && e.amount === 112000)).toBeDefined();
  });

  it("reconciles all capital purchases to exactly Rp 14.811.820 across 43 items", async () => {
    const summary = await getCapitalSummary();
    expect(ALL_CAPITAL_PURCHASES).toHaveLength(43);
    expect(summary.totalItems).toBe(43);
    expect(summary.totalCapital).toBe(14811820);

    const breakdownSum = summary.breakdown.reduce((sum, b) => sum + b.totalCost, 0);
    expect(breakdownSum).toBe(14811820);

    const expensesSum = ALL_EXPENSES.reduce((sum, e) => sum + e.amount, 0);
    expect(expensesSum).toBe(1211091);
    expect(summary.totalCapital + expensesSum).toBe(16022911);
  });

  it("verifies fixed assets additions include Meja Printer, Heat Gun, Dry Box, and Stempel with CSV dates", () => {
    expect(ALL_ASSETS).toHaveLength(8);
    const meja = ALL_ASSETS.find((a) => a.name.includes("Meja Printer"));
    const heatgun = ALL_ASSETS.find((a) => a.name.includes("Heat Gun"));
    const dryBox = ALL_ASSETS.find((a) => a.name.includes("Dry Box"));
    const stempel = ALL_ASSETS.find((a) => a.name.includes("Stempel"));

    expect(meja?.purchase_price).toBe(350000);
    expect(meja?.purchase_date).toBe("2026-10-15");
    expect(heatgun?.purchase_price).toBe(63000);
    expect(heatgun?.purchase_date).toBe("2026-10-17");
    expect(dryBox?.purchase_price).toBe(63000);
    expect(dryBox?.purchase_date).toBe("2026-10-19");
    expect(stempel?.purchase_price).toBe(75000);
    expect(stempel?.purchase_date).toBe("2026-10-20");
  });
});
