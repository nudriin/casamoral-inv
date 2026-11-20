import Decimal from "decimal.js";
import { ChannelSource } from "@/types/database";

export interface PlatformFeeBreakdown {
  adminFee: number;
  processFee: number;
  taxFee: number; // PPh 22 (0.5% for Indonesian e-commerce withholding)
  totalFee: number;
  label: string;
  rateDescription: string;
  isMarketplace: boolean;
}

/**
 * Single Source of Truth for marketplace and sales channel fees in Casa Moral.
 *
 * Current Verified Fee Structures (Indonesia 2025/2026):
 * 1. Direct / WhatsApp / Instagram:
 *    - Fee = Rp 0 (0%)
 *
 * 2. Shopee (Toko Casa Moral):
 *    - Biaya Administrasi: 9.5%
 *    - Biaya Pemrosesan Pesanan: Rp 1.250 (flat)
 *    - Pajak PPh 22: 0.5%
 *    - Total Formula: 10.0% + Rp 1.250
 *
 * 3. TikTok Shop (Shop | Tokopedia - Kategori Rumah Tangga & Lampu Meja):
 *    - Komisi Platform Kategori: 8.0%
 *    - Biaya Pemrosesan Transaksi: Rp 1.250 (flat)
 *    - Pajak PPh 22: 0.5%
 *    - Total Formula: 8.5% + Rp 1.250
 *
 * 4. Tokopedia (Power Shop / Reguler - Kategori Perlengkapan Rumah & Dekorasi Lampu):
 *    - Biaya Layanan Kategori: 8.0%
 *    - Biaya Jasa Pemrosesan: Rp 1.250 (flat)
 *    - Pajak PPh 22: 0.5%
 *    - Total Formula: 8.5% + Rp 1.250
 */
export function calculatePlatformFee(
  channel: ChannelSource | string,
  totalAmount: number
): PlatformFeeBreakdown {
  const amountDec = new Decimal(Math.max(0, totalAmount));

  if (!channel || amountDec.lessThanOrEqualTo(0)) {
    return {
      adminFee: 0,
      processFee: 0,
      taxFee: 0,
      totalFee: 0,
      label: "0%",
      rateDescription: !channel ? "Tanpa Potongan" : "Tagihan Rp 0",
      isMarketplace: false,
    };
  }

  const normalizedChannel = (channel || "").toLowerCase().replace(/\s+/g, "");

  // 1. SHOPEE
  if (normalizedChannel === "shopee") {
    const admin = amountDec.times(0.095);
    const process = new Decimal(1250);
    const tax = amountDec.times(0.005);
    const total = admin.plus(process).plus(tax).toDecimalPlaces(0);

    return {
      adminFee: admin.toDecimalPlaces(0).toNumber(),
      processFee: process.toNumber(),
      taxFee: tax.toDecimalPlaces(0).toNumber(),
      totalFee: total.toNumber(),
      label: "Shopee 10% + Rp 1.250",
      rateDescription: "Admin 9.5% + Proses Rp 1.250 + PPh 0.5% (Total: 10% + 1.250)",
      isMarketplace: true,
    };
  }

  // 2. TIKTOK SHOP (Shop | Tokopedia)
  if (normalizedChannel === "tiktokshop" || normalizedChannel === "tiktok") {
    const admin = amountDec.times(0.08); // Komisi 8% kategori lampu
    const process = new Decimal(1250);   // Biaya proses pesanan
    const tax = amountDec.times(0.005);  // PPh 22 0.5%
    const total = admin.plus(process).plus(tax).toDecimalPlaces(0);

    return {
      adminFee: admin.toDecimalPlaces(0).toNumber(),
      processFee: process.toNumber(),
      taxFee: tax.toDecimalPlaces(0).toNumber(),
      totalFee: total.toNumber(),
      label: "TikTok Shop 8.5% + Rp 1.250",
      rateDescription: "Komisi 8.0% + Proses Rp 1.250 + PPh 0.5% (Total: 8.5% + 1.250)",
      isMarketplace: true,
    };
  }

  // 3. TOKOPEDIA
  if (normalizedChannel === "tokopedia") {
    const admin = amountDec.times(0.08); // Komisi 8% kategori lampu
    const process = new Decimal(1250);   // Biaya transaksi
    const tax = amountDec.times(0.005);  // PPh 22 0.5%
    const total = admin.plus(process).plus(tax).toDecimalPlaces(0);

    return {
      adminFee: admin.toDecimalPlaces(0).toNumber(),
      processFee: process.toNumber(),
      taxFee: tax.toDecimalPlaces(0).toNumber(),
      totalFee: total.toNumber(),
      label: "Tokopedia 8.5% + Rp 1.250",
      rateDescription: "Komisi 8.0% + Proses Rp 1.250 + PPh 0.5% (Total: 8.5% + 1.250)",
      isMarketplace: true,
    };
  }

  // 4. NON-MARKETPLACE (Direct, WhatsApp, Instagram, Other)
  return {
    adminFee: 0,
    processFee: 0,
    taxFee: 0,
    totalFee: 0,
    label: "0%",
    rateDescription: "Direct / Non-Marketplace (Fee 0%)",
    isMarketplace: false,
  };
}

/**
 * Returns human-friendly display label for any channel
 */
export function getChannelLabel(channel: ChannelSource | string): string {
  switch (channel.toLowerCase().replace(/\s+/g, "")) {
    case "shopee":
      return "Shopee";
    case "tiktokshop":
    case "tiktok":
      return "TikTok Shop";
    case "tokopedia":
      return "Tokopedia";
    case "whatsapp":
      return "WhatsApp";
    case "instagram":
      return "Instagram";
    case "direct":
      return "Direct";
    default:
      return channel;
  }
}

/**
 * Helper to check if a channel is a marketplace platform with admin fees
 */
export function isMarketplaceChannel(channel: ChannelSource | string): boolean {
  const norm = (channel || "").toLowerCase().replace(/\s+/g, "");
  return norm === "shopee" || norm === "tiktokshop" || norm === "tiktok" || norm === "tokopedia";
}
