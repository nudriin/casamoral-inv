import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrderById,
  createOrder,
  updateOrderStatus,
  resetMemoryOrders,
} from "../src/lib/services/orders-service";
import {
  getMaterials,
  getStockMovements,
  resetMemoryMaterials,
} from "../src/lib/services/materials-service";
import {
  createPayment,
  getReceivablesSummary,
  resetMemoryPayments,
} from "../src/lib/services/payments-service";
import {
  getProfitLossStatement,
  getCashFlowStatement,
} from "../src/lib/services/reports-service";
import { calculateStandardHpp } from "../src/lib/financial/hpp-calculator";
import { calculatePriceFromMarkup } from "../src/lib/financial/pricing-calculator";

describe("Sprint 7 — End-to-End Integration & User Journey Verification", () => {
  beforeEach(() => {
    resetMemoryOrders(true);
    resetMemoryMaterials(true);
    resetMemoryPayments(true);
  });

  it("should successfully execute full end-to-end business lifecycle from materials to financial reports", async () => {
    // -------------------------------------------------------------
    // TAHAP 1: Audit Master Data Awal
    // -------------------------------------------------------------
    const initialMaterials = await getMaterials();
    const filamentMat = initialMaterials.find((m) => m.id === "mat-01");
    expect(filamentMat).toBeDefined();
    const startingStockFilament = filamentMat?.current_stock ?? 0;

    // -------------------------------------------------------------
    // TAHAP 2: Kalkulasi HPP & Harga Jual Produk Baru (Lumi Edisi Khusus)
    // -------------------------------------------------------------
    const hppResult = calculateStandardHpp({
      filamentGram: 200,
      filamentPricePerKg: 180000,
      electricalCost: 31700,
      packagingCost: 6000,
      overheadMultiplier: 1.2,
    });

    expect(hppResult.totalHpp).toBeGreaterThan(0);
    // (200/1000 * 180000 + 31700 + 6000) * 1.2 = (36000 + 37700) * 1.2 = 73700 * 1.2 = 88440
    expect(hppResult.totalHpp).toBe(88440);

    const sellingPrice = calculatePriceFromMarkup(hppResult.totalHpp, 50);
    expect(sellingPrice).toBe(132660);

    // -------------------------------------------------------------
    // TAHAP 3: Pembuatan Pesanan Pelanggan Baru dengan Kustomisasi & Add-On
    // -------------------------------------------------------------
    const newOrder = await createOrder({
      customer_name: "Budi Santoso",
      customer_phone: "081299887766",
      customer_city: "Palangka Raya",
      channel: "Direct",
      notes: "Pesanan custom edisi wisuda",
      items: [
        {
          product_id: "prod-01",
          quantity: 2,
          color_details: "Base Hitam + Shade Emas",
          add_on_name: "Grafir Nama Kayu Akrilik",
          add_on_price: 25000,
        },
      ],
    });

    expect(newOrder.id).toBeDefined();
    expect(newOrder.status).toBe("PENDING");
    expect(newOrder.payment_status).toBe("UNPAID");
    expect(newOrder.paid_amount).toBe(0);
    // 2 unit Lumi @ Rp 120.000 + (2 x Rp 25.000) = Rp 240.000 + Rp 50.000 = Rp 290.000
    expect(newOrder.subtotal_amount).toBe(240000);
    expect(newOrder.add_on_amount).toBe(50000);
    expect(newOrder.total_amount).toBe(290000);

    // Snapshot HPP per unit harus tersimpan permanen
    expect(newOrder.items?.[0].unit_hpp).toBe(81182.4);

    // -------------------------------------------------------------
    // TAHAP 4: Transisi Alur Produksi -> Otomasi Pemotongan Stok BOM
    // -------------------------------------------------------------
    const confirmedOrder = await updateOrderStatus(newOrder.id, "CONFIRMED");
    expect(confirmedOrder.status).toBe("CONFIRMED");

    // Beralih ke IN_PRODUCTION -> Memicu pemotongan stok bahan baku
    const inProdOrder = await updateOrderStatus(newOrder.id, "IN_PRODUCTION");
    expect(inProdOrder.status).toBe("IN_PRODUCTION");

    // Verifikasi mutasi stok filamen tercatat
    const movements = await getStockMovements();
    const prodMovements = movements.filter((m) => m.reference_id === newOrder.id);
    expect(prodMovements.length).toBeGreaterThan(0);

    // Filamen terpotong: 2 unit x 166.4g = 332.8g
    const updatedMaterials = await getMaterials();
    const updatedFilament = updatedMaterials.find((m) => m.id === "mat-01");
    expect(updatedFilament?.current_stock).toBe(startingStockFilament - 332.8);

    // -------------------------------------------------------------
    // TAHAP 5: Pembayaran Uang Muka (DP 50% = Rp 145.000)
    // -------------------------------------------------------------
    const dpPayment = await createPayment({
      order_id: newOrder.id,
      amount: 145000,
      payment_method: "TRANSFER",
      reference_number: "TRX-BCA-5588",
      notes: "DP 50% sebelum pencetakan selesai",
    });

    expect(dpPayment.id).toBeDefined();
    expect(dpPayment.amount).toBe(145000);

    // Verifikasi order update: PARTIALLY_PAID
    const orderAfterDp = await getOrderById(newOrder.id);
    expect(orderAfterDp?.paid_amount).toBe(145000);
    expect(orderAfterDp?.payment_status).toBe("PARTIALLY_PAID");

    // -------------------------------------------------------------
    // TAHAP 6: Monitoring Saldo Piutang Usaha
    // -------------------------------------------------------------
    const receivables = await getReceivablesSummary();
    const budiReceivable = receivables.items.find((i) => i.order.id === newOrder.id);
    expect(budiReceivable).toBeDefined();
    expect(budiReceivable?.remainingAmount).toBe(145000); // Sisa 50%

    // -------------------------------------------------------------
    // TAHAP 7: Pelunasan Sisa Pembayaran (Rp 145.000)
    // -------------------------------------------------------------
    const finalPayment = await createPayment({
      order_id: newOrder.id,
      amount: 145000,
      payment_method: "QRIS",
      reference_number: "QRIS-0099",
      notes: "Pelunasan sisa tagihan saat barang siap kirim",
    });

    expect(finalPayment.amount).toBe(145000);

    const orderAfterFullPayment = await getOrderById(newOrder.id);
    expect(orderAfterFullPayment?.paid_amount).toBe(290000);
    expect(orderAfterFullPayment?.payment_status).toBe("PAID");

    // Piutang atas order ini harus lunas (tidak ada lagi di daftar piutang aktif)
    const receivablesAfterFull = await getReceivablesSummary();
    const budiReceivableAfter = receivablesAfterFull.items.find((i) => i.order.id === newOrder.id);
    expect(budiReceivableAfter).toBeUndefined();

    // -------------------------------------------------------------
    // TAHAP 8: Selesaikan Produksi & Pengiriman (READY -> SHIPPED -> COMPLETED)
    // -------------------------------------------------------------
    await updateOrderStatus(newOrder.id, "READY");
    await updateOrderStatus(newOrder.id, "SHIPPED");
    const completedOrder = await updateOrderStatus(newOrder.id, "COMPLETED");
    expect(completedOrder.status).toBe("COMPLETED");

    // -------------------------------------------------------------
    // TAHAP 9: Verifikasi Konsolidasi Laporan Laba Rugi
    // -------------------------------------------------------------
    const pnl = await getProfitLossStatement();
    // Omzet total bertambah dari 945.000 + 290.000 = Rp 1.235.000
    expect(pnl.grossRevenue).toBe(945000 + 290000);
    // HPP bertambah dari 2 unit Lumi (2 x 81182.4 = 162364.8)
    expect(pnl.cogs).toBeGreaterThan(814417.2);
    expect(pnl.grossProfit).toBeCloseTo(pnl.netRevenue - pnl.cogs, 2);

    // -------------------------------------------------------------
    // TAHAP 10: Verifikasi Konsolidasi Laporan Arus Kas
    // -------------------------------------------------------------
    const cashFlow = await getCashFlowStatement();
    // Kas masuk bertambah Rp 290.000 (dari 290k baseline menjadi 580k)
    expect(cashFlow.operatingInflows.customerPayments).toBe(290000 + 290000);
  });

  it("should safely rollback stock if an in-production order is cancelled", async () => {
    // Buat order baru
    const order = await createOrder({
      customer_name: "Customer Batal",
      channel: "Direct",
      items: [
        {
          product_id: "prod-02", // Ollie Lamp (203.08g filamen)
          quantity: 1,
        },
      ],
    });

    const materialsBefore = await getMaterials();
    const filBefore = materialsBefore.find((m) => m.id === "mat-01")?.current_stock ?? 0;

    // Mulai produksi -> Stok terpotong 203.08g
    await updateOrderStatus(order.id, "CONFIRMED");
    await updateOrderStatus(order.id, "IN_PRODUCTION");

    const materialsInProd = await getMaterials();
    const filInProd = materialsInProd.find((m) => m.id === "mat-01")?.current_stock ?? 0;
    expect(filInProd).toBe(filBefore - 203.08);

    // Batalkan pesanan -> Stok harus kembali pulih (reversal)
    const cancelledOrder = await updateOrderStatus(order.id, "CANCELLED");
    expect(cancelledOrder.status).toBe("CANCELLED");

    const materialsAfterCancel = await getMaterials();
    const filAfterCancel = materialsAfterCancel.find((m) => m.id === "mat-01")?.current_stock ?? 0;
    expect(filAfterCancel).toBe(filBefore);

    // Tidak boleh terhitung ke dalam omzet aktif
    const pnl = await getProfitLossStatement();
    expect(pnl.grossRevenue).toBe(945000);
  });
});
