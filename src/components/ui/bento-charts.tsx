"use client";

import React from "react";
import { formatRupiah } from "@/lib/utils";

export interface RevenuePoint {
  label: string;
  value: number;
}

/**
 * Clean minimalist SVG area/line chart in Casa Moral Orange for Dashboard Bento cards.
 */
export function RevenueAreaChart({ data }: { data: RevenuePoint[] }) {
  const points = data.length > 0 ? data : [{ label: "-", value: 0 }];
  const width = 360;
  const height = 110;
  const padX = 8;
  const padY = 12;
  const maxVal = Math.max(...points.map((p) => p.value), 1);

  const coords = points.map((p, idx) => {
    const x =
      points.length === 1
        ? width / 2
        : padX + (idx / (points.length - 1)) * (width - padX * 2);
    const y =
      height - padY - (p.value / maxVal) * (height - padY * 2);
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, idx) => `${idx === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`
      : "";

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-28 overflow-visible"
        role="img"
        aria-label="Grafik tren omzet penjualan"
      >
        <defs>
          <linearGradient id="cmOrangeArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {areaPath && <path d={areaPath} fill="url(#cmOrangeArea)" />}
        {coords.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {coords.map((c, idx) => (
          <g key={idx}>
            <circle
              cx={c.x}
              cy={c.y}
              r={idx === coords.length - 1 ? 4 : 2.5}
              className="fill-orange-500 stroke-white dark:stroke-zinc-900"
              strokeWidth="1.5"
            >
              <title>{`${c.label}: ${formatRupiah(c.value)}`}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 px-1">
        <span>{points[0]?.label}</span>
        {points.length > 2 && <span>{points[Math.floor(points.length / 2)]?.label}</span>}
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export interface ModelBarItem {
  model: string;
  units: number;
  revenue: number;
  marginPct: number;
}

/**
 * Clean pill-top vertical bar chart for product model sales.
 */
export function ModelBarChart({ items }: { items: ModelBarItem[] }) {
  const list = items.slice(0, 6);
  const maxRevenue = Math.max(...list.map((i) => i.revenue), 1);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 items-end pt-3">
      {list.map((item, idx) => {
        const pct = Math.max(12, Math.round((item.revenue / maxRevenue) * 100));
        const isTop = idx === 0 || item.revenue === maxRevenue;
        const shortName = item.model.replace(/^Lampu Ambient\s*[-–—:]?\s*/i, "").trim();

        return (
          <div key={item.model} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
              {item.units}u
            </span>
            <div className="w-full h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70 flex items-end p-1 overflow-hidden">
              <div
                className={`w-full rounded-xl transition-all duration-500 ${isTop ? "bg-orange-500" : "bg-zinc-800 dark:bg-zinc-200"
                  }`}
                style={{ height: `${pct}%` }}
                title={`${shortName}: ${formatRupiah(item.revenue)} (${item.units} unit)`}
              />
            </div>
            <div className="text-center">
              <div className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[72px]">
                {shortName}
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                {formatRupiah(item.revenue).replace("Rp ", "")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Clean circular radial progress ring for BEP & targets.
 */
export function RadialProgressRing({
  percentage,
  label,
  sublabel,
}: {
  percentage: number;
  label: string;
  sublabel: string;
}) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-zinc-100 dark:stroke-zinc-800"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-orange-500 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-50 leading-none">
          {label}
        </span>
        <span className="text-[10px] text-zinc-400 mt-1">{sublabel}</span>
      </div>
    </div>
  );
}
