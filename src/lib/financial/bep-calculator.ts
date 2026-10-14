import { Decimal } from "decimal.js";

/**
 * Casa Moral Financial Engine — Break-Even Point (BEP) & Payback Period Calculator
 * Implements BEP Unit, BEP Omzet, and Return on Investment (ROI) analysis.
 */

export interface BepAnalysisInput {
  monthlyFixedOverhead: number;  // Total Biaya Tetap / Overhead Bulanan (di luar HPP per unit)
  averageSellingPrice: number;   // Rata-rata Harga Jual per Unit
  averageUnitHpp: number;        // Rata-rata HPP per Unit
  averagePlatformFeePerUnit?: number; // Rata-rata potongan admin marketplace jika ada
  initialCapital?: number;       // Total Modal Awal (untuk kalkulasi balik modal)
  estimatedMonthlyUnits?: number;// Target / Estimasi penjualan unit per bulan
}

export interface BepAnalysisResult {
  monthlyFixedOverhead: number;
  averageSellingPrice: number;
  averageUnitHpp: number;
  unitContributionMargin: number;
  contributionMarginRatio: number; // CM % of selling price
  bepUnitsPerMonth: number;
  bepUnitsPerDay: number;          // Asumsi 30 hari
  bepRevenuePerMonth: number;
  estimatedMonthlyUnits: number;
  estimatedGrossProfit: number;
  estimatedNetProfit: number;
  isViable: boolean;
  paybackPeriodMonths: number | null;
  statusMessage: string;
}

export function calculateBEP(input: BepAnalysisInput): BepAnalysisResult {
  const overhead = new Decimal(input.monthlyFixedOverhead);
  const price = new Decimal(input.averageSellingPrice);
  const hpp = new Decimal(input.averageUnitHpp);
  const fee = new Decimal(input.averagePlatformFeePerUnit ?? 0);
  const capital = new Decimal(input.initialCapital ?? 0);
  const estimatedUnits = new Decimal(input.estimatedMonthlyUnits ?? 0);

  // Unit Contribution Margin = Selling Price - HPP - Platform Fee
  const unitContributionMargin = price.minus(hpp).minus(fee);

  // If contribution margin <= 0, the business loses money on every unit sold
  if (unitContributionMargin.lessThanOrEqualTo(0)) {
    return {
      monthlyFixedOverhead: overhead.toNumber(),
      averageSellingPrice: price.toNumber(),
      averageUnitHpp: hpp.toNumber(),
      unitContributionMargin: unitContributionMargin.toNumber(),
      contributionMarginRatio: 0,
      bepUnitsPerMonth: 0,
      bepUnitsPerDay: 0,
      bepRevenuePerMonth: 0,
      estimatedMonthlyUnits: estimatedUnits.toNumber(),
      estimatedGrossProfit: 0,
      estimatedNetProfit: -overhead.toNumber(),
      isViable: false,
      paybackPeriodMonths: null,
      statusMessage: "Margin kontribusi negatif atau nol. Naikkan harga jual atau turunkan biaya produksi.",
    };
  }

  const cmRatio = price.isZero()
    ? new Decimal(0)
    : unitContributionMargin.dividedBy(price);

  // BEP Units = CEILING(Monthly Overhead / Contribution Margin per Unit)
  const rawBepUnits = overhead.dividedBy(unitContributionMargin);
  const bepUnitsPerMonth = Math.ceil(rawBepUnits.toNumber());
  const bepUnitsPerDay = new Decimal(bepUnitsPerMonth).dividedBy(30).toDecimalPlaces(2).toNumber();

  // BEP Revenue = BEP Units * Average Selling Price
  const bepRevenuePerMonth = new Decimal(bepUnitsPerMonth).times(price).toNumber();

  // Monthly Profit Projection
  const estimatedGrossProfit = estimatedUnits.times(unitContributionMargin);
  const estimatedNetProfit = estimatedGrossProfit.minus(overhead);

  // Payback Period (Estimasi Balik Modal)
  let paybackPeriodMonths: number | null = null;
  let isViable = true;
  let statusMessage = "Bisnis memiliki proyeksi profit positif.";

  if (estimatedNetProfit.lessThanOrEqualTo(0)) {
    isViable = false;
    statusMessage = "Estimasi penjualan belum menutup biaya overhead bulanan. Tingkatkan volume atau turunkan overhead.";
  } else if (!capital.isZero()) {
    paybackPeriodMonths = capital.dividedBy(estimatedNetProfit).toDecimalPlaces(2).toNumber();
  }

  return {
    monthlyFixedOverhead: overhead.toNumber(),
    averageSellingPrice: price.toNumber(),
    averageUnitHpp: hpp.toNumber(),
    unitContributionMargin: unitContributionMargin.toDecimalPlaces(2).toNumber(),
    contributionMarginRatio: cmRatio.times(100).toDecimalPlaces(2).toNumber(),
    bepUnitsPerMonth,
    bepUnitsPerDay,
    bepRevenuePerMonth,
    estimatedMonthlyUnits: estimatedUnits.toNumber(),
    estimatedGrossProfit: estimatedGrossProfit.toDecimalPlaces(2).toNumber(),
    estimatedNetProfit: estimatedNetProfit.toDecimalPlaces(2).toNumber(),
    isViable,
    paybackPeriodMonths,
    statusMessage,
  };
}
