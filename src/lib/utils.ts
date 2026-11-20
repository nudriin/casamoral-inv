import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge multiple class names with Tailwind CSS conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number or string into Indonesian Rupiah (IDR) currency format
 * e.g., 134557.92 => "Rp 134.558" or "Rp 134.557,92"
 */
export function formatRupiah(value: number | string | null | undefined, showDecimals = false): string {
  if (value === null || value === undefined || value === "") return "Rp 0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "Rp 0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Format a number with Indonesian thousand separators (e.g. 1.250,50)
 */
export function formatNumber(value: number | string | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || value === "") return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a date string or Date object into Indonesian localized date
 * e.g., "15 Oktober 2026"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export const formatDateIndo = formatDate;

/**
 * Clean & display concise product model name (e.g. "Ollie", "Lumi", "Kumo", "Pomi", "Nomi")
 * Avoids confusing generic "Lampu Ambient" fallback.
 */
export function formatModelName(
  itemOrProduct?:
    | {
        product?: { name?: string | null } | null;
        product_id?: string | null;
        id?: string | null;
        name?: string | null;
        product_name?: string | null;
        color_details?: string | null;
      }
    | string
    | null
): string {
  if (!itemOrProduct) return "Ollie";

  const knownMap: Record<string, string> = {
    "prod-01": "Lumi",
    "prod-02": "Ollie",
    "prod-03": "Kumo",
    "prod-04": "Pomi",
    "prod-05": "Nomi",
  };

  if (typeof itemOrProduct === "object") {
    const id = itemOrProduct.product_id || (itemOrProduct as any).id;
    if (id && knownMap[id]) {
      return knownMap[id];
    }

    const raw =
      itemOrProduct.product?.name ||
      itemOrProduct.product_name ||
      itemOrProduct.name ||
      "";

    if (raw && typeof raw === "string") {
      const clean = raw
        .replace(/^Lampu Ambient\s*[-–—:]?\s*/i, "")
        .replace(/Lampu Ambient/gi, "")
        .replace(/^Model\s+/i, "")
        .trim();
      if (clean && clean.toLowerCase() !== "lampu ambient") {
        return clean;
      }
    }

    if (itemOrProduct.color_details) {
      const cd = itemOrProduct.color_details.toLowerCase();
      if (cd.includes("cap")) {
        return "Ollie";
      }
    }

    return "Ollie";
  }

  const clean = String(itemOrProduct)
    .replace(/^Lampu Ambient\s*[-–—:]?\s*/i, "")
    .replace(/Lampu Ambient/gi, "")
    .replace(/^Model\s+/i, "")
    .trim();
  return clean && clean.toLowerCase() !== "lampu ambient" ? clean : "Ollie";
}

