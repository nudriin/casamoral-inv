"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ReceivableItem } from "@/lib/services/payments-service";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Clock,
  Coins,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface ReceivablesClientProps {
  initialItems: ReceivableItem[];
  totalReceivables: number;
}

export function ReceivablesClient({ initialItems }: ReceivablesClientProps) {
  const [items] = useState<ReceivableItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (channelFilter !== "ALL" && item.order.channel.toLowerCase() !== channelFilter.toLowerCase()) {
        return false;
      }
      if (search.trim() !== "") {
        const q = search.toLowerCase();
        const matchCust = item.customerName.toLowerCase().includes(q);
        const matchCity = item.customerCity.toLowerCase().includes(q);
        const matchOrd = item.order.order_number.toLowerCase().includes(q);
        return matchCust || matchCity || matchOrd;
      }
      return true;
    });
  }, [items, search, channelFilter]);

  const getAgingBadge = (days: number) => {
    if (days <= 7) {
      return (
        <Badge variant="outline" className="text-[11px] gap-1 border-emerald-300 text-emerald-700 dark:text-emerald-400">
          <Clock className="w-3 h-3" /> {days} hari (Baru)
        </Badge>
      );
    } else if (days <= 14) {
      return (
        <Badge variant="warning" className="text-[11px] gap-1">
          <Clock className="w-3 h-3" /> {days} hari (Perhatian)
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="text-[11px] gap-1">
          <Clock className="w-3 h-3" /> {days} hari (Jatuh Tempo)
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="p-4 rounded-xl border border-zinc-200/80 bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-900/60 backdrop-blur-md shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Cari nama pelanggan, nomor pesanan, atau kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <span className="text-xs font-medium text-zinc-500 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Kanal:
            </span>
            {(["ALL", "Direct", "Shopee"] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                  channelFilter === ch
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-white font-semibold"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {ch === "ALL" ? "Semua" : ch}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Receivables Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Tidak ada piutang yang sesuai filter
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Seluruh pesanan pada filter ini telah lunas atau tidak ditemukan.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-xs font-semibold text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Pelanggan & Lokasi</th>
                  <th className="py-3 px-4">No. Order & Tanggal</th>
                  <th className="py-3 px-4">Kanal</th>
                  <th className="py-3 px-4 text-center">Umur Piutang (Aging)</th>
                  <th className="py-3 px-4 text-right">Total Nilai</th>
                  <th className="py-3 px-4 text-right">Sudah Dibayar (DP)</th>
                  <th className="py-3 px-4 text-right">Sisa Piutang</th>
                  <th className="py-3 px-4 text-center">Aksi Pelunasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800">
                {filteredItems.map((item) => (
                  <tr
                    key={item.order.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.customerName}
                      </div>
                      <div className="text-xs text-zinc-500">{item.customerCity}</div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <Link
                        href={`/orders/${item.order.id}`}
                        className="font-mono font-semibold text-amber-600 hover:underline"
                      >
                        {item.order.order_number}
                      </Link>
                      <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateIndo(item.order.order_date)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-top">
                      <Badge variant="outline" className="text-xs">
                        {item.order.channel}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 align-top text-center">
                      {getAgingBadge(item.daysAging)}
                    </td>

                    <td className="py-3.5 px-4 align-top text-right font-mono font-medium text-zinc-700 dark:text-zinc-300">
                      {formatRupiah(item.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4 align-top text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatRupiah(item.paidAmount)}
                    </td>

                    <td className="py-3.5 px-4 align-top text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(item.remainingAmount)}
                    </td>

                    <td className="py-3.5 px-4 align-top text-center">
                      <Link href={`/orders/${item.order.id}/payments`}>
                        <Button
                          size="sm"
                          className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        >
                          <Coins className="w-3 h-3" /> Catat Bayar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
