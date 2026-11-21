import { describe, it, expect } from "vitest";
import {
  createCapitalPurchase,
  updateCapitalPurchase,
  deleteCapitalPurchase,
  getCapitalPurchases,
} from "@/lib/services/capital-service";

describe("Capital Purchases CRUD (with purchaseDate & storeLocation)", () => {
  it("creates, updates, and deletes a capital purchase with date and store location", async () => {
    const created = await createCapitalPurchase({
      name: "Kardus Packing 15x15x15",
      category: "KEMASAN",
      unitPrice: 1783,
      quantity: 10,
      serviceFee: 1000,
      purchaseDate: "2026-11-21",
      storeLocation: "Shopee",
    });

    expect(created.id).toBeDefined();
    expect(created.totalCost).toBe(18830);
    expect(created.purchaseDate).toBe("2026-11-21");
    expect(created.storeLocation).toBe("Shopee");

    const updated = await updateCapitalPurchase(created.id, {
      storeLocation: "Toko Offline Gemilang",
      purchaseDate: "2026-11-20",
      serviceFee: 0,
    });

    expect(updated?.storeLocation).toBe("Toko Offline Gemilang");
    expect(updated?.purchaseDate).toBe("2026-11-20");
    expect(updated?.totalCost).toBe(17830);

    const deleted = await deleteCapitalPurchase(created.id);
    expect(deleted).toBe(true);

    const all = await getCapitalPurchases();
    expect(all.find((p) => p.id === created.id)).toBeUndefined();
  });
});
