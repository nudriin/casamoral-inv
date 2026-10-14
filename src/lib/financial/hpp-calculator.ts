import { Decimal } from "decimal.js";

/**
 * Casa Moral Financial Engine — HPP Calculator
 * Implements both:
 * 1. Mode Standard (Empirical Overhead Multiplier 1.20x - Casa Moral Historical)
 * 2. Mode Advanced (Time-Based Production Slicing - Template ELS Studio)
 */

export interface StandardHppInput {
  filamentGram: number;
  filamentPricePerKg?: number; // default Rp 180.000 / kg
  electricalCost?: number;     // default Rp 31.700 (Fitting 6k + LED 15k + Kabel 10k + Pelindung 700)
  packagingCost?: number;      // default Rp 6.500 (Kardus 4.5k + Bubble 2k)
  overheadMultiplier?: number; // default 1.20 (+20% for electricity & machine depreciation)
}

export interface StandardHppResult {
  filamentCost: number;
  electricalCost: number;
  packagingCost: number;
  subtotalMaterial: number;
  overheadMultiplier: number;
  overheadSurcharge: number;
  totalHpp: number;
}

/**
 * Calculate HPP using Casa Moral Standard Mode (Historical Multiplier 1.2x)
 */
export function calculateStandardHpp(input: StandardHppInput): StandardHppResult {
  const pricePerKg = new Decimal(input.filamentPricePerKg ?? 180000);
  const gram = new Decimal(input.filamentGram);
  const electrical = new Decimal(input.electricalCost ?? 31700);
  const packaging = new Decimal(input.packagingCost ?? 6500);
  const multiplier = new Decimal(input.overheadMultiplier ?? 1.2);

  // Filament cost = (gram / 1000) * pricePerKg
  const filamentCost = gram.dividedBy(1000).times(pricePerKg);
  const subtotalMaterial = filamentCost.plus(electrical).plus(packaging);
  const totalHpp = subtotalMaterial.times(multiplier);
  const overheadSurcharge = totalHpp.minus(subtotalMaterial);

  return {
    filamentCost: filamentCost.toDecimalPlaces(2).toNumber(),
    electricalCost: electrical.toDecimalPlaces(2).toNumber(),
    packagingCost: packaging.toDecimalPlaces(2).toNumber(),
    subtotalMaterial: subtotalMaterial.toDecimalPlaces(2).toNumber(),
    overheadMultiplier: multiplier.toNumber(),
    overheadSurcharge: overheadSurcharge.toDecimalPlaces(2).toNumber(),
    totalHpp: totalHpp.toDecimalPlaces(2).toNumber(),
  };
}

export interface AdvancedHppInput {
  filamentGram: number;
  filamentPricePerKg: number;
  purgeWasteFactor?: number;      // e.g. 0.05 for 5% waste
  printTimeMinutes: number;
  printerPowerWatts: number;      // e.g. 60W (A1 Mini), 110W (A1 / Kobra X), 100W (P1S)
  electricityRatePerKwh?: number; // e.g. Rp 1.666 / kWh
  depreciationPerHour: number;    // e.g. Rp 2.083,06 / hour
  rejectRate?: number;            // e.g. 0.08 (8% failure rate)
  accessoriesCost?: number;       // total accessories (carabiner, switch, etc.)
  packagingCost?: number;         // box, bubble wrap, stiker
  staffPackingAllocation?: number;// e.g. Gaji staff / volume (Rp 2.222,22)
}

export interface AdvancedHppResult {
  filamentCost: number;
  electricityCost: number;
  depreciationCost: number;
  failureCost: number;
  accessoriesCost: number;
  packagingCost: number;
  staffCost: number;
  totalHpp: number;
}

/**
 * Calculate HPP using Advanced Mode (Time-based Engineering Slicing per Template ELS Studio)
 */
export function calculateAdvancedHpp(input: AdvancedHppInput): AdvancedHppResult {
  const gram = new Decimal(input.filamentGram);
  const priceKg = new Decimal(input.filamentPricePerKg);
  const purgeRate = new Decimal(input.purgeWasteFactor ?? 0);
  const printMinutes = new Decimal(input.printTimeMinutes);
  const watts = new Decimal(input.printerPowerWatts);
  const electricityTariff = new Decimal(input.electricityRatePerKwh ?? 1666);
  const depPerHour = new Decimal(input.depreciationPerHour);
  const reject = new Decimal(input.rejectRate ?? 0.08);
  const accessories = new Decimal(input.accessoriesCost ?? 0);
  const packaging = new Decimal(input.packagingCost ?? 0);
  const staff = new Decimal(input.staffPackingAllocation ?? 0);

  // 1. Biaya Filamen = (gram / 1000) * priceKg * (1 + purgeRate)
  const filamentCost = gram
    .dividedBy(1000)
    .times(priceKg)
    .times(new Decimal(1).plus(purgeRate));

  // 2. Biaya Listrik = (menit / 60) * (watts / 1000) * tariff
  const hours = printMinutes.dividedBy(60);
  const electricityCost = hours.times(watts.dividedBy(1000)).times(electricityTariff);

  // 3. Biaya Depresiasi Mesin = (menit / 60) * depPerHour
  const depreciationCost = hours.times(depPerHour);

  // 4. Biaya Kegagalan Print = (Filamen + Listrik + Depresiasi) * (reject / (1 - reject))
  const machineDirectCost = filamentCost.plus(electricityCost).plus(depreciationCost);
  const failureCost = reject.isZero()
    ? new Decimal(0)
    : machineDirectCost.times(reject.dividedBy(new Decimal(1).minus(reject)));

  // 5. Total HPP = Sum of all components
  const totalHpp = filamentCost
    .plus(electricityCost)
    .plus(depreciationCost)
    .plus(failureCost)
    .plus(accessories)
    .plus(packaging)
    .plus(staff);

  return {
    filamentCost: filamentCost.toDecimalPlaces(2).toNumber(),
    electricityCost: electricityCost.toDecimalPlaces(2).toNumber(),
    depreciationCost: depreciationCost.toDecimalPlaces(2).toNumber(),
    failureCost: failureCost.toDecimalPlaces(2).toNumber(),
    accessoriesCost: accessories.toDecimalPlaces(2).toNumber(),
    packagingCost: packaging.toDecimalPlaces(2).toNumber(),
    staffCost: staff.toDecimalPlaces(2).toNumber(),
    totalHpp: totalHpp.toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Calculate machine hourly depreciation rate using straight-line method:
 * Depreciation/Hour = ((PurchasePrice - ResidualValue) / UsefulLifeMonths) / EstimatedHoursPerMonth
 */
export function calculateDepreciationPerHour(
  purchasePrice: number,
  residualValue: number,
  usefulLifeMonths: number,
  estimatedHoursPerMonth: number
): number {
  if (usefulLifeMonths <= 0 || estimatedHoursPerMonth <= 0) return 0;

  const cost = new Decimal(purchasePrice).minus(new Decimal(residualValue));
  const monthlyDep = cost.dividedBy(new Decimal(usefulLifeMonths));
  const hourlyDep = monthlyDep.dividedBy(new Decimal(estimatedHoursPerMonth));

  return hourlyDep.toDecimalPlaces(4).toNumber();
}
