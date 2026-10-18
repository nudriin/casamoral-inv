import { describe, it, expect, beforeEach } from "vitest";
import { checkoutPosOrder, resetMemoryOrders } from "@/lib/services/orders-service";
import {
  getMaterials,
  resetMemoryMaterials,
  getPackagingMaterials,
} from "@/lib/services/materials-service";
import { getFinancialRecap } from "@/lib/services/recap-service";

describe("POS & Financial Recap Engine Tests", () => {
  beforeEach(() => {
    resetMemoryOrders();
    resetMemoryMaterials();
  });

  it("deducts packaging stock automatically upon POS checkout", async () => {
    const packagingList = await getPackagingMaterials();
    const boxItem = packagingList.find((m) => m.name.toLowerCase().includes("kardus"));
    expect(boxItem).toBeDefined();

    const initialStock = boxItem!.current_stock;
    expect(initialStock).toBeGreaterThan(0);

    // Perform POS Checkout with 1 pcs Kardus
    const result = await checkoutPosOrder({
      customer_name: "Bpk. Hendra Sukamara",
      customer_city: "Sukamara",
      channel: "Direct",
      items: [
        {
          product_id: "prod-02", // Lampu Ollie
          quantity: 1,
          raw_unit_price: 120000,
          raw_unit_hpp: 75000,
        },
      ],
      packaging_items: [
        {
          material_id: boxItem!.id,
          name: boxItem!.name,
          quantity: 1,
          unit_cost: boxItem!.cost_per_unit,
          unit_price: 0,
        },
      ],
      payment_method: "CASH",
    });

    expect(result.order).toBeDefined();
    expect(result.order.status).toBe("COMPLETED");
    expect(result.order.payment_status).toBe("PAID");

    // Verify stock of Kardus decreased by exactly 1
    const updatedMaterials = await getMaterials();
    const updatedBox = updatedMaterials.find((m) => m.id === boxItem!.id);
    expect(updatedBox!.current_stock).toBe(initialStock - 1);
  });

  it("calculates Shopee fee vs Direct fee correctly in POS checkout", async () => {
    // 1. Direct Order: Platform fee should be 0
    const directResult = await checkoutPosOrder({
      customer_name: "Walk-in Store",
      channel: "Direct",
      items: [
        {
          product_id: "prod-01",
          quantity: 1,
          raw_unit_price: 100000,
          raw_unit_hpp: 60000,
        },
      ],
      packaging_items: [],
      payment_method: "CASH",
    });

    expect(directResult.platformFee).toBe(0);
    // Net profit = 100.000 - 60.000 = 40.000
    expect(directResult.netProfit).toBe(40000);

    // 2. Shopee Order: Presisi Toko Casa Moral (9.5% Admin + Rp 1.250 Biaya Proses + 0.5% PPh 22)
    // For 100.000: Admin 9.500 + Proses 1.250 + PPh 500 = 11.250 fee
    const shopeeResult = await checkoutPosOrder({
      customer_name: "Shopee Buyer",
      channel: "Shopee",
      items: [
        {
          product_id: "prod-01",
          quantity: 1,
          raw_unit_price: 100000,
          raw_unit_hpp: 60000,
        },
      ],
      packaging_items: [],
      payment_method: "SHOPEE_PAYOUT",
    });

    expect(shopeeResult.platformFee).toBe(11250);
    // Net profit = 100.000 - 60.000 - 11.250 = 28.750
    expect(shopeeResult.netProfit).toBe(28750);

    // 3. Shopee Order Rp 130.000 (Model Ollie):
    // Admin (9.5%): 12.350
    // Biaya Proses: 1.250
    // Pajak PPh 22 (0.5%): 650
    // Total Potongan Platform: 14.250
    // Uang Bersih Riil: 130.000 - 14.250 = 115.750!
    const ollieShopee = await checkoutPosOrder({
      customer_name: "Pembeli Shopee Ollie",
      channel: "Shopee",
      items: [
        {
          product_id: "prod-02",
          quantity: 1,
          raw_unit_price: 130000,
          raw_unit_hpp: 80000,
        },
      ],
      packaging_items: [],
      payment_method: "SHOPEE_PAYOUT",
    });

    expect(ollieShopee.platformFee).toBe(14250);
    // Net realized revenue after marketplace fees:
    const netRealized = ollieShopee.order.total_amount - ollieShopee.platformFee;
    expect(netRealized).toBe(115750);
  });

  it("generates financial recap with accurate modal and net profit breakdown", async () => {
    // Execute a direct POS sale with custom packaging
    await checkoutPosOrder({
      customer_name: "Pelanggan Rekap",
      channel: "Direct",
      items: [
        {
          product_id: "prod-02",
          quantity: 2,
          raw_unit_price: 120000,
          raw_unit_hpp: 70000, // 2 x 70k = 140k modal raw
        },
      ],
      packaging_items: [
        {
          material_id: "mat-06",
          name: "Kardus Kemasan Karton 20x20x20",
          quantity: 2,
          unit_cost: 4500, // 2 x 4.5k = 9k modal box
          unit_price: 0,
        },
      ],
      payment_method: "TRANSFER",
      paid_amount: 240000,
    });

    const recap = await getFinancialRecap({ period: "ALL" });
    expect(recap.totalOrdersCount).toBeGreaterThanOrEqual(1);

    // Check that recap has grossRevenue, netRealizedRevenue, totalHpp, and netProfit
    expect(recap.grossRevenue).toBeGreaterThan(0);
    expect(recap.netRealizedRevenue).toBeGreaterThan(0);
    expect(recap.totalCogs).toBeGreaterThan(0);
    expect(recap.grossProfit).toBeCloseTo(recap.netRevenue - recap.totalCogs, 2);

    // Find the newly checked-out order row in the recap
    const targetRow = recap.orders.find((o) => o.customerName === "Pelanggan Rekap");
    expect(targetRow).toBeDefined();
    expect(targetRow!.totalAmount).toBe(240000);
    expect(targetRow!.netRealizedRevenue).toBe(240000);
    expect(targetRow!.rawProductHpp).toBe(140000);
    expect(targetRow!.packagingHpp).toBe(9000);
    expect(targetRow!.totalHpp).toBe(149000);
    expect(targetRow!.netProfit).toBe(240000 - 149000); // 91.000
    expect(targetRow!.paymentStatus).toBe("PAID");

    // Check Shopee row has netRealizedRevenue deducted by platformFee
    const shopeeRow = recap.orders.find((o) => o.channel === "Shopee");
    expect(shopeeRow).toBeDefined();
    expect(shopeeRow!.netRealizedRevenue).toBe(shopeeRow!.totalAmount - shopeeRow!.platformFee);
  });
});
