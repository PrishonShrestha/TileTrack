"use client";

import { Badge } from "@/components/ui/badge";
import type { Stock } from "@/types/domain";

interface LowStockBadgeProps {
  stock?: Stock;
}

export function LowStockBadge({ stock }: LowStockBadgeProps) {
  if (!stock) return null;
  const variant =
    stock.stockStatus === "In Stock"
      ? "success"
      : stock.stockStatus === "Low Stock"
        ? "warning"
        : "destructive";
  return <Badge variant={variant}>{stock.stockStatus}</Badge>;
}
