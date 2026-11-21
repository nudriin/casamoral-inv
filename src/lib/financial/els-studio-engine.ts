import Decimal from "decimal.js";

/**
 * ELS STUDIO 3D Printing HPP & Financial Engine
 * Replicates and extends "Template ELS STUDIO.xlsx"
 */

export interface ElsFilamentPrice {
  id: string;
  brand: string;
  type: string;
  pricePerKg: number;
  notes?: string;
}

export interface ElsPrinterConfig {
  id: string;
  name: string;
  powerWatts: number;
  usefulLifeMonths: number;
  notes?: string;
}

export interface ElsDepreciationAsset {
  id: string;
  name: string;
  purchasePrice: number;
  residualValue: number;
  usefulLifeMonths: number;
  estimatedHoursPerMonth: number;
  notes?: string;
}

export interface ElsAccessoryPrice {
  id: string;
  name: string;
  price: number;
  unit: string;
  notes?: string;
}

export interface ElsProductItem {
  id: string;
  no: number;
  name: string;
  printer: string;             // e.g. "A1", "A1 mini", "P1S"
  filamentBrand: string;       // e.g. "Bambu Lab (Original)", "Elegoo", "Trede"
  weightGram: number;          // e.g. 16 gram
  printTimeMinutes: number;    // e.g. 45 menit
  purgeWasteFactor: number;    // e.g. 0.05 (5%) or 0.10 (10%)
  paracordMeter?: number;      // e.g. 1.0 m (legacy / template)
  carabinerPcs?: number;       // e.g. 1 pcs (legacy / template)
  switchPcs?: number;          // e.g. 4 pcs (legacy / template)
  nfcPcs?: number;             // e.g. 1 pcs (legacy / template)
  accessoryQuantities?: Record<string, number>; // Dynamic accessory id -> quantity (matches Section C)
  packagingPackage: number;    // 1 if included, 0 if not
  customHardwareCost?: number; // optional custom accessories
  sellingPrice: number;        // e.g. Rp 49.000
  freeShippingXtra: boolean;   // Y / N
}

export interface ElsProductCalculatedResult {
  filamentCost: number;
  electricityCost: number;
  depreciationCost: number;
  failureCost: number;         // Hidden cost from reject rate
  paracordCost: number;
  carabinerCost: number;
  nfcCost: number;
  switchCost: number;
  totalAccessoriesCost: number; // Sum of all dynamic accessories costs
  packagingCost: number;
  staffPackingCost: number;
  totalHpp: number;
  adminShopeeCost: number;
  orderProcessingFee?: number;
  pph22Cost?: number;
  freeShippingCost: number;
  totalMarketplaceFees?: number;
  netRealizedRevenue?: number;
  grossProfit: number;
  grossMarginPercent: number;
  markupPercent: number;
}

export interface ElsOverheadConfig {
  designerSalary: number;            // Gaji Desainer 3D (e.g. Rp 3.000.000)
  commercialLicense: number;         // Lisensi Desain MakerWorld/Patreon (e.g. Rp 150.000)
  nonProdElectricity: number;        // Listrik Non-Produksi (e.g. Rp 150.000)
  consumablesFinishing: number;      // Consumables Amplas/Lem/IPA/K3 (e.g. Rp 143.000)
  internetSoftware: number;          // Internet & Software (e.g. Rp 300.000)
  adsBudget: number;                 // Iklan Meta & Google Ads (e.g. Rp 1.500.000)
  rentCost: number;                  // Sewa Tempat (e.g. Rp 0)
  maintenanceCost: number;           // Maintenance Rutin Nozzle/Pelumas (e.g. Rp 200.000)
  otherExpenses: number;             // Biaya Lain-lain (e.g. Rp 100.000)
}

export interface ElsOverheadItem {
  id: string;
  name: string;
  amount: number;
  notes?: string;
  isActive?: boolean;
}

export interface ElsCapitalConfig {
  printersTotal: number;             // Total Harga Printer
  initialFilamentStock: number;      // Stok Filament Awal (e.g. Rp 2.000.000)
  initialAccessoriesStock: number;   // Stok Aksesoris & Packing Awal (e.g. Rp 1.000.000)
  finishingTools: number;            // Peralatan Finishing (e.g. Rp 120.000)
  brandingSetup: number;             // Biaya Branding & Setup Toko (e.g. Rp 500.000)
}

export interface ElsStudioSummary {
  totalInitialCapital: number;
  totalOverheadMonthly: number;
  averageSellingPrice: number;
  averageHpp: number;
  averageGrossProfitPerUnit: number;
  averageMarginPercent: number;
  bepUnitsMonthly: number;
  bepUnitsDaily: number;
  bepRevenueMonthly: number;
  estimatedUnitsMonthly: number;
  estimatedMonthlyGrossProfit: number;
  estimatedMonthlyNetProfit: number;
  paybackPeriodMonths: number;
  totalMonthlyDepreciation: number;
  totalMonthlyStaffSalary: number;
}

// ============================================================================
// DEFAULT REFERENCE DATA FROM TEMPLATE ELS STUDIO.XLSX
// ============================================================================

export const DEFAULT_ELS_FILAMENTS: ElsFilamentPrice[] = [
  { id: "fil-bambu", brand: "Bambu Lab (Original)", type: "PLA Basic", pricePerKg: 180000, notes: "Original premium, warna konsisten" },
  { id: "fil-elegoo", brand: "Elegoo", type: "PLA", pricePerKg: 180000, notes: "Rata-rata Shopee/Tokopedia" },
  { id: "fil-sunlu", brand: "Sunlu", type: "PLA+", pricePerKg: 180000, notes: "SUNLU PLA+/PLA Plus Pro" },
  { id: "fil-esun", brand: "Esun", type: "PLA+/ePLA", pricePerKg: 180000, notes: "eSUN PLA+/ePLA IndoCart" },
  { id: "fil-trede", brand: "Trede", type: "PLA", pricePerKg: 140000, notes: "Brand lokal ekonomis" },
  { id: "fil-indocart", brand: "Indocart", type: "PLA Basic", pricePerKg: 125000, notes: "House-brand IndoCart" },
];

export const DEFAULT_ELS_PRINTERS: ElsPrinterConfig[] = [
  { id: "prt-a1mini", name: "A1 mini", powerWatts: 60, usefulLifeMonths: 24, notes: "Termasuk heat bed & nozzle (idle ~6W)" },
  { id: "prt-a1", name: "A1", powerWatts: 110, usefulLifeMonths: 24, notes: "Bed lebih besar, daya heating lebih tinggi" },
  { id: "prt-p1s", name: "P1S", powerWatts: 100, usefulLifeMonths: 30, notes: "Enclosed chamber, stabil untuk ABS/ASA" },
  { id: "prt-kobra", name: "Anycubic Kobra X", powerWatts: 350, usefulLifeMonths: 24, notes: "Printer 3D Casa Moral Studio" },
];

export const DEFAULT_ELS_DEPRECIATION_ASSETS: ElsDepreciationAsset[] = [
  { id: "dep-a1mini", name: "A1 mini", purchasePrice: 7999000, residualValue: 500000, usefulLifeMonths: 24, estimatedHoursPerMonth: 150, notes: "Unit Combo dgn AMS lite" },
  { id: "dep-a1", name: "A1", purchasePrice: 9999000, residualValue: 500000, usefulLifeMonths: 24, estimatedHoursPerMonth: 150, notes: "Unit Combo dgn AMS lite" },
  { id: "dep-p1s", name: "P1S", purchasePrice: 13999000, residualValue: 800000, usefulLifeMonths: 30, estimatedHoursPerMonth: 150, notes: "Unit Combo dgn AMS 2 Pro" },
  { id: "dep-pc", name: "Laptop/PC Desain", purchasePrice: 8000000, residualValue: 1000000, usefulLifeMonths: 36, estimatedHoursPerMonth: 200, notes: "Dipakai modeling & slicing" },
  { id: "dep-tools", name: "Tools & Alat Kalibrasi", purchasePrice: 500000, residualValue: 0, usefulLifeMonths: 24, estimatedHoursPerMonth: 100, notes: "Obeng set, feeler gauge, dll" },
];

export const DEFAULT_ELS_ACCESSORIES: ElsAccessoryPrice[] = [
  { id: "acc-paracord", name: "Paracord", price: 4000, unit: "per meter", notes: "Gantungan tas/keychain" },
  { id: "acc-carabiner", name: "Carabiner / Gantungan Kunci", price: 1500, unit: "per pcs", notes: "Pengait tas" },
  { id: "acc-switch", name: "Switch Mechanical Clicker", price: 1200, unit: "per pcs", notes: "Outemu Blue/Kailh" },
  { id: "acc-nfc", name: "Sticker NFC", price: 1500, unit: "per paket", notes: "NTAG213/215" },
  { id: "acc-opp", name: "Plastik OPP / Clip Bag", price: 500, unit: "per pcs", notes: "Kemasan dasar" },
  { id: "acc-box", name: "Kardus / Box Kecil", price: 1500, unit: "per pcs", notes: "Kemasan kardus luar" },
  { id: "acc-bubble", name: "Bubble Wrap", price: 500, unit: "per pcs", notes: "Proteksi pengiriman" },
  { id: "acc-stiker", name: "Kartu Ucapan / Stiker Brand", price: 300, unit: "per pcs", notes: "Branding" },
  { id: "acc-gantungan", name: "Gantungan Kunci Logam", price: 380, unit: "per pcs", notes: "Ring besi" },
  { id: "acc-tumb", name: "Tali Karet Tumbler", price: 550, unit: "per pcs", notes: "Silikon/karet" },
];

export const DEFAULT_ELS_PRODUCTS: ElsProductItem[] = [
  {
    id: "els-p1",
    no: 1,
    name: "BTS ARIRANG 4 CAP",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 16.0,
    printTimeMinutes: 45.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 1.0,
    carabinerPcs: 1.0,
    switchPcs: 4.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 49000,
    freeShippingXtra: true,
  },
  {
    id: "els-p2",
    no: 2,
    name: "ARIRANG VINYL NFC",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 12.0,
    printTimeMinutes: 47.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 1.0,
    carabinerPcs: 0,
    switchPcs: 0,
    nfcPcs: 1.0,
    packagingPackage: 1,
    sellingPrice: 22000,
    freeShippingXtra: true,
  },
  {
    id: "els-p3",
    no: 3,
    name: "Ornamen Gantung Medium",
    printer: "A1",
    filamentBrand: "Elegoo",
    weightGram: 35.0,
    printTimeMinutes: 70.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 0,
    carabinerPcs: 1.0,
    switchPcs: 1.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 45000,
    freeShippingXtra: false,
  },
  {
    id: "els-p4",
    no: 4,
    name: "Ornamen Besar Multi-warna (AMS)",
    printer: "P1S",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 60.0,
    printTimeMinutes: 120.0,
    purgeWasteFactor: 0.10,
    paracordMeter: 0,
    carabinerPcs: 0,
    switchPcs: 0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 95000,
    freeShippingXtra: false,
  },
  {
    id: "els-p5",
    no: 5,
    name: "Set Gantungan Bundle isi 3",
    printer: "A1 mini",
    filamentBrand: "Trede",
    weightGram: 20.0,
    printTimeMinutes: 60.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 0.3,
    carabinerPcs: 3.0,
    switchPcs: 3.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 40000,
    freeShippingXtra: true,
  },
  {
    id: "els-p6",
    no: 6,
    name: "Dubai Chewy Cookie",
    printer: "A1 mini",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 24.0,
    printTimeMinutes: 80.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 0,
    carabinerPcs: 0,
    switchPcs: 1.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 25000,
    freeShippingXtra: true,
  },
  {
    id: "els-p7",
    no: 7,
    name: "Lipbalm Holder",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 17.0,
    printTimeMinutes: 62.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 0,
    carabinerPcs: 1.0,
    switchPcs: 0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 20000,
    freeShippingXtra: true,
  },
  {
    id: "els-p8",
    no: 8,
    name: "Cookies Love Red",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 15.0,
    printTimeMinutes: 40.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 0,
    carabinerPcs: 1.0,
    switchPcs: 1.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 28000,
    freeShippingXtra: true,
  },
  {
    id: "els-p9",
    no: 9,
    name: "Tumbler Pink Gantungan",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 12.0,
    printTimeMinutes: 52.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 0,
    carabinerPcs: 1.0,
    switchPcs: 0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 20000,
    freeShippingXtra: true,
  },
  {
    id: "els-p10",
    no: 10,
    name: "Kucing Oren Clicker",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 59.0,
    printTimeMinutes: 60.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 0,
    carabinerPcs: 0,
    switchPcs: 1.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 25000,
    freeShippingXtra: true,
  },
  {
    id: "els-p11",
    no: 11,
    name: "Keyboard 1 Huruf Blue",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 10.0,
    printTimeMinutes: 20.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 1.0,
    carabinerPcs: 1.0,
    switchPcs: 1.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 20000,
    freeShippingXtra: true,
  },
  {
    id: "els-p12",
    no: 12,
    name: "Keyboard 2 Huruf Dual",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 10.0,
    printTimeMinutes: 20.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 1.0,
    carabinerPcs: 1.0,
    switchPcs: 2.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 26000,
    freeShippingXtra: true,
  },
  {
    id: "els-p13",
    no: 13,
    name: "Keyboard 3 Huruf Triple",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 10.0,
    printTimeMinutes: 20.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 1.0,
    carabinerPcs: 1.0,
    switchPcs: 3.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 28000,
    freeShippingXtra: true,
  },
  {
    id: "els-p14",
    no: 14,
    name: "Keyboard 4 Huruf Quad",
    printer: "A1",
    filamentBrand: "Bambu Lab (Original)",
    weightGram: 10.0,
    printTimeMinutes: 20.0,
    purgeWasteFactor: 0.05,
    paracordMeter: 1.0,
    carabinerPcs: 1.0,
    switchPcs: 4.0,
    nfcPcs: 0,
    packagingPackage: 1,
    sellingPrice: 30000,
    freeShippingXtra: true,
  },
];

export const DEFAULT_ELS_OVERHEAD: ElsOverheadConfig = {
  designerSalary: 20000, // Excel Sheet 5 Row 6 B6: 20.000 (total overhead sum B6:B14 = 2.563.000)
  commercialLicense: 150000,
  nonProdElectricity: 150000,
  consumablesFinishing: 143000,
  internetSoftware: 300000,
  adsBudget: 1500000,
  rentCost: 0,
  maintenanceCost: 200000,
  otherExpenses: 100000,
};

export const DEFAULT_ELS_OVERHEAD_ITEMS: ElsOverheadItem[] = [
  { id: "ovh-1", name: "Gaji Desainer 3D", amount: 20000, notes: "Dianggap overhead desain (bisa 0 jika tanpa desainer)", isActive: true },
  { id: "ovh-2", name: "Lisensi Desain Komersial (MakerWorld/Patreon)", amount: 150000, notes: "Bisa 0 jika pakai desain sendiri", isActive: true },
  { id: "ovh-3", name: "Listrik Non-Produksi", amount: 150000, notes: "Lampu, router wifi, laptop desain", isActive: true },
  { id: "ovh-4", name: "Consumables Finishing & K3", amount: 143000, notes: "Amplas, lem, IPA, sarung tangan, masker", isActive: true },
  { id: "ovh-5", name: "Internet & Software Slicer", amount: 300000, notes: "Wifi studio & langganan software", isActive: true },
  { id: "ovh-6", name: "Iklan Meta & Google Ads", amount: 1500000, notes: "Budget ads bulanan", isActive: true },
  { id: "ovh-7", name: "Sewa Tempat / Ruang Usaha", amount: 0, notes: "Isi 0 jika usaha di rumah sendiri", isActive: true },
  { id: "ovh-8", name: "Maintenance Rutin & Sparepart", amount: 200000, notes: "Nozzle, pelumas, pembersih bed", isActive: true },
  { id: "ovh-9", name: "Biaya Operasional Lain-lain & ATK", amount: 100000, notes: "Transport, ATK, lakban ekstra", isActive: true },
];

export const DEFAULT_ELS_CAPITAL: ElsCapitalConfig = {
  printersTotal: 31997000, // Template Excel ELS Studio: A1 mini (7.999.000) + A1 (9.999.000) + P1S (13.999.000)
  initialFilamentStock: 2000000,
  initialAccessoriesStock: 1000000,
  finishingTools: 120000, // tang (35k) + korek (55k) + cutter (15k) + spatula (15k)
  brandingSetup: 500000,
};

// Modal Riil Usaha Casa Moral (sesuai 43 transaksi belanja modal di menu Modal & Aset = Rp 14.811.820)
export const CASAMORAL_REAL_CAPITAL: ElsCapitalConfig = {
  printersTotal: 9460021, // Bambulab A1 Mini (3.589.221) + Anycubic Kobra X (5.870.800)
  initialFilamentStock: 2640818, // Stok filamen eSUN, IndoCart & Elegoo (11 transaksi CSV)
  initialAccessoriesStock: 1926882, // Kelistrikan (1.407.828) + Kemasan (519.054)
  finishingTools: 784099, // Meja printer, heat gun, dry box, caliper, magnet, stempel, Mr.DIY
  brandingSetup: 0,
};

export const CASAMORAL_REAL_FILAMENTS: ElsFilamentPrice[] = [
  { id: "cm-fil-esun", brand: "eSUN PETG / PLA", type: "PETG/PLA", pricePerKg: 135000, notes: "Rata-rata pembelian eSUN" },
  { id: "cm-fil-indocart", brand: "IndoCart PLA Basic", type: "PLA Basic", pricePerKg: 137000, notes: "Rata-rata pembelian IndoCart" },
  { id: "cm-fil-elegoo", brand: "Elegoo PLA White", type: "PLA", pricePerKg: 133300, notes: "Pembelian Elegoo 14/11/2026" },
  { id: "cm-fil-std", brand: "Standar HPP Casa Moral", type: "PLA/PETG", pricePerKg: 180000, notes: "Acuan konservatif Excel V2" },
];

export const CASAMORAL_REAL_PRINTERS: ElsPrinterConfig[] = [
  { id: "cm-prt-a1mini", name: "Bambulab A1 Mini", powerWatts: 60, usefulLifeMonths: 24, notes: "Printer utama Casa Moral (60W rata-rata)" },
  { id: "cm-prt-kobra", name: "Anycubic Kobra X", powerWatts: 110, usefulLifeMonths: 24, notes: "Printer kedua Casa Moral (110W rata-rata)" },
];

export const CASAMORAL_REAL_DEPRECIATION_ASSETS: ElsDepreciationAsset[] = [
  { id: "cm-dep-a1mini", name: "Bambulab A1 Mini", purchasePrice: 3589221, residualValue: 500000, usefulLifeMonths: 24, estimatedHoursPerMonth: 150, notes: "Harga perolehan CSV 23/09/2026" },
  { id: "cm-dep-kobra", name: "Anycubic Kobra X", purchasePrice: 5870800, residualValue: 500000, usefulLifeMonths: 24, estimatedHoursPerMonth: 150, notes: "Harga perolehan CSV 14/10/2026" },
  { id: "cm-dep-tools", name: "Peralatan Workshop & Meja", purchasePrice: 784099, residualValue: 0, usefulLifeMonths: 24, estimatedHoursPerMonth: 150, notes: "Meja, Heat Gun, Dry Box, Caliper, dll." },
];

// Komponen & Pemakaian Kemasan Real Casa Moral per Pesanan
export const CASAMORAL_REAL_ACCESSORIES: ElsAccessoryPrice[] = [
  { id: "cm-acc-led", name: "Lampu Inlite LED 3W", price: 14800, unit: "per pcs", notes: "Harga pembelian terakhir Rp 14.800/pcs" },
  { id: "cm-acc-fitting", name: "Fitting E27", price: 5700, unit: "per pcs", notes: "Fitting lampu E27" },
  { id: "cm-acc-kabel", name: "Kabel Sakelar On/Off", price: 9360, unit: "per pcs", notes: "Kabel sakelar lampu" },
  { id: "cm-acc-karet", name: "Karet Pelindung Kabel", price: 675, unit: "per pcs", notes: "Grommet pelindung kabel" },
  { id: "cm-acc-skun", name: "Skun Jarum Pipih", price: 333, unit: "per pcs", notes: "Pemakaian real: 2 pcs per pesanan (Rp 666)" },
  { id: "cm-acc-kardus", name: "Kardus Packing 20x20x20", price: 3500, unit: "per pcs", notes: "Box kemasan luar" },
  { id: "cm-acc-bubble", name: "Bubble Wrap 30cm (cm)", price: 15, unit: "per cm", notes: "Pemakaian real: 240 cm per pesanan (Rp 3.600)" },
  { id: "cm-acc-honeycomb", name: "Kertas Packing Honeycomb (cm)", price: 19.27, unit: "per cm", notes: "Pemakaian real: 160 cm per pesanan (~Rp 3.083)" },
  { id: "cm-acc-isolasi", name: "Isolasi / Lakban Packing (Estimasi)", price: 500, unit: "per pesanan", notes: "Estimasi pemakaian isolasi per pesanan (dapat disesuaikan)" },
  { id: "cm-acc-lem", name: "Lem Adhesive (Estimasi)", price: 1000, unit: "per pesanan", notes: "Estimasi pemakaian lem adhesive per pesanan (dapat disesuaikan)" },
];

const DEFAULT_LAMP_ACCESSORIES: Record<string, number> = {
  "cm-acc-led": 1,
  "cm-acc-fitting": 1,
  "cm-acc-kabel": 1,
  "cm-acc-karet": 1,
  "cm-acc-skun": 2,
  "cm-acc-kardus": 1,
  "cm-acc-bubble": 240,
  "cm-acc-honeycomb": 160,
  "cm-acc-isolasi": 1,
  "cm-acc-lem": 1,
};

export const CASAMORAL_REAL_PRODUCTS: ElsProductItem[] = [
  { id: "prod-01", no: 1, name: "Lumi", printer: "Bambulab A1 Mini", filamentBrand: "Standar HPP Casa Moral", weightGram: 166.4, printTimeMinutes: 240, purgeWasteFactor: 0.05, accessoryQuantities: { ...DEFAULT_LAMP_ACCESSORIES }, packagingPackage: 0, sellingPrice: 130000, freeShippingXtra: true },
  { id: "prod-02", no: 2, name: "Ollie", printer: "Bambulab A1 Mini", filamentBrand: "Standar HPP Casa Moral", weightGram: 203.08, printTimeMinutes: 533, purgeWasteFactor: 0.05, accessoryQuantities: { ...DEFAULT_LAMP_ACCESSORIES }, packagingPackage: 0, sellingPrice: 150000, freeShippingXtra: true },
  { id: "prod-03", no: 3, name: "Kumo", printer: "Bambulab A1 Mini", filamentBrand: "Standar HPP Casa Moral", weightGram: 170.13, printTimeMinutes: 270, purgeWasteFactor: 0.05, accessoryQuantities: { ...DEFAULT_LAMP_ACCESSORIES }, packagingPackage: 0, sellingPrice: 135000, freeShippingXtra: true },
  { id: "prod-04", no: 4, name: "Pomi", printer: "Bambulab A1 Mini", filamentBrand: "Standar HPP Casa Moral", weightGram: 268.76, printTimeMinutes: 360, purgeWasteFactor: 0.05, accessoryQuantities: { ...DEFAULT_LAMP_ACCESSORIES }, packagingPackage: 0, sellingPrice: 150000, freeShippingXtra: true },
  { id: "prod-05", no: 5, name: "Nomi", printer: "Bambulab A1 Mini", filamentBrand: "Standar HPP Casa Moral", weightGram: 190.0, printTimeMinutes: 280, purgeWasteFactor: 0.05, accessoryQuantities: { ...DEFAULT_LAMP_ACCESSORIES }, packagingPackage: 0, sellingPrice: 140000, freeShippingXtra: true },
  { id: "prod-06", no: 6, name: "Lyra", printer: "Bambulab A1 Mini", filamentBrand: "Standar HPP Casa Moral", weightGram: 233.32, printTimeMinutes: 330, purgeWasteFactor: 0.05, accessoryQuantities: { ...DEFAULT_LAMP_ACCESSORIES }, packagingPackage: 0, sellingPrice: 190000, freeShippingXtra: true },
];

// ============================================================================
// CALCULATION LOGIC IMPLEMENTATION WITH DECIMAL.JS
// ============================================================================

export interface ElsCalculationAssumptions {
  electricityTariffPLN: number;     // e.g. Rp 1.666 / kWh
  rejectRate: number;               // e.g. 0.08 (8%)
  adminShopeeRate: number;          // e.g. 0.095 (9.5% Biaya Administrasi)
  orderProcessingFee?: number;      // e.g. Rp 1.250 Biaya Proses Pesanan Flat
  pph22Rate?: number;               // e.g. 0.005 (0.5% PPh 22 Final)
  freeShippingRate: number;         // e.g. 0.04 (4%)
  freeShippingMaxCap: number;       // e.g. Rp 10.000
  staffPackingSalary: number;       // e.g. Rp 1.000.000 / month
  targetMonthlyUnits: number;       // e.g. 450 units
  packagingPackagePrice: number;    // e.g. Rp 4.300 (box + opp + bubble + stiker + nfc)
}

export const DEFAULT_ELS_ASSUMPTIONS: ElsCalculationAssumptions = {
  electricityTariffPLN: 1666,
  rejectRate: 0.08,
  adminShopeeRate: 0.08,
  orderProcessingFee: 0,
  pph22Rate: 0,
  freeShippingRate: 0.04,
  freeShippingMaxCap: 10000,
  staffPackingSalary: 1000000,
  targetMonthlyUnits: 450,
  packagingPackagePrice: 4300,
};

// Preset Presisi Toko Shopee Casa Moral (sesuai invoice riil: 9.5% admin + Rp 1.250 proses + 0.5% PPh 22)
export const CASAMORAL_SHOPEE_ASSUMPTIONS: ElsCalculationAssumptions = {
  electricityTariffPLN: 1666,
  rejectRate: 0.08,
  adminShopeeRate: 0.095,      // 9.5% Biaya Administrasi
  orderProcessingFee: 1250,    // Rp 1.250 Biaya Proses Pesanan Flat
  pph22Rate: 0.005,            // 0.5% PPh 22 Final
  freeShippingRate: 0.0,
  freeShippingMaxCap: 10000,
  staffPackingSalary: 1000000,
  targetMonthlyUnits: 450,
  packagingPackagePrice: 4300,
};

/**
 * Calculates hourly depreciation for all assets
 */
export function calculateAssetsDepreciation(assets: ElsDepreciationAsset[]): Map<string, { monthly: number; hourly: number }> {
  const map = new Map<string, { monthly: number; hourly: number }>();

  for (const a of assets) {
    const buy = new Decimal(a.purchasePrice);
    const residual = new Decimal(a.residualValue);
    const months = new Decimal(a.usefulLifeMonths || 1);
    const hours = new Decimal(a.estimatedHoursPerMonth || 1);

    const monthly = buy.minus(residual).dividedBy(months);
    const hourly = hours.isZero() ? new Decimal(0) : monthly.dividedBy(hours);

    map.set(a.name, {
      monthly: monthly.toDecimalPlaces(2).toNumber(),
      hourly: hourly.toDecimalPlaces(6).toNumber(),
    });
  }

  return map;
}

/**
 * Calculates HPP and margin for a single product according to Template ELS Studio Sheet 4
 */
export function calculateElsProductRow(
  product: ElsProductItem,
  assumptions: ElsCalculationAssumptions,
  filaments: ElsFilamentPrice[],
  printers: ElsPrinterConfig[],
  accessories: ElsAccessoryPrice[],
  depreciationMap: Map<string, { monthly: number; hourly: number }>
): ElsProductCalculatedResult {
  // 1. Filament Cost: =(Berat/1000) * HargaPerKg * (1 + PurgeWasteFactor)
  const fil = filaments.find((f) => f.brand.toLowerCase() === product.filamentBrand.toLowerCase()) || filaments[0];
  const priceKg = new Decimal(fil ? fil.pricePerKg : 180000);
  const weight = new Decimal(product.weightGram);
  const purge = new Decimal(product.purgeWasteFactor || 0);

  const filamentCost = weight
    .dividedBy(1000)
    .times(priceKg)
    .times(new Decimal(1).plus(purge));

  // 2. Electricity Cost: =(Menit/60) * (Watts/1000) * TarifPLN
  const prt = printers.find((p) => p.name.toLowerCase() === product.printer.toLowerCase()) || printers[0];
  const watts = new Decimal(prt ? prt.powerWatts : 110);
  const printHours = new Decimal(product.printTimeMinutes).dividedBy(60);
  const tariff = new Decimal(assumptions.electricityTariffPLN);

  const electricityCost = printHours.times(watts.dividedBy(1000)).times(tariff);

  // 3. Machine Depreciation Cost: =(Menit/60) * DeprPerHour
  const depInfo = depreciationMap.get(product.printer) || { hourly: 2638.61 };
  const depPerHour = new Decimal(depInfo.hourly);
  const depreciationCost = printHours.times(depPerHour);

  // 4. Print Failure Cost (Hidden Cost): =(Filamen + Listrik + Depresiasi) * (RejectRate / (1 - RejectRate))
  const directMachineCost = filamentCost.plus(electricityCost).plus(depreciationCost);
  const reject = new Decimal(assumptions.rejectRate);
  const failureMultiplier = reject.dividedBy(new Decimal(1).minus(reject));
  const failureCost = directMachineCost.times(failureMultiplier);

  // 5. Dynamic Accessories Cost (from Section C Daftar Harga Aksesoris)
  let totalAccessoriesCost = new Decimal(0);
  let paracordCost = new Decimal(0);
  let carabinerCost = new Decimal(0);
  let switchCost = new Decimal(0);
  let nfcCost = new Decimal(0);

  for (const acc of accessories) {
    const unitPrice = new Decimal(acc.price || 0);

    // Look up quantity from dynamic accessoryQuantities or fallback to legacy product fields
    let qty = 0;
    if (product.accessoryQuantities && (product.accessoryQuantities[acc.id] !== undefined || product.accessoryQuantities[acc.name] !== undefined)) {
      qty = product.accessoryQuantities[acc.id] ?? product.accessoryQuantities[acc.name] ?? 0;
    } else {
      if (acc.name.toLowerCase().includes("paracord") || (acc.id === "acc-paracord" && acc.name.toLowerCase().includes("paracord"))) {
        qty = product.paracordMeter || 0;
      } else if (acc.name.toLowerCase().includes("carabiner") || (acc.id === "acc-carabiner" && acc.name.toLowerCase().includes("carabiner"))) {
        qty = product.carabinerPcs || 0;
      } else if (acc.name.toLowerCase().includes("switch") || (acc.id === "acc-switch" && acc.name.toLowerCase().includes("switch"))) {
        qty = product.switchPcs || 0;
      } else if (acc.name.toLowerCase().includes("nfc") || (acc.id === "acc-nfc" && acc.name.toLowerCase().includes("nfc"))) {
        qty = product.nfcPcs || 0;
      }
    }

    const itemCost = new Decimal(qty).times(unitPrice);
    totalAccessoriesCost = totalAccessoriesCost.plus(itemCost);

    if (acc.name.toLowerCase().includes("paracord")) {
      paracordCost = itemCost;
    } else if (acc.name.toLowerCase().includes("carabiner")) {
      carabinerCost = itemCost;
    } else if (acc.name.toLowerCase().includes("switch")) {
      switchCost = itemCost;
    } else if (acc.name.toLowerCase().includes("nfc")) {
      nfcCost = itemCost;
    }
  }

  const customHwCost = new Decimal(product.customHardwareCost || 0);
  totalAccessoriesCost = totalAccessoriesCost.plus(customHwCost);

  // 6. Packaging Cost: =PaketPacking * PaketPrice
  const packagingCost = new Decimal(product.packagingPackage || 0).times(assumptions.packagingPackagePrice);

  // 7. Staff Packing Allocation: =GajiStaff / TargetMonthlyUnits
  const targetUnits = new Decimal(assumptions.targetMonthlyUnits || 1);
  const staffPackingCost = new Decimal(assumptions.staffPackingSalary).dividedBy(targetUnits);

  // 8. Total HPP
  const totalHpp = filamentCost
    .plus(electricityCost)
    .plus(depreciationCost)
    .plus(failureCost)
    .plus(totalAccessoriesCost)
    .plus(packagingCost)
    .plus(staffPackingCost);

  // 9. Platform Fees (Shopee: Admin 9.5% + Biaya Proses Rp 1.250 + PPh 22 0.5%)
  const price = new Decimal(product.sellingPrice || 0);
  const adminShopeeCost = price.times(assumptions.adminShopeeRate || 0);
  const orderProcessingFee = price.isZero() ? new Decimal(0) : new Decimal(assumptions.orderProcessingFee || 0);
  const pph22Cost = price.times(assumptions.pph22Rate || 0);

  let freeShippingCost = new Decimal(0);
  if (product.freeShippingXtra) {
    const rawOngkir = price.times(assumptions.freeShippingRate || 0);
    freeShippingCost = Decimal.min(rawOngkir, assumptions.freeShippingMaxCap || 10000);
  }

  const totalMarketplaceFees = adminShopeeCost
    .plus(orderProcessingFee)
    .plus(pph22Cost)
    .plus(freeShippingCost);
  const netRealizedRevenue = price.minus(totalMarketplaceFees);

  // 10. Gross Profit & Margins
  // Profit Kotor = Harga Jual - Total HPP - Total Biaya Marketplace
  const grossProfit = price.minus(totalHpp).minus(totalMarketplaceFees);

  // Margin (%) = Profit Kotor / Harga Jual
  const grossMarginPercent = price.isZero()
    ? 0
    : grossProfit.dividedBy(price).times(100).toNumber();

  // Markup dari HPP (%) = (Harga Jual - Total HPP) / Total HPP
  const markupPercent = totalHpp.isZero()
    ? 0
    : price.minus(totalHpp).dividedBy(totalHpp).times(100).toNumber();

  return {
    filamentCost: filamentCost.toDecimalPlaces(2).toNumber(),
    electricityCost: electricityCost.toDecimalPlaces(2).toNumber(),
    depreciationCost: depreciationCost.toDecimalPlaces(2).toNumber(),
    failureCost: failureCost.toDecimalPlaces(2).toNumber(),
    paracordCost: paracordCost.toDecimalPlaces(2).toNumber(),
    carabinerCost: carabinerCost.toDecimalPlaces(2).toNumber(),
    nfcCost: nfcCost.toDecimalPlaces(2).toNumber(),
    switchCost: switchCost.toDecimalPlaces(2).toNumber(),
    totalAccessoriesCost: totalAccessoriesCost.toDecimalPlaces(2).toNumber(),
    packagingCost: packagingCost.toDecimalPlaces(2).toNumber(),
    staffPackingCost: staffPackingCost.toDecimalPlaces(2).toNumber(),
    totalHpp: totalHpp.toDecimalPlaces(2).toNumber(),
    adminShopeeCost: adminShopeeCost.toDecimalPlaces(2).toNumber(),
    orderProcessingFee: orderProcessingFee.toDecimalPlaces(2).toNumber(),
    pph22Cost: pph22Cost.toDecimalPlaces(2).toNumber(),
    freeShippingCost: freeShippingCost.toDecimalPlaces(2).toNumber(),
    totalMarketplaceFees: totalMarketplaceFees.toDecimalPlaces(2).toNumber(),
    netRealizedRevenue: netRealizedRevenue.toDecimalPlaces(2).toNumber(),
    grossProfit: grossProfit.toDecimalPlaces(2).toNumber(),
    grossMarginPercent: Number(grossMarginPercent.toFixed(2)),
    markupPercent: Number(markupPercent.toFixed(2)),
  };
}

/**
 * Calculates complete summary, BEP, and payback period matching Sheet 1 & 5
 */
export function calculateElsStudioSummary(
  products: ElsProductItem[],
  assumptions: ElsCalculationAssumptions,
  overhead: ElsOverheadConfig | ElsOverheadItem[],
  capital: ElsCapitalConfig,
  depreciationAssets: ElsDepreciationAsset[],
  filaments: ElsFilamentPrice[],
  printers: ElsPrinterConfig[],
  accessories: ElsAccessoryPrice[]
): ElsStudioSummary {
  const depMap = calculateAssetsDepreciation(depreciationAssets);

  // 1. Total Monthly Depreciation
  let totalMonthlyDepreciation = 0;
  for (const item of depMap.values()) {
    totalMonthlyDepreciation += item.monthly;
  }

  // 2. Total Monthly Overhead (Sheet 5 Row 15)
  let totalOverheadMonthly = 0;
  let designerSalaryAmount = 0;

  if (Array.isArray(overhead)) {
    let sum = new Decimal(0);
    for (const item of overhead) {
      if (item.isActive !== false) {
        sum = sum.plus(item.amount || 0);
        if (item.name.toLowerCase().includes("desain")) {
          designerSalaryAmount = item.amount || 0;
        }
      }
    }
    totalOverheadMonthly = sum.toNumber();
  } else {
    designerSalaryAmount = overhead.designerSalary || 0;
    totalOverheadMonthly = new Decimal(overhead.designerSalary || 0)
      .plus(overhead.commercialLicense || 0)
      .plus(overhead.nonProdElectricity || 0)
      .plus(overhead.consumablesFinishing || 0)
      .plus(overhead.internetSoftware || 0)
      .plus(overhead.adsBudget || 0)
      .plus(overhead.rentCost || 0)
      .plus(overhead.maintenanceCost || 0)
      .plus(overhead.otherExpenses || 0)
      .toNumber();
  }

  // 3. Product Performance Averages (Sheet 5 Section B)
  const calculatedRows = products.map((p) => calculateElsProductRow(p, assumptions, filaments, printers, accessories, depMap));
  const activeCount = calculatedRows.length || 1;

  let sumSellingPrice = 0;
  let sumHpp = 0;
  let sumProfit = 0;
  let sumMargin = 0;

  for (let i = 0; i < calculatedRows.length; i++) {
    const res = calculatedRows[i];
    sumSellingPrice += products[i].sellingPrice;
    sumHpp += res.totalHpp;
    sumProfit += res.grossProfit;
    sumMargin += res.grossMarginPercent;
  }

  const averageSellingPrice = sumSellingPrice / activeCount;
  const averageHpp = sumHpp / activeCount;
  const averageGrossProfitPerUnit = sumProfit / activeCount;
  const averageMarginPercent = sumMargin / activeCount;

  // 4. Break Even Point (BEP) (Sheet 5 Section C)
  // BEP Unit per Bulan = CEILING(Total Overhead / Rata-rata Profit Kotor per Unit, 1)
  const avgProfitDec = new Decimal(averageGrossProfitPerUnit <= 0 ? 1 : averageGrossProfitPerUnit);
  const bepUnitsMonthly = Math.ceil(new Decimal(totalOverheadMonthly).dividedBy(avgProfitDec).toNumber());
  const bepUnitsDaily = Number((bepUnitsMonthly / 30).toFixed(1));
  const bepRevenueMonthly = Math.round(bepUnitsMonthly * averageSellingPrice);

  // 5. Total Initial Capital (Sheet 5 Row 34)
  const totalInitialCapital = new Decimal(capital.printersTotal)
    .plus(capital.initialFilamentStock)
    .plus(capital.initialAccessoriesStock)
    .plus(capital.finishingTools)
    .plus(capital.brandingSetup)
    .toNumber();

  // 6. Monthly Estimated Profit and Payback Period (Sheet 5 Section D)
  const estimatedUnitsMonthly = assumptions.targetMonthlyUnits || 450;
  const estimatedMonthlyGrossProfit = new Decimal(estimatedUnitsMonthly).times(averageGrossProfitPerUnit).toNumber();
  const estimatedMonthlyNetProfit = new Decimal(estimatedMonthlyGrossProfit).minus(totalOverheadMonthly).toNumber();

  // Estimasi Balik Modal = Total Modal Awal / Profit Bersih Bulanan
  const paybackPeriodMonths = estimatedMonthlyNetProfit <= 0
    ? 999
    : Number((totalInitialCapital / estimatedMonthlyNetProfit).toFixed(2));

  // Staff Salary Total (Desainer + Packing)
  const totalMonthlyStaffSalary = new Decimal(designerSalaryAmount)
    .plus(assumptions.staffPackingSalary || 0)
    .toNumber();

  return {
    totalInitialCapital,
    totalOverheadMonthly,
    averageSellingPrice: Math.round(averageSellingPrice),
    averageHpp: Math.round(averageHpp),
    averageGrossProfitPerUnit: Math.round(averageGrossProfitPerUnit),
    averageMarginPercent: Number(averageMarginPercent.toFixed(1)),
    bepUnitsMonthly,
    bepUnitsDaily,
    bepRevenueMonthly,
    estimatedUnitsMonthly,
    estimatedMonthlyGrossProfit: Math.round(estimatedMonthlyGrossProfit),
    estimatedMonthlyNetProfit: Math.round(estimatedMonthlyNetProfit),
    paybackPeriodMonths,
    totalMonthlyDepreciation: Math.round(totalMonthlyDepreciation),
    totalMonthlyStaffSalary,
  };
}
