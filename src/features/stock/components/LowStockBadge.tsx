"use client";

import type { Stock } from "@/types/domain";
import { StockStatusIndicator } from "./StockStatusIndicator";

interface LowStockBadgeProps {
  stock?: Stock;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LowStockBadge({ stock, className, size }: LowStockBadgeProps) {
  if (!stock) return null;
  return <StockStatusIndicator status={stock.stockStatus} className={className} size={size} />;
}

