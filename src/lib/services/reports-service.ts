import Decimal from "decimal.js";
import { getOrders } from "./orders-service";
import { getPayments } from "./payments-service";
import { getExpenses, getExpensesSummary } from "./expenses-service";
import { ALL_PRODUCTS, ALL_CAPITAL_PURCHASES } from "@/lib/data/initial-data";
import { calculateBEP } from "@/lib/financial/bep-calculator";
import { formatModelName } from "@/lib/utils";

export interface ProfitLossStatement {
  period: string;
  grossRevenue: number;         // Total penjualan kotor (produk + add-on)
  discounts: number;            // Total potongan diskon
  shippingCollected: number;    // Total ongkir ditagihkan ke pelanggan
  platformFees: number;         // Total potongan marketplace Shopee
  netRevenue: number;           // Pendapatan bersih = grossRevenue - discounts - platformFees
  cogs: number;                 // Total HPP barang terjual (snapshot HPP)
  grossProfit: number;          // Laba kotor = netRevenue - cogs
  grossMarginPct: number;       // Gross Margin %
  operatingExpenses: {
    fixedTotal: number;
    variableTotal: number;
    total: number;
    breakdown: { category: string; amount: number; isFixed: boolean }[];
  };
  operatingProfit: number;      // Laba operasional = grossProfit - totalExpenses
  operatingMarginPct: number;   // Operating Margin %
  netProfit: number;            // Laba bersih
  netMarginPct: number;         // Net Margin %
}

export interface CashFlowStatement {
  period: string;
  operatingInflows: {
    customerPayments: number;
    total: number;
  };
  operatingOutflows: {
    operatingExpensesPaid: number;
    materialPurchases: number;
    total: number;
  };
  netOperatingCashFlow: number;
  investingCashFlow: {
    fixedAssetsPurchased: number; // Pembelian mesin 3D printer
    total: number;
  };
  financingCashFlow: {
    ownerCapitalInjected: number; // Setoran modal awal
    total: number;
  };
  netCashFlow: number;
  endingCashBalance: number;
}

export interface ProductPerformanceItem {
  id: string;
  name: string;
  sku: string;
  unitsSold: number;
  totalRevenue: number;
  totalHpp: number;
  grossProfit: number;
  grossMarginPct: number;
  shareOfSalesPct: number;
  avgSellingPrice: number;
  avgUnitHpp: number;
  printingHoursEstimate: number;
}

export interface SalesAnalytics {
  totalUnitsSold: number;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  products: ProductPerformanceItem[];
  channels: { channel: string; ordersCount: number; revenue: number; percentage: number }[];
  statusPipeline: { status: string; count: number; totalValue: number }[];
  addOns: { name: string; count: number; totalRevenue: number }[];
  totalPrintingHoursEstimated: number;
}

export interface ExecutiveDashboardData {
  kpis: {
    grossRevenue: number;
    netRevenue: number;
    totalRevenue: number;
    totalCashReceived: number;
    totalReceivables: number;
    totalCogs: number;
    grossProfit: number;
    grossMarginPct: number;
    totalExpenses: number;
    operatingProfit: number;
    totalUnitsSold: number;
  };
  bepTracking: {
    monthlyFixedOverhead: number;
    averageSellingPrice: number;
    averageUnitHpp: number;
    unitContributionMargin: number;
    bepTargetUnits: number;
    bepTargetRevenue: number;
    currentUnitsSold: number;
    progressPercentage: number;
    remainingUnitsToBep: number;
    isBepReached: boolean;
  };
  salesByModel: { model: string; units: number; revenue: number; marginPct: number }[];
  channelDistribution: { channel: string; orders: number; revenue: number }[];
  criticalReceivablesCount: number;
}

/**
 * Fetch and calculate the complete Profit & Loss (Laba Rugi) Statement
 */
export async function getProfitLossStatement(): Promise<ProfitLossStatement> {
  const orders = await getOrders();
  const expenses = await getExpenses();

  let grossRevDec = new Decimal(0);
  let discountsDec = new Decimal(0);
  let shippingDec = new Decimal(0);
  let platformFeesDec = new Decimal(0);
  let cogsDec = new Decimal(0);

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;

    grossRevDec = grossRevDec.plus(order.subtotal_amount).plus(order.add_on_amount || 0);
    discountsDec = discountsDec.plus(order.discount_amount || 0);
    shippingDec = shippingDec.plus(order.shipping_cost || 0);
    platformFeesDec = platformFeesDec.plus(order.platform_fee || 0);

    for (const item of order.items || []) {
      const itemHpp = new Decimal(item.unit_hpp || 0).times(item.quantity || 1);
      cogsDec = cogsDec.plus(itemHpp);
    }
  }

  // Net Revenue = Gross Revenue - Discounts - Platform Fees
  const netRevenueDec = grossRevDec.minus(discountsDec).minus(platformFeesDec);
  const grossProfitDec = netRevenueDec.minus(cogsDec);
  const grossMarginPct = netRevenueDec.isZero()
    ? 0
    : grossProfitDec.dividedBy(netRevenueDec).times(100).toDecimalPlaces(2).toNumber();

  // Operating Expenses
  let fixedDec = new Decimal(0);
  let variableDec = new Decimal(0);
  const breakdown: { category: string; amount: number; isFixed: boolean }[] = [];

  for (const exp of expenses) {
    const amt = new Decimal(exp.amount);
    const isFixed = exp.category?.is_fixed_cost ?? true;
    if (isFixed) {
      fixedDec = fixedDec.plus(amt);
    } else {
      variableDec = variableDec.plus(amt);
    }

    breakdown.push({
      category: exp.category?.name || exp.description,
      amount: exp.amount,
      isFixed,
    });
  }

  const totalExpensesDec = fixedDec.plus(variableDec);
  const operatingProfitDec = grossProfitDec.minus(totalExpensesDec);
  const operatingMarginPct = netRevenueDec.isZero()
    ? 0
    : operatingProfitDec.dividedBy(netRevenueDec).times(100).toDecimalPlaces(2).toNumber();

  return {
    period: "September - November 2026",
    grossRevenue: grossRevDec.toNumber(),
    discounts: discountsDec.toNumber(),
    shippingCollected: shippingDec.toNumber(),
    platformFees: platformFeesDec.toNumber(),
    netRevenue: netRevenueDec.toNumber(),
    cogs: cogsDec.toNumber(),
    grossProfit: grossProfitDec.toNumber(),
    grossMarginPct,
    operatingExpenses: {
      fixedTotal: fixedDec.toNumber(),
      variableTotal: variableDec.toNumber(),
      total: totalExpensesDec.toNumber(),
      breakdown,
    },
    operatingProfit: operatingProfitDec.toNumber(),
    operatingMarginPct,
    netProfit: operatingProfitDec.toNumber(),
    netMarginPct: operatingMarginPct,
  };
}

/**
 * Fetch and calculate the Cash Flow Statement (Laporan Arus Kas)
 */
export async function getCashFlowStatement(): Promise<CashFlowStatement> {
  const payments = await getPayments();
  const expenses = await getExpenses();

  // 1. Operating Cash Inflow = Total customer payments received
  let totalPaymentsDec = new Decimal(0);
  for (const p of payments) {
    totalPaymentsDec = totalPaymentsDec.plus(p.amount);
  }

  // 2. Operating Cash Outflow = Cash expenses + inventory materials purchases
  let cashExpensesDec = new Decimal(0);
  for (const exp of expenses) {
    // Amortization is non-cash; exclude if specifically marked, otherwise all operational expenses paid
    if (!exp.description.toLowerCase().includes("amortisasi")) {
      cashExpensesDec = cashExpensesDec.plus(exp.amount);
    }
  }

  // Capital purchases categorized as Materials (Filamen + Kelistrikan + Kemasan)
  const materialPurchasesTotal = ALL_CAPITAL_PURCHASES
    .filter((c) => ["FILAMEN", "KELISTRIKAN", "KEMASAN"].includes(c.category))
    .reduce((sum, item) => sum + item.totalCost, 0);

  const totalOperatingOutflowsDec = cashExpensesDec.plus(materialPurchasesTotal);
  const netOperatingCashDec = totalPaymentsDec.minus(totalOperatingOutflowsDec);

  // 3. Investing Cash Flow = Purchase of Fixed Assets (Mesin 3D printer & Alat)
  const fixedAssetsTotal = ALL_CAPITAL_PURCHASES
    .filter((c) => ["MESIN", "ALAT"].includes(c.category))
    .reduce((sum, item) => sum + item.totalCost, 0);

  // 4. Financing Cash Flow = Initial Owner Equity Injected
  const initialEquity = ALL_CAPITAL_PURCHASES.reduce((sum, item) => sum + item.totalCost, 0);

  // Ending Cash Balance = Owner Equity + Net Operating - Fixed Assets
  const endingCashDec = new Decimal(initialEquity)
    .minus(fixedAssetsTotal)
    .minus(materialPurchasesTotal)
    .minus(cashExpensesDec)
    .plus(totalPaymentsDec);

  return {
    period: "September - November 2026",
    operatingInflows: {
      customerPayments: totalPaymentsDec.toNumber(),
      total: totalPaymentsDec.toNumber(),
    },
    operatingOutflows: {
      operatingExpensesPaid: cashExpensesDec.toNumber(),
      materialPurchases: materialPurchasesTotal,
      total: totalOperatingOutflowsDec.toNumber(),
    },
    netOperatingCashFlow: netOperatingCashDec.toNumber(),
    investingCashFlow: {
      fixedAssetsPurchased: fixedAssetsTotal,
      total: -fixedAssetsTotal,
    },
    financingCashFlow: {
      ownerCapitalInjected: initialEquity,
      total: initialEquity,
    },
    netCashFlow: endingCashDec.toNumber(),
    endingCashBalance: endingCashDec.toNumber(),
  };
}

/**
 * Fetch and calculate Sales & Product Performance Analytics
 */
export async function getSalesAnalytics(): Promise<SalesAnalytics> {
  const orders = await getOrders();
  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");

  let totalUnits = 0;
  let totalRevDec = new Decimal(0);
  const productMap: Record<
    string,
    {
      id: string;
      name: string;
      sku: string;
      units: number;
      revenue: Decimal;
      hpp: Decimal;
      printHoursPerUnit: number;
    }
  > = {};

  // Initialize with all master products (including Nomi & Lyra)
  for (const p of ALL_PRODUCTS) {
    const printHours = p.print_time_minutes ? p.print_time_minutes / 60 : 4;
    productMap[p.id] = {
      id: p.id,
      name: p.name,
      sku: p.sku || "CM-LAMP",
      units: 0,
      revenue: new Decimal(0),
      hpp: new Decimal(0),
      printHoursPerUnit: printHours,
    };
  }

  const channelMap: Record<string, { count: number; rev: Decimal }> = {};
  const statusMap: Record<string, { count: number; value: Decimal }> = {};
  const addOnMap: Record<string, { count: number; rev: Decimal }> = {};

  for (const order of activeOrders) {
    totalRevDec = totalRevDec.plus(order.total_amount);

    // Channel
    if (!channelMap[order.channel]) {
      channelMap[order.channel] = { count: 0, rev: new Decimal(0) };
    }
    channelMap[order.channel].count += 1;
    channelMap[order.channel].rev = channelMap[order.channel].rev.plus(order.total_amount);

    // Items
    for (const item of order.items || []) {
      totalUnits += item.quantity;
      const pid = item.product_id || "prod-unknown";

      if (!productMap[pid]) {
        productMap[pid] = {
          id: pid,
          name: formatModelName(item),
          sku: item.product?.sku || "CM-LAMP",
          units: 0,
          revenue: new Decimal(0),
          hpp: new Decimal(0),
          printHoursPerUnit: 4,
        };
      }

      productMap[pid].units += item.quantity;
      productMap[pid].revenue = productMap[pid].revenue.plus(item.subtotal);
      productMap[pid].hpp = productMap[pid].hpp.plus(new Decimal(item.unit_hpp).times(item.quantity));

      // Add-ons
      if (item.add_on_name) {
        if (!addOnMap[item.add_on_name]) {
          addOnMap[item.add_on_name] = { count: 0, rev: new Decimal(0) };
        }
        addOnMap[item.add_on_name].count += 1;
        addOnMap[item.add_on_name].rev = addOnMap[item.add_on_name].rev.plus(item.add_on_price || 0);
      }
    }
  }

  // All orders for status pipeline
  for (const order of orders) {
    if (!statusMap[order.status]) {
      statusMap[order.status] = { count: 0, value: new Decimal(0) };
    }
    statusMap[order.status].count += 1;
    statusMap[order.status].value = statusMap[order.status].value.plus(order.total_amount);
  }

  let totalPrintHours = 0;
  const productList: ProductPerformanceItem[] = Object.values(productMap).map((pm) => {
    const grossProfitDec = pm.revenue.minus(pm.hpp);
    const grossMarginPct = pm.revenue.isZero()
      ? 0
      : grossProfitDec.dividedBy(pm.revenue).times(100).toDecimalPlaces(2).toNumber();
    const shareOfSalesPct = totalRevDec.isZero()
      ? 0
      : pm.revenue.dividedBy(totalRevDec).times(100).toDecimalPlaces(2).toNumber();
    const avgSellingPrice = pm.units > 0 ? pm.revenue.dividedBy(pm.units).toNumber() : 0;
    const avgUnitHpp = pm.units > 0 ? pm.hpp.dividedBy(pm.units).toNumber() : 0;
    const itemHours = pm.units * pm.printHoursPerUnit;
    totalPrintHours += itemHours;

    return {
      id: pm.id,
      name: pm.name,
      sku: pm.sku,
      unitsSold: pm.units,
      totalRevenue: pm.revenue.toNumber(),
      totalHpp: pm.hpp.toNumber(),
      grossProfit: grossProfitDec.toNumber(),
      grossMarginPct,
      shareOfSalesPct,
      avgSellingPrice,
      avgUnitHpp,
      printingHoursEstimate: itemHours,
    };
  });

  // Sort by revenue descending
  productList.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const channelList = Object.entries(channelMap).map(([channel, val]) => ({
    channel,
    ordersCount: val.count,
    revenue: val.rev.toNumber(),
    percentage: totalRevDec.isZero()
      ? 0
      : val.rev.dividedBy(totalRevDec).times(100).toDecimalPlaces(2).toNumber(),
  }));

  const statusList = Object.entries(statusMap).map(([status, val]) => ({
    status,
    count: val.count,
    totalValue: val.value.toNumber(),
  }));

  const addOnList = Object.entries(addOnMap).map(([name, val]) => ({
    name,
    count: val.count,
    totalRevenue: val.rev.toNumber(),
  }));

  const avgOrderVal = activeOrders.length > 0 ? totalRevDec.dividedBy(activeOrders.length).toNumber() : 0;

  return {
    totalUnitsSold: totalUnits,
    totalOrders: activeOrders.length,
    totalRevenue: totalRevDec.toNumber(),
    avgOrderValue: avgOrderVal,
    products: productList,
    channels: channelList,
    statusPipeline: statusList,
    addOns: addOnList,
    totalPrintingHoursEstimated: totalPrintHours,
  };
}

/**
 * Fetch and calculate unified Executive Dashboard Metrics
 */
export async function getExecutiveDashboardMetrics(): Promise<ExecutiveDashboardData> {
  const [pl, analytics, expensesSummary, orders] = await Promise.all([
    getProfitLossStatement(),
    getSalesAnalytics(),
    getExpensesSummary(),
    getOrders(),
  ]);

  // Receivables & Cash Received (separating marketplace fees from collectible amounts)
  let totalPaidDec = new Decimal(0);
  let totalReceivablesDec = new Decimal(0);
  let criticalReceivables = 0;

  for (const o of orders) {
    if (o.status !== "CANCELLED") {
      totalPaidDec = totalPaidDec.plus(o.paid_amount || 0);

      if (o.payment_status !== "PAID") {
        const isMarketplace = ["Shopee", "TikTokShop", "Tokopedia"].includes(o.channel);
        const netCollectible = isMarketplace
          ? Decimal.max(0, new Decimal(o.total_amount).minus(o.platform_fee || 0))
          : new Decimal(o.total_amount);
        const rem = Decimal.max(0, netCollectible.minus(o.paid_amount || 0));
        if (rem.greaterThan(0)) {
          totalReceivablesDec = totalReceivablesDec.plus(rem);
          criticalReceivables += 1;
        }
      }
    }
  }

  const totalReceivables = totalReceivablesDec.toNumber();

  // BEP Analysis based on current weighted average prices
  const fixedOverhead = expensesSummary.fixedCostsTotal || 820000;
  const weightedPrice = analytics.avgOrderValue || 105000;
  const weightedHpp = pl.cogs > 0 && analytics.totalUnitsSold > 0 ? pl.cogs / analytics.totalUnitsSold : 55000;

  const bepResult = calculateBEP({
    monthlyFixedOverhead: fixedOverhead,
    averageSellingPrice: weightedPrice,
    averageUnitHpp: weightedHpp,
    estimatedMonthlyUnits: analytics.totalUnitsSold,
  });

  const progressPct = bepResult.bepUnitsPerMonth > 0
    ? Math.min(100, Number(((analytics.totalUnitsSold / bepResult.bepUnitsPerMonth) * 100).toFixed(1)))
    : 0;

  const remainingUnits = Math.max(0, bepResult.bepUnitsPerMonth - analytics.totalUnitsSold);

  return {
    kpis: {
      grossRevenue: pl.grossRevenue,
      netRevenue: pl.netRevenue,
      totalRevenue: pl.grossRevenue,
      totalCashReceived: totalPaidDec.toNumber(),
      totalReceivables,
      totalCogs: pl.cogs,
      grossProfit: pl.grossProfit,
      grossMarginPct: pl.grossMarginPct,
      totalExpenses: pl.operatingExpenses.total,
      operatingProfit: pl.operatingProfit,
      totalUnitsSold: analytics.totalUnitsSold,
    },
    bepTracking: {
      monthlyFixedOverhead: fixedOverhead,
      averageSellingPrice: weightedPrice,
      averageUnitHpp: weightedHpp,
      unitContributionMargin: bepResult.unitContributionMargin,
      bepTargetUnits: bepResult.bepUnitsPerMonth,
      bepTargetRevenue: bepResult.bepRevenuePerMonth,
      currentUnitsSold: analytics.totalUnitsSold,
      progressPercentage: progressPct,
      remainingUnitsToBep: remainingUnits,
      isBepReached: analytics.totalUnitsSold >= bepResult.bepUnitsPerMonth,
    },
    salesByModel: analytics.products.map((p) => ({
      model: p.name,
      units: p.unitsSold,
      revenue: p.totalRevenue,
      marginPct: p.grossMarginPct,
    })),
    channelDistribution: analytics.channels.map((c) => ({
      channel: c.channel,
      orders: c.ordersCount,
      revenue: c.revenue,
    })),
    criticalReceivablesCount: criticalReceivables,
  };
}

export { formatCSVWithBOM } from "../export-csv";
