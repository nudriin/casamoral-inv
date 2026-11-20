import { describe, it, expect, beforeEach } from "vitest";
import {
  getMaterials,
  getMaterialById,
  adjustMaterialStock,
  getStockMovements,
  resetMemoryMaterials,
} from "@/lib/services/materials-service";
import {
  createOrder,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  resetMemoryOrders,
} from "@/lib/services/orders-service";

describe("Stock Opname (Penyesuaian Stok) & Checkout Automatic Deductions", () => {
  beforeEach(async () => {
    resetMemoryMaterials();
    resetMemoryOrders();
  });

  describe("Fitur Penyesuaian Stok (Stock Opname)", () => {
    it("successfully adjusts stock downward when physical stock is less than recorded (waste/loss)", async () => {
      const mat = await getMaterialById("mat-01");
      expect(mat).toBeDefined();
      const initialStock = mat!.current_stock; // 10000 grams

      const { material, movement, difference } = await adjustMaterialStock({
        material_id: "mat-01",
        physical_stock: 9820,
        reason: "Sisa Spul Habis Terpakai",
        notes: "Sisa spul filamen setelah kalibrasi nozzle",
      });

      expect(material.current_stock).toBe(9820);
      expect(difference).toBe(-180);
      expect(movement.movement_type).toBe("WASTE_ADJUSTMENT");
      expect(movement.quantity).toBe(-180);

      // Verify movement recorded in history
      const movements = await getStockMovements("mat-01");
      const lastMovement = movements[0];
      expect(lastMovement.movement_type).toBe("WASTE_ADJUSTMENT");
      expect(lastMovement.quantity).toBe(-180);
      expect(lastMovement.notes).toContain("Sisa spul filamen");
    });

    it("successfully adjusts stock upward when physical stock is more than recorded (found/correction)", async () => {
      const mat = await getMaterialById("mat-06"); // Kardus Kemasan Karton
      expect(mat).toBeDefined();
      const initialStock = mat!.current_stock; // 20 pcs

      const { material, movement, difference } = await adjustMaterialStock({
        material_id: "mat-06",
        physical_stock: 25,
        reason: "Penghitungan Ulang Fisik",
        notes: "Ditemukan 5 kardus tambahan di rak penyimpanan atas",
      });

      expect(material.current_stock).toBe(25);
      expect(difference).toBe(5);
      expect(movement.movement_type).toBe("MANUAL_CORRECTION");
      expect(movement.quantity).toBe(5);

      const movements = await getStockMovements("mat-06");
      const lastMovement = movements[0];
      expect(lastMovement.movement_type).toBe("MANUAL_CORRECTION");
      expect(lastMovement.quantity).toBe(5);
    });

    it("does not create movement if physical stock equals current recorded stock", async () => {
      const mat = await getMaterialById("mat-02");
      const movementsBefore = await getStockMovements("mat-02");

      const { material, movement, difference } = await adjustMaterialStock({
        material_id: "mat-02",
        physical_stock: mat!.current_stock,
        reason: "Pemeriksaan Rutin Sesuai",
      });

      expect(material.current_stock).toBe(mat!.current_stock);
      expect(difference).toBe(0);
      expect(movement).toBeNull();
      const movementsAfter = await getStockMovements("mat-02");
      expect(movementsAfter.length).toBe(movementsBefore.length);
    });
  });

  describe("Pengurangan Stok Otomatis Saat Checkout Pesanan (Model Ollie)", () => {
    it("deducts filament (based on model BOM) and packaging items on checkout", async () => {
      const filamentBefore = (await getMaterialById("mat-01"))!.current_stock; // 10,000g
      const bulbBefore = (await getMaterialById("mat-02"))!.current_stock; // 10 pcs
      const cableBefore = (await getMaterialById("mat-04"))!.current_stock; // 20 pcs
      const boxBefore = (await getMaterialById("mat-06"))!.current_stock; // 20 pcs
      const honeycombBefore = (await getMaterialById("mat-08"))!.current_stock; // 100 meters

      // Ollie BOM total: Shade 66.66g + Base 119.26g + Cap 17.16g = 203.08g
      const ollieGrammage = 203.08;
      const honeycombUsageMeters = 0.5; // 50 cm = 0.5 meter

      const newOrder = await createOrder({
        customer_name: "Budi Santoso",
        customer_phone: "081298765432",
        order_date: "2026-10-27T10:00:00Z",
        channel: "Shopee",
        status: "PENDING",
        payment_status: "UNPAID",
        items: [
          {
            product_id: "prod-01", // Ollie Lamp
            product_name: "Ollie",
            quantity: 1,
            unit_price: 155000,
            subtotal: 155000,
            filament_type: "PLA+",
            filament_color: "Dark Red & White",
          },
        ],
        subtotal: 155000,
        discount_amount: 0,
        shipping_cost: 0,
        total_amount: 155000,
        checkout_deductions: [
          {
            material_id: "mat-01",
            name: "Filamen PLA Basic Dark Red",
            quantity: ollieGrammage,
            unit: "gram",
          },
          {
            material_id: "mat-02",
            name: "Lampu LED Bulb Inlite 3W Warm White",
            quantity: 1,
            unit: "pcs",
          },
          {
            material_id: "mat-04",
            name: "Kabel Sakelar On/Off",
            quantity: 1,
            unit: "pcs",
          },
          {
            material_id: "mat-06",
            name: "Kardus Kemasan Karton 20x20x20",
            quantity: 1,
            unit: "pcs",
          },
          {
            material_id: "mat-08",
            name: "Kertas Packing Honeycomb 30cm",
            quantity: honeycombUsageMeters,
            unit: "meter",
          },
        ],
      });

      expect(newOrder.id).toBeDefined();

      // Check deducted stock levels
      const filamentAfter = (await getMaterialById("mat-01"))!.current_stock;
      const bulbAfter = (await getMaterialById("mat-02"))!.current_stock;
      const cableAfter = (await getMaterialById("mat-04"))!.current_stock;
      const boxAfter = (await getMaterialById("mat-06"))!.current_stock;
      const honeycombAfter = (await getMaterialById("mat-08"))!.current_stock;

      expect(filamentAfter).toBeCloseTo(filamentBefore - ollieGrammage, 2);
      expect(bulbAfter).toBe(bulbBefore - 1);
      expect(cableAfter).toBe(cableBefore - 1);
      expect(boxAfter).toBe(boxBefore - 1);
      expect(honeycombAfter).toBeCloseTo(honeycombBefore - honeycombUsageMeters, 2);

      // Verify movements have reference_id set to the order ID
      const filamentMovements = await getStockMovements("mat-01");
      const orderFilamentMovement = filamentMovements.find(
        (m) => m.reference_id === newOrder.id && m.movement_type === "PRODUCTION_USAGE"
      );
      expect(orderFilamentMovement).toBeDefined();
      expect(orderFilamentMovement?.quantity).toBeCloseTo(-ollieGrammage, 2);
    });

    it("restores all deducted stock when an order is CANCELLED", async () => {
      const filamentBefore = (await getMaterialById("mat-01"))!.current_stock;
      const boxBefore = (await getMaterialById("mat-06"))!.current_stock;

      const order = await createOrder({
        customer_name: "Rini Melati",
        customer_phone: "081234567890",
        order_date: "2026-10-27T11:00:00Z",
        channel: "TikTokShop",
        status: "PENDING",
        payment_status: "UNPAID",
        items: [
          {
            product_id: "prod-01",
            product_name: "Ollie",
            quantity: 1,
            unit_price: 155000,
            subtotal: 155000,
          },
        ],
        subtotal: 155000,
        discount_amount: 0,
        shipping_cost: 0,
        total_amount: 155000,
        checkout_deductions: [
          {
            material_id: "mat-01",
            name: "Filamen PLA Basic Dark Red",
            quantity: 203.08,
            unit: "gram",
          },
          {
            material_id: "mat-06",
            name: "Kardus 20x20x20",
            quantity: 1,
            unit: "pcs",
          },
        ],
      });

      // Confirm stock was deducted
      expect((await getMaterialById("mat-01"))!.current_stock).toBeCloseTo(filamentBefore - 203.08, 2);
      expect((await getMaterialById("mat-06"))!.current_stock).toBe(boxBefore - 1);

      // Cancel the order
      await updateOrderStatus(order.id, "CANCELLED");

      // Verify stock is restored
      const filamentRestored = (await getMaterialById("mat-01"))!.current_stock;
      const boxRestored = (await getMaterialById("mat-06"))!.current_stock;

      expect(filamentRestored).toBeCloseTo(filamentBefore, 2);
      expect(boxRestored).toBe(boxBefore);

      // Verify RETURN movements recorded
      const movements = await getStockMovements("mat-01");
      const returnMov = movements.find(
        (m) => m.reference_id === order.id && m.movement_type === "RETURN"
      );
      expect(returnMov).toBeDefined();
      expect(returnMov?.quantity).toBeCloseTo(203.08, 2);
    });

    it("restores all deducted stock when an order is DELETED", async () => {
      const bulbBefore = (await getMaterialById("mat-02"))!.current_stock;

      const order = await createOrder({
        customer_name: "Test Delete",
        customer_phone: "0811111111",
        order_date: "2026-10-27T12:00:00Z",
        channel: "WhatsApp",
        status: "PENDING",
        payment_status: "UNPAID",
        items: [
          {
            product_id: "prod-01",
            product_name: "Ollie",
            quantity: 1,
            unit_price: 155000,
            subtotal: 155000,
          },
        ],
        subtotal: 155000,
        discount_amount: 0,
        shipping_cost: 0,
        total_amount: 155000,
        checkout_deductions: [
          {
            material_id: "mat-02",
            name: "Lampu LED 3W",
            quantity: 2,
            unit: "pcs",
          },
        ],
      });

      expect((await getMaterialById("mat-02"))!.current_stock).toBe(bulbBefore - 2);

      // Delete the order
      await deleteOrder(order.id);

      // Verify stock is restored
      expect((await getMaterialById("mat-02"))!.current_stock).toBe(bulbBefore);
    });
  });
});
