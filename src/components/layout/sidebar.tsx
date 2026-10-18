"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  ShoppingCart,
  Store,
  CreditCard,
  Boxes,
  Coins,
  Receipt,
  FileSpreadsheet,
  Printer,
  Calculator,
  HandCoins,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: "Operasional & Penjualan",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Kasir POS",
        href: "/pos",
        icon: Store,
        badge: "Live",
      },
      {
        name: "Pesanan (Orders)",
        href: "/orders",
        icon: ShoppingCart,
        badge: "Omni",
      },
      {
        name: "Produk & Model",
        href: "/products",
        icon: Box,
        badge: "Katalog",
      },
    ],
  },
  {
    title: "Workshop & Produksi",
    items: [
      {
        name: "Kalkulator HPP",
        href: "/calculator",
        icon: Calculator,
        badge: "Casa Moral",
      },
      {
        name: "Bahan & Stok",
        href: "/inventory",
        icon: Boxes,
      },
      {
        name: "Pengeluaran",
        href: "/expenses",
        icon: Receipt,
      },
      {
        name: "Utang Mesin",
        href: "/payables",
        icon: HandCoins,
        badge: "Cicilan",
      },
      {
        name: "Modal & Aset",
        href: "/capital",
        icon: Coins,
      },
    ],
  },
  {
    title: "Finansial & Sistem",
    items: [
      {
        name: "Buku Kas & Laporan",
        href: "/reports",
        icon: FileSpreadsheet,
        badge: "Buku Kas",
      },
      {
        name: "Piutang Usaha",
        href: "/orders/receivables",
        icon: CreditCard,
        badge: "Rp 655k",
      },
      {
        name: "Pengaturan Bisnis",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200/80 bg-white/95 backdrop-blur-md transition-transform duration-200 ease-in-out dark:border-zinc-800/80 dark:bg-zinc-950/95 lg:static lg:translate-x-0 shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-zinc-200/80 px-5 dark:border-zinc-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-xs">
            <Printer className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              CASA MORAL
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
              3D Print Studio ERP
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navigationSections.map((section, sectionIdx) => (
            <div key={section.title || sectionIdx}>
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {section.title}
              </div>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  let isActive = false;
                  if (item.href === "/") {
                    isActive = pathname === "/";
                  } else if (item.href === "/orders") {
                    // Active for /orders, /orders/new, /orders/[id], but NOT /orders/receivables
                    isActive =
                      pathname.startsWith("/orders") && !pathname.startsWith("/orders/receivables");
                  } else if (item.href === "/reports") {
                    isActive = pathname.startsWith("/reports");
                  } else {
                    isActive = pathname.startsWith(item.href);
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-amber-500/10 text-amber-700 font-semibold dark:bg-amber-500/15 dark:text-amber-300"
                          : "text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isActive
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                          )}
                        />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            isActive
                              ? "bg-amber-200/60 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Active Machines Status Footer */}
        <div className="border-t border-zinc-200/80 p-3 dark:border-zinc-800/80">
          <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Status Mesin Cetak
              </span>
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                <span>Bambu A1 Mini</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Ready
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-700 dark:text-zinc-300">
                <span>Anycubic Kobra X</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
