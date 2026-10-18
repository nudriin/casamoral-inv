"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Order, Product } from "@/types/database";
import { ProductWithBOM } from "@/lib/data/initial-data";
import { EditOrderModal } from "@/components/orders/edit-order-modal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag } from "lucide-react";

interface EditOrderPageClientProps {
  order: Order;
  products?: ProductWithBOM[] | Product[];
}

export function EditOrderPageClient({ order: initialOrder, products }: EditOrderPageClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href={`/orders/${order.id}`}>
            <Button variant="outline" size="sm" className="gap-1 h-9">
              <ArrowLeft className="w-4 h-4" /> Kembali ke Detail
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
              Edit Pesanan: {order.order_number}
            </h1>
            <p className="text-xs text-zinc-500">
              Ubah rincian pembayaran, model produk, variasi warna, add-on, atau status.
            </p>
          </div>
        </div>
      </div>

      <EditOrderModal
        order={order}
        isOpen={true}
        availableProducts={products}
        onClose={() => router.push(`/orders/${order.id}`)}
        onSaved={(updatedOrder) => {
          setOrder(updatedOrder);
          router.push(`/orders/${updatedOrder.id}`);
        }}
        onDeleted={() => {
          router.push("/orders");
        }}
      />
    </div>
  );
}
