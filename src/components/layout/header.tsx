"use client";

import { Menu, Plus, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({ onMenuClick, title = "Dashboard Operasional", subtitle = "Casa Moral 3D Studio" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80 sm:px-6">
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
          <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
            {title}
          </h1>
          <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:block">
            {subtitle}
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

        {/* Quick Action Button */}
        <Button size="sm" variant="accent" className="gap-1.5 text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Pesanan Baru</span>
          <span className="sm:hidden">Pesanan</span>
        </Button>
      </div>
    </header>
  );
}
