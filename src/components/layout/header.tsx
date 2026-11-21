"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Plus,
  Database,
  Sun,
  Moon,
  Laptop,
  Check,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
}

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Dashboard Operasional",
    subtitle: "Ringkasan Finansial, Omzet, Kas Masuk, Piutang, dan Tracker Target BEP",
  },
  "/products": {
    title: "Master Produk & Model",
    subtitle: "Katalog produk, varian model, Bill of Materials (BOM), dan kalkulasi HPP",
  },
  "/orders": {
    title: "Manajemen Pesanan (Orders)",
    subtitle: "Daftar pesanan omnichannel, kustomisasi warna, add-on, dan tracking produksi",
  },
  "/orders/new": {
    title: "Input Pesanan Baru",
    subtitle: "Formulir pesanan omnichannel dengan live simulator margin & kalkulasi HPP",
  },
  "/orders/receivables": {
    title: "Manajemen Piutang Usaha",
    subtitle: "Pelacakan saldo piutang berjalan 7 pesanan belum lunas dan analitik aging",
  },
  "/inventory": {
    title: "Bahan Baku & Persediaan Stok",
    subtitle: "Stok bahan baku filamen, komponen perakitan lampu, dan kartu mutasi",
  },
  "/capital": {
    title: "Modal Usaha & Aset Tetap",
    subtitle: "Pencatatan investasi mesin 3D printer, peralatan workshop, dan belanja modal usaha Casa Moral",
  },
  "/expenses": {
    title: "Pengeluaran Operasional & Overhead",
    subtitle: "Pencatatan beban rutin bulanan studio, biaya tetap (overhead), dan variabel",
  },
  "/payables": {
    title: "Utang Usaha & Cicilan Aset",
    subtitle: "Jadwal cicilan Shopee PayLater mesin Anycubic Kobra X dan kewajiban usaha",
  },
  "/calculator": {
    title: "Kalkulator HPP & Finansial Presisi",
    subtitle: "Simulasi perhitungan HPP dual-mode, margin, markup, dan analisis Break-Even Point",
  },
  "/reports": {
    title: "Pusat Laporan & Ekspor Data",
    subtitle: "Hub pelaporan eksekutif keuangan studio dan ekspor spreadsheet UTF-8 BOM",
  },
  "/reports/profit-loss": {
    title: "Laporan Laba Rugi Komprehensif",
    subtitle: "Pendapatan kotor, potongan diskon & Shopee, COGS, dan laba bersih operasional",
  },
  "/reports/cash-flow": {
    title: "Laporan Arus Kas Metode Langsung",
    subtitle: "Arus kas operasi, arus kas investasi mesin, dan arus kas pendanaan modal",
  },
  "/reports/sales-analytics": {
    title: "Analitik Penjualan & Margin Produk",
    subtitle: "Profitabilitas 4 model lampu, estimasi jam cetak printer, dan kontribusi kanal",
  },
  "/settings": {
    title: "Pengaturan Bisnis & Biaya",
    subtitle: "Konfigurasi tarif platform marketplace, penetapan harga global, dan asumsi biaya",
  },
};

export function Header({ onMenuClick, title: propTitle, subtitle: propSubtitle }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const handleLock = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  // Determine title from prop or route mapping
  let currentTitle = propTitle;
  let currentSubtitle = propSubtitle;

  if (!currentTitle) {
    if (ROUTE_TITLES[pathname]) {
      currentTitle = ROUTE_TITLES[pathname].title;
      currentSubtitle = ROUTE_TITLES[pathname].subtitle;
    } else if (pathname.startsWith("/orders/") && pathname.endsWith("/payments")) {
      currentTitle = "Pencatatan Pembayaran Pesanan";
      currentSubtitle = "Input pembayaran bertahap (DP / Pelunasan) dan verifikasi kas masuk";
    } else if (pathname.startsWith("/orders/")) {
      currentTitle = "Detail Pesanan & Alur Produksi";
      currentSubtitle = "Pelacakan alur status produksi, konfirmasi pembayaran, dan log stok";
    } else {
      currentTitle = "Casa Moral 3D Studio";
      currentSubtitle = "Sistem Manajemen Usaha & Finansial 3D Printing";
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/90 px-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Page Title & Breadcrumb */}
        <div>
          <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-base md:text-lg">
            {currentTitle}
          </h1>
          <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:block">
            {currentSubtitle}
          </p>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Database Status Indicator */}
        <div className="hidden items-center gap-1.5 rounded-md border border-zinc-200/80 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 md:flex">
          <Database className="h-3.5 w-3.5 text-amber-500" />
          <span>PostgreSQL (Supabase)</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1" />
        </div>

        {/* Theme Toggle Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            aria-label="Ganti Tema (Light / Dark Mode)"
            title={`Tema aktif: ${theme === "system" ? "Sistem (" + resolvedTheme + ")" : theme}`}
          >
            {resolvedTheme === "dark" ? (
              <Moon className="h-4 w-4 text-amber-400" />
            ) : (
              <Sun className="h-4 w-4 text-amber-500" />
            )}
          </button>

          {/* Theme Selector Menu */}
          {themeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setThemeDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-zinc-200 bg-white p-1 text-xs shadow-lg dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setTheme("light");
                    setThemeDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                    theme === "light" ? "font-semibold text-amber-600 dark:text-amber-400 bg-zinc-50 dark:bg-zinc-800/60" : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Mode Terang</span>
                  </div>
                  {theme === "light" && <Check className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme("dark");
                    setThemeDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                    theme === "dark" ? "font-semibold text-amber-600 dark:text-amber-400 bg-zinc-50 dark:bg-zinc-800/60" : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="h-3.5 w-3.5 text-amber-400" />
                    <span>Mode Gelap</span>
                  </div>
                  {theme === "dark" && <Check className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme("system");
                    setThemeDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                    theme === "system" ? "font-semibold text-amber-600 dark:text-amber-400 bg-zinc-50 dark:bg-zinc-800/60" : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Laptop className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Ikuti Sistem</span>
                  </div>
                  {theme === "system" && <Check className="h-3 w-3" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Lock / Logout */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void handleLock()}
          title="Kunci Aplikasi (Logout)"
          className="gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer"
        >
          <Lock className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Kunci</span>
        </Button>

        {/* Quick Action: New Order */}
        <Link href="/orders/new">
          <Button size="sm" variant="accent" className="gap-1.5 text-xs font-semibold cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pesanan Baru</span>
            <span className="sm:hidden">Pesanan</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
