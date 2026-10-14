import { describe, it, expect, beforeEach } from "vitest";
import {
  getProfitLossStatement,
  getCashFlowStatement,
  getSalesAnalytics,
  getExecutiveDashboardMetrics,
  formatCSVWithBOM,
} from "../src/lib/services/reports-service";
import { resetMemoryOrders } from "../src/lib/services/orders-service";
import { resetMemoryPayments } from "../src/lib/services/payments-service";
import { resetMemoryExpenses } from "../src/lib/services/expenses-service";

describe("Sprint 6 — Reporting & Analytics Engine", () => {
  beforeEach(() => {
    resetMemoryOrders();
    resetMemoryPayments();
    resetMemoryExpenses();
  });

  describe("1. Laporan Laba Rugi (Profit & Loss Statement)", () => {
    it("should compute accurate gross revenue, COGS, operating expenses, and net profit", async () => {
      const pl = await getProfitLossStatement();

      // Total Omzet dari 9 pesanan historis = Rp 945.000
      expect(pl.grossRevenue).toBe(945000);
      expect(pl.discounts).toBe(15000);
      expect(pl.platformFees).toBe(15600);
      // Net Revenue setelah diskon promo dan fee Shopee = Rp 914.400
      expect(pl.netRevenue).toBe(914400);

      // COGS snapshot total harus lebih besar dari 0 dan konsisten
      expect(pl.cogs).toBeGreaterThan(0);
      expect(pl.grossProfit).toBeCloseTo(pl.netRevenue - pl.cogs, 2);
      expect(pl.grossMarginPct).toBeGreaterThan(0);

      // Beban operasional baseline = Rp 875.000 (Tetap 820k, Variabel 55k)
      expect(pl.operatingExpenses.fixedTotal).toBe(820000);
      expect(pl.operatingExpenses.variableTotal).toBe(55000);
      expect(pl.operatingExpenses.total).toBe(875000);

      // Laba operasional = Gross Profit - Total Expenses
      expect(pl.operatingProfit).toBe(pl.grossProfit - 875000);
      expect(pl.netProfit).toBe(pl.operatingProfit);
    });

    it("should properly categorize fixed vs variable expenses in breakdown", async () => {
      const pl = await getProfitLossStatement();
      expect(pl.operatingExpenses.breakdown.length).toBeGreaterThanOrEqual(4);

      const fixedItems = pl.operatingExpenses.breakdown.filter((b) => b.isFixed);
      const varItems = pl.operatingExpenses.breakdown.filter((b) => !b.isFixed);

      expect(fixedItems.length).toBeGreaterThan(0);
      expect(varItems.length).toBeGreaterThan(0);
    });
  });

  describe("2. Laporan Arus Kas (Cash Flow Statement)", () => {
    it("should accurately track operational inflows, investing, and financing flows", async () => {
      const cf = await getCashFlowStatement();

      // Kas masuk operasional dari pembayaran 2 pesanan = Rp 290.000
      expect(cf.operatingInflows.customerPayments).toBe(290000);
      expect(cf.operatingInflows.total).toBe(290000);

      // Kas keluar operasional mencakup beban kas yang dibayarkan dan pembelian bahan
      expect(cf.operatingOutflows.operatingExpensesPaid).toBeGreaterThan(0);
      expect(cf.operatingOutflows.materialPurchases).toBeGreaterThan(0);

      // Setoran modal awal = Rp 11.440.748
      expect(cf.financingCashFlow.ownerCapitalInjected).toBe(11440748);

      // Saldo kas akhir harus terhitung rasional
      expect(cf.endingCashBalance).toBeDefined();
    });
  });

  describe("3. Analisis Penjualan & Performa Produk", () => {
    it("should aggregate units, revenues, margins, and printing hours per product model", async () => {
      const analytics = await getSalesAnalytics();

      expect(analytics.totalOrders).toBe(9);
      expect(analytics.totalRevenue).toBe(945000);
      expect(analytics.totalUnitsSold).toBe(9);

      // Verifikasi 4 model lampu
      const modelNames = analytics.products.map((p) => p.name);
      expect(modelNames.some((n) => n.includes("Lumi"))).toBe(true);
      expect(modelNames.some((n) => n.includes("Ollie"))).toBe(true);
      expect(modelNames.some((n) => n.includes("Kumo"))).toBe(true);
      expect(modelNames.some((n) => n.includes("Pomi"))).toBe(true);

      // Setiap produk memiliki snapshot HPP, margin, dan estimasi jam cetak
      for (const prod of analytics.products) {
        if (prod.unitsSold > 0) {
          expect(prod.totalRevenue).toBeGreaterThanOrEqual(0);
          expect(prod.totalHpp).toBeGreaterThan(0);
          expect(prod.grossProfit).toBeCloseTo(prod.totalRevenue - prod.totalHpp, 2);
          expect(prod.printingHoursEstimate).toBeGreaterThan(0);
        }
      }

      // Estimasi total jam cetak studio terhitung
      expect(analytics.totalPrintingHoursEstimated).toBeGreaterThan(0);
    });

    it("should track add-on customization revenue and channel share", async () => {
      const analytics = await getSalesAnalytics();

      // Kanal Direct dan Shopee
      const directChannel = analytics.channels.find((c) => c.channel === "Direct");
      const shopeeChannel = analytics.channels.find((c) => c.channel === "Shopee");
      expect(directChannel).toBeDefined();
      expect(shopeeChannel).toBeDefined();
      expect(directChannel?.ordersCount).toBe(8);
      expect(shopeeChannel?.ordersCount).toBe(1);

      // Add-on Lee Jeno
      const leeJenoAddon = analytics.addOns.find((a) => a.name.includes("Lee Jeno"));
      expect(leeJenoAddon).toBeDefined();
      expect(leeJenoAddon?.totalRevenue).toBe(30000);
    });
  });

  describe("4. Executive Dashboard Metrics & BEP Tracker", () => {
    it("should compute real KPIs and realistic BEP targets", async () => {
      const dash = await getExecutiveDashboardMetrics();

      expect(dash.kpis.totalRevenue).toBe(945000);
      expect(dash.kpis.totalCashReceived).toBe(290000);
      expect(dash.kpis.totalReceivables).toBe(655000);
      expect(dash.kpis.totalExpenses).toBe(875000);

      // Piutang belum lunas ada 7 pesanan
      expect(dash.criticalReceivablesCount).toBe(7);

      // BEP Target
      expect(dash.bepTracking.monthlyFixedOverhead).toBe(820000);
      expect(dash.bepTracking.bepTargetUnits).toBeGreaterThan(0);
      expect(dash.bepTracking.unitContributionMargin).toBeGreaterThan(0);
      expect(dash.bepTracking.progressPercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe("5. CSV Export Formatting", () => {
    it("should prepend UTF-8 BOM and properly escape quotes and commas", () => {
      const rows = [
        ["No", "Nama Produk", "Harga Jual", "Catatan"],
        [1, "Ollie Lamp", 125000, "Warna Orange, Base White"],
        [2, 'Lumi "Special"', 115000, "Dengan Add-On, Lee Jeno"],
      ];

      const csv = formatCSVWithBOM(rows);

      // Harus dimulai dengan UTF-8 BOM
      expect(csv.startsWith("\uFEFF")).toBe(true);

      // Koma dalam data harus diapit kutip
      expect(csv).toContain('"Warna Orange, Base White"');
      // Quote di dalam teks harus di-double escape
      expect(csv).toContain('"Lumi ""Special"""');
    });
  });
});
