import Decimal from "decimal.js";
import { getOrders } from "./orders-service";
import { getPayments } from "./payments-service";
import { Order, ChannelSource, PaymentStatus } from "@/types/database";

export type RecapDatePeriod = "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL" | "CUSTOM";

export interface RecapFilters {
  period?: RecapDatePeriod;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  channel?: string;
  paymentStatus?: string;
  search?: string;
}

export interface RecapOrderRow {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerCity: string;
  channel: ChannelSource;
  productsSummary: string;
  packagingSummary: string;
  totalAmount: number;
  netRealizedRevenue: number; // Omzet Riil Bersih Kas setelah potongan platform & diskon
  totalHpp: number;
  rawProductHpp: number;
  packagingHpp: number;
  platformFee: number;
  discountAmount: number;
  shippingCost: number;
  netProfit: number;
  marginPct: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  remainingReceivable: number;
}

export interface FinancialRecapSummary {
  periodLabel: string;
  totalOrdersCount: number;
  grossRevenue: number;         // Total Tagihan / Penjualan Kotor
  netRealizedRevenue: number;   // Total Omzet Riil Diterima Kas (Setelah Potongan Marketplace)
  totalProductRawHpp: number;   // Modal Bahan Produk Baku
  totalPackagingCost: number;   // Modal Bahan Kemasan (Kardus, Bubble Wrap)
  totalCogs: number;            // Total Modal HPP (Bahan + Kemasan)
  totalPlatformFees: number;    // Potongan Fee Marketplace Shopee
  totalDiscounts: number;       // Total Diskon Penjualan
  netRevenue: number;           // Pendapatan Setelah Fee & Diskon
  grossProfit: number;          // Laba Kotor / Pendapatan Bersih
  averageMarginPct: number;     // Rata-rata Margin Keuntungan (%)
  totalCashReceived: number;    // Kas Diterima (Lunas/DP)
  totalReceivables: number;     // Sisa Piutang Usaha
  orders: RecapOrderRow[];
}

/**
 * Filter orders by date range
 */
function isDateInPeriod(dateStr: string, period: RecapDatePeriod, start?: string, end?: string): boolean {
  if (period === "ALL") return true;

  const orderDate = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === "TODAY") {
    return orderDate >= todayStart && orderDate <= todayEnd;
  }

  if (period === "YESTERDAY") {
    const yestStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yestEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);
    return orderDate >= yestStart && orderDate <= yestEnd;
  }

  if (period === "THIS_WEEK") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return orderDate >= weekStart;
  }

  if (period === "THIS_MONTH") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return orderDate >= monthStart;
  }

  if (period === "CUSTOM" && start && end) {
    const cStart = new Date(`${start}T00:00:00`);
    const cEnd = new Date(`${end}T23:59:59`);
    return orderDate >= cStart && orderDate <= cEnd;
  }

  return true;
}

/**
 * Generates the complete financial recap statement for bookkeeping and ledger review
 */
export async function getFinancialRecap(filters?: RecapFilters): Promise<FinancialRecapSummary> {
  const allOrders = await getOrders();
  const period = filters?.period || "ALL";

  // Filter orders
  let filtered = allOrders.filter((o) => {
    if (o.status === "CANCELLED") return false; // Cancelled orders do not affect financial recap
    if (!isDateInPeriod(o.order_date, period, filters?.startDate, filters?.endDate)) {
      return false;
    }
    if (filters?.channel && filters.channel !== "ALL" && o.channel !== filters.channel) {
      return false;
    }
    if (filters?.paymentStatus && filters.paymentStatus !== "ALL" && o.payment_status !== filters.paymentStatus) {
      return false;
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const matchOrder = o.order_number.toLowerCase().includes(q);
      const matchCust = o.customer?.name.toLowerCase().includes(q);
      if (!matchOrder && !matchCust) return false;
    }
    return true;
  });

  let sumGrossRev = new Decimal(0);
  let sumNetRealized = new Decimal(0);
  let sumProductRawHpp = new Decimal(0);
  let sumPackagingCost = new Decimal(0);
  let sumPlatformFees = new Decimal(0);
  let sumDiscounts = new Decimal(0);
  let sumCashReceived = new Decimal(0);
  let sumReceivables = new Decimal(0);

  const recapRows: RecapOrderRow[] = filtered.map((o) => {
    const items = o.items || [];
    const productsSummary = items
      .map((i) => `${i.product?.name || "Produk"} (${i.quantity}x)`)
      .join(", ") || "Produk";

    // Packaging summary
    let packagingSummary = "Standar";
    if (o.packaging_items && o.packaging_items.length > 0) {
      packagingSummary = o.packaging_items.map((p) => `${p.quantity}x ${p.name}`).join(", ");
    }

    // Modal breakdown
    let rawProductHpp = 0;
    let packagingHpp = o.packaging_cost || 0;

    if (o.raw_hpp !== undefined) {
      rawProductHpp = o.raw_hpp;
    } else {
      // Fallback: estimate from item unit_hpp minus default packaging
      rawProductHpp = items.reduce((acc, curr) => {
        const itemHpp = new Decimal(curr.unit_hpp || 0).times(curr.quantity || 1);
        return acc.plus(itemHpp);
      }, new Decimal(0)).toNumber();
    }

    const totalHpp = o.total_hpp || (rawProductHpp + packagingHpp);
    const totalAmount = o.total_amount || 0;
    const platformFee = o.platform_fee || 0;
    const discountAmount = o.discount_amount || 0;
    const shippingCost = o.shipping_cost || 0;

    // Omzet riil diterima kas setelah potongan fee & diskon
    const netRealizedRevenue = new Decimal(totalAmount)
      .minus(platformFee)
      .minus(discountAmount)
      .toNumber();

    // Net profit
    const netProfit = o.net_profit !== undefined
      ? o.net_profit
      : new Decimal(totalAmount).minus(totalHpp).minus(platformFee).toNumber();

    // Margin dihitung dari omzet riil kas yang masuk
    const marginBasis = netRealizedRevenue > 0 ? netRealizedRevenue : totalAmount;
    const marginPct = marginBasis > 0
      ? Number(new Decimal(netProfit).dividedBy(marginBasis).times(100).toFixed(1))
      : 0;

    const paidAmount = o.paid_amount || 0;
    const remainingReceivable = Math.max(0, totalAmount - paidAmount);

    sumGrossRev = sumGrossRev.plus(totalAmount);
    sumNetRealized = sumNetRealized.plus(netRealizedRevenue);
    sumProductRawHpp = sumProductRawHpp.plus(rawProductHpp);
    sumPackagingCost = sumPackagingCost.plus(packagingHpp);
    sumPlatformFees = sumPlatformFees.plus(platformFee);
    sumDiscounts = sumDiscounts.plus(discountAmount);
    sumCashReceived = sumCashReceived.plus(paidAmount);
    sumReceivables = sumReceivables.plus(remainingReceivable);

    return {
      id: o.id,
      orderNumber: o.order_number,
      orderDate: o.order_date,
      customerName: o.customer?.name || "Pelanggan Umum",
      customerCity: o.customer?.city || "Sukamara",
      channel: o.channel,
      productsSummary,
      packagingSummary,
      totalAmount,
      netRealizedRevenue,
      totalHpp,
      rawProductHpp,
      packagingHpp,
      platformFee,
      discountAmount,
      shippingCost,
      netProfit,
      marginPct,
      paymentStatus: o.payment_status,
      paidAmount,
      remainingReceivable,
    };
  });

  const totalCogs = sumProductRawHpp.plus(sumPackagingCost).toNumber();
  const netRevenue = sumGrossRev.minus(sumPlatformFees).minus(sumDiscounts).toNumber();
  const grossProfit = new Decimal(netRevenue).minus(totalCogs).toNumber();
  const averageMarginPct = sumGrossRev.greaterThan(0)
    ? Number(new Decimal(grossProfit).dividedBy(sumGrossRev).times(100).toFixed(1))
    : 0;

  let periodLabel = "Semua Periode";
  if (period === "TODAY") periodLabel = "Hari Ini";
  else if (period === "YESTERDAY") periodLabel = "Kemarin";
  else if (period === "THIS_WEEK") periodLabel = "Minggu Ini";
  else if (period === "THIS_MONTH") periodLabel = "Bulan Ini";
  else if (period === "CUSTOM") periodLabel = `${filters?.startDate || ""} s/d ${filters?.endDate || ""}`;

  return {
    periodLabel,
    totalOrdersCount: filtered.length,
    grossRevenue: sumGrossRev.toNumber(),
    netRealizedRevenue: sumNetRealized.toNumber(),
    totalProductRawHpp: sumProductRawHpp.toNumber(),
    totalPackagingCost: sumPackagingCost.toNumber(),
    totalCogs,
    totalPlatformFees: sumPlatformFees.toNumber(),
    totalDiscounts: sumDiscounts.toNumber(),
    netRevenue,
    grossProfit,
    averageMarginPct,
    totalCashReceived: sumCashReceived.toNumber(),
    totalReceivables: sumReceivables.toNumber(),
    orders: recapRows,
  };
}
