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
    resetMemoryOrders(false);
    resetMemoryPayments(false);
    resetMemoryExpenses(false);
  });

  describe("1. Laporan Laba Rugi (Profit & Loss Statement)", () => {
    it("should compute accurate gross revenue, COGS, operating expenses, and net profit", async () => {
      const pl = await getProfitLossStatement();

      // Total Omzet dari 24 pesanan konsolidasi = Rp 3.595.000
      expect(pl.grossRevenue).toBe(3595000);
      expect(pl.discounts).toBe(0);
      expect(pl.platformFees).toBe(402189);
      // Net Revenue setelah fee Shopee = Rp 3.192.811
      expect(pl.netRevenue).toBe(3192811);

      // COGS snapshot total harus lebih besar dari 0 dan konsisten
      expect(pl.cogs).toBeGreaterThan(0);
      expect(pl.grossProfit).toBeCloseTo(pl.netRevenue - pl.cogs, 2);
      expect(pl.grossMarginPct).toBeGreaterThan(0);

      // Beban operasional baseline dari CSV = Rp 1.211.091
      expect(pl.operatingExpenses.fixedTotal).toBe(1211091);
      expect(pl.operatingExpenses.variableTotal).toBe(0);
      expect(pl.operatingExpenses.total).toBe(1211091);

      // Laba operasional = Gross Profit - Total Expenses
      expect(pl.operatingProfit).toBe(pl.grossProfit - 1211091);
      expect(pl.netProfit).toBe(pl.operatingProfit);
    });

    it("should properly categorize fixed vs variable expenses in breakdown", async () => {
      const pl = await getProfitLossStatement();
      expect(pl.operatingExpenses.breakdown.length).toBe(10);

      const fixedItems = pl.operatingExpenses.breakdown.filter((b) => b.isFixed);
      expect(fixedItems.length).toBe(10);
    });
  });

  describe("2. Laporan Arus Kas (Cash Flow Statement)", () => {
    it("should accurately track operational inflows, investing, and financing flows", async () => {
      const cf = await getCashFlowStatement();

      // Kas masuk operasional dari pembayaran konsolidasi = Rp 2.076.311 (840k Offline + 1.236.311 Shopee Dilepas)
      expect(cf.operatingInflows.customerPayments).toBe(2076311);
      expect(cf.operatingInflows.total).toBe(2076311);

      // Kas keluar operasional mencakup beban kas yang dibayarkan dan pembelian bahan
      expect(cf.operatingOutflows.operatingExpensesPaid).toBeGreaterThan(0);
      expect(cf.operatingOutflows.materialPurchases).toBeGreaterThan(0);

      // Setoran modal & belanja bahan/aset dari CSV = Rp 14.811.820
      expect(cf.financingCashFlow.ownerCapitalInjected).toBe(14811820);

      // Saldo kas akhir harus terhitung rasional
      expect(cf.endingCashBalance).toBeDefined();
    });
  });

  describe("3. Analisis Penjualan & Performa Produk", () => {
    it("should aggregate units, revenues, margins, and printing hours per product model", async () => {
      const analytics = await getSalesAnalytics();

      expect(analytics.totalOrders).toBe(24);
      expect(analytics.totalRevenue).toBe(3595000);
      expect(analytics.totalUnitsSold).toBe(27);

      // Verifikasi model lampu termasuk Lyra & Nomi
      const modelNames = analytics.products.map((p) => p.name);
      expect(modelNames.some((n) => n.includes("Lumi"))).toBe(true);
      expect(modelNames.some((n) => n.includes("Ollie"))).toBe(true);
      expect(modelNames.some((n) => n.includes("Kumo"))).toBe(true);
      expect(modelNames.some((n) => n.includes("Pomi"))).toBe(true);
      expect(modelNames.some((n) => n.includes("Lyra"))).toBe(true);
      expect(modelNames.some((n) => n.includes("Nomi"))).toBe(true);

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
      expect(directChannel?.ordersCount).toBe(10);
      expect(shopeeChannel?.ordersCount).toBe(14);

      // Add-on Lee Jeno
      const leeJenoAddon = analytics.addOns.find((a) => a.name.includes("Lee Jeno"));
      expect(leeJenoAddon).toBeDefined();
      expect(leeJenoAddon?.totalRevenue).toBe(30000);
    });
  });

  describe("4. Executive Dashboard Metrics & BEP Tracker", () => {
    it("should compute real KPIs and realistic BEP targets", async () => {
      const dash = await getExecutiveDashboardMetrics();

      expect(dash.kpis.totalRevenue).toBe(3595000);
      expect(dash.kpis.totalCashReceived).toBe(2076311);
      expect(dash.kpis.totalReceivables).toBe(1116500);
      expect(dash.kpis.totalExpenses).toBe(1211091);

      // Piutang belum lunas + Shopee pending = 6 pesanan
      expect(dash.criticalReceivablesCount).toBe(6);

      // BEP Target
      expect(dash.bepTracking.monthlyFixedOverhead).toBe(1211091);
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
