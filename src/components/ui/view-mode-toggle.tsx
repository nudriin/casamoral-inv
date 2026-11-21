"use client";

import React from "react";
import { LayoutGrid, Table2 } from "lucide-react";

export type ViewMode = "table" | "card";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * Reusable pill toggle allowing users to switch any table between Tabel and Card views.
 */
export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800/90"
      role="group"
      aria-label="Pilih tampilan data"
    >
      <button
        type="button"
        onClick={() => onChange("table")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
          mode === "table"
            ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
      >
        <Table2 className="h-3.5 w-3.5" />
        <span>Tabel</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("card")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
          mode === "card"
            ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>Card</span>
      </button>
    </div>
  );
}
