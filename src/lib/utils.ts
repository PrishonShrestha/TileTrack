import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[,\s]/g, "").trim();
    if (!cleaned) return fallback;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

export function uniqueBy<T, K>(arr: T[], getKey: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of arr) {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export function formatStockBoxesAndPieces(stockBoxes: number, piecesPerBox = 1): string {
  if (stockBoxes <= 0) return "0 boxes";
  const ppb = Math.max(1, piecesPerBox);
  const wholeBoxes = Math.floor(stockBoxes + 1e-6);
  const fraction = stockBoxes - wholeBoxes;
  const pieces = Math.round(fraction * ppb);

  if (pieces === 0) {
    return `${formatNumber(wholeBoxes)} ${wholeBoxes === 1 ? "box" : "boxes"}`;
  }
  if (wholeBoxes === 0) {
    return `${formatNumber(pieces)} ${pieces === 1 ? "piece" : "pieces"}`;
  }
  return `${formatNumber(wholeBoxes)} ${wholeBoxes === 1 ? "box" : "boxes"}, ${formatNumber(pieces)} ${pieces === 1 ? "piece" : "pieces"}`;
}

export function generateProductId(prefix = "PRD"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 5; i += 1) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${randomPart}`;
}
