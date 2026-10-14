import { Decimal } from "decimal.js";

/**
 * Casa Moral Financial Engine — Pricing & Profitability Calculator
 * Distinguishes Markup vs Margin and models marketplace deductions (Shopee fees).
 */

/**
 * Convert Markup % to Margin %
 * Formula: Margin = Markup / (1 + Markup)
 * Example: Markup 50% => 0.50 / 1.50 = 33.333%
 */
export function convertMarkupToMargin(markupPercent: number): number {
  if (markupPercent <= -100) return 0;
  const markup = new Decimal(markupPercent).dividedBy(100);
  const margin = markup.dividedBy(new Decimal(1).plus(markup));
  return margin.times(100).toDecimalPlaces(4).toNumber();
}

/**
 * Convert Margin % to Markup %
 * Formula: Markup = Margin / (1 - Margin)
 * Example: Margin 50% => 0.50 / 0.50 = 100%
 */
export function convertMarginToMarkup(marginPercent: number): number {
  if (marginPercent >= 100) return Infinity;
  const margin = new Decimal(marginPercent).dividedBy(100);
  const markup = margin.dividedBy(new Decimal(1).minus(margin));
  return markup.times(100).toDecimalPlaces(4).toNumber();
}

/**
 * Calculate recommended selling price based on Target Markup %
 * Formula: Price = HPP * (1 + Markup/100)
 */
export function calculatePriceFromMarkup(hpp: number, markupPercent: number): number {
  const hppDec = new Decimal(hpp);
  const markupDec = new Decimal(markupPercent).dividedBy(100);
  const price = hppDec.times(new Decimal(1).plus(markupDec));
  return price.toDecimalPlaces(2).toNumber();
}

/**
 * Calculate recommended selling price based on Target Margin %
 * Formula: Price = HPP / (1 - Margin/100)
 */
export function calculatePriceFromMargin(hpp: number, marginPercent: number): number {
  if (marginPercent >= 100) return 0;
  const hppDec = new Decimal(hpp);
  const marginDec = new Decimal(marginPercent).dividedBy(100);
  const price = hppDec.dividedBy(new Decimal(1).minus(marginDec));
  return price.toDecimalPlaces(2).toNumber();
}

export interface MarketplaceFeeOptions {
  shopeeAdminRate?: number;     // e.g. 0.08 for 8%
  freeShippingXtraRate?: number;// e.g. 0.04 for 4%
  freeShippingMaxCap?: number;  // e.g. Rp 10.000 max cap
  includeShippingXtra?: boolean;// Y/N toggle
}

export interface PricingAnalysisResult {
  sellingPrice: number;
  hpp: number;
  grossProfitRaw: number;
  markupPercent: number;
  marginPercent: number;
  shopeeAdminFee: number;
  shippingXtraFee: number;
  totalMarketplaceFees: number;
  netRealizedPrice: number;
  netGrossProfit: number;
  netMarginPercent: number;
}

/**
 * Analyze complete profitability including marketplace fees
 */
export function analyzePricing(
  sellingPrice: number,
  hpp: number,
  options: MarketplaceFeeOptions = {}
): PricingAnalysisResult {
  const priceDec = new Decimal(sellingPrice);
  const hppDec = new Decimal(hpp);

  const adminRate = new Decimal(options.shopeeAdminRate ?? 0.08);
  const shippingRate = new Decimal(options.freeShippingXtraRate ?? 0.04);
  const shippingCap = new Decimal(options.freeShippingMaxCap ?? 10000);
  const includeShipping = options.includeShippingXtra ?? true;

  // Raw Gross Profit (Direct Sales without platform fee)
  const grossProfitRaw = priceDec.minus(hppDec);
  const markupPercent = hppDec.isZero()
    ? 0
    : grossProfitRaw.dividedBy(hppDec).times(100).toDecimalPlaces(2).toNumber();

  const marginPercent = priceDec.isZero()
    ? 0
    : grossProfitRaw.dividedBy(priceDec).times(100).toDecimalPlaces(2).toNumber();

  // Marketplace deductions
  const shopeeAdminFee = priceDec.times(adminRate).toDecimalPlaces(2);
  let shippingXtraFee = new Decimal(0);

  if (includeShipping) {
    const rawShippingFee = priceDec.times(shippingRate);
    shippingXtraFee = Decimal.min(rawShippingFee, shippingCap).toDecimalPlaces(2);
  }

  const totalMarketplaceFees = shopeeAdminFee.plus(shippingXtraFee);
  const netRealizedPrice = priceDec.minus(totalMarketplaceFees);
  const netGrossProfit = priceDec.minus(hppDec).minus(totalMarketplaceFees);
  const netMarginPercent = priceDec.isZero()
    ? 0
    : netGrossProfit.dividedBy(priceDec).times(100).toDecimalPlaces(2).toNumber();

  return {
    sellingPrice: priceDec.toNumber(),
    hpp: hppDec.toNumber(),
    grossProfitRaw: grossProfitRaw.toDecimalPlaces(2).toNumber(),
    markupPercent,
    marginPercent,
    shopeeAdminFee: shopeeAdminFee.toNumber(),
    shippingXtraFee: shippingXtraFee.toNumber(),
    totalMarketplaceFees: totalMarketplaceFees.toNumber(),
    netRealizedPrice: netRealizedPrice.toDecimalPlaces(2).toNumber(),
    netGrossProfit: netGrossProfit.toDecimalPlaces(2).toNumber(),
    netMarginPercent,
  };
}
