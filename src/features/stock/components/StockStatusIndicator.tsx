"use client";

import type { StockStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

interface StockStatusIndicatorProps {
  status?: StockStatus | string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function StockStatusIndicator({
  status,
  className,
  size = "md",
}: StockStatusIndicatorProps) {
  if (!status) return null;

  const isSuccess = status === "In Stock";
  const isWarning = status === "Low Stock";

  const colorClasses = isSuccess
    ? "bg-emerald-500 ring-emerald-500/25"
    : isWarning
      ? "bg-amber-500 ring-amber-500/25"
      : "bg-rose-500 ring-rose-500/25";

  const sizeClasses =
    size === "sm"
      ? "h-2 w-2 ring-2"
      : size === "lg"
        ? "h-3.5 w-3.5 ring-4"
        : "h-2.5 w-2.5 ring-2";

  return (
    <span
      className={cn("inline-flex items-center justify-center shrink-0 align-middle", className)}
      title={status}
      aria-label={status}
    >
      <span
        className={cn(
          "rounded-full shadow-sm transition-transform hover:scale-125",
          colorClasses,
          sizeClasses
        )}
      />
    </span>
  );
}
