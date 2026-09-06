"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Coins,
  Grid3X3,
  Info,
  Layers,
  Ruler,
  Plus,
  Copy,
  Check,
  PackageCheck,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatNumber, formatStockBoxesAndPieces } from "@/lib/utils";
import { areaUnitFor, areaUnitLabel, mm2ToArea } from "@/features/calculator/lib/unitConversion";
import { useGetStockQuery } from "@/features/stock/store/stockApi";
import { useGetProductsQuery } from "@/features/catalog/store/catalogApi";
import { StockStatusIndicator } from "@/features/stock/components/StockStatusIndicator";
import type { CalculatorResult } from "@/types/domain";
import type { LengthUnit } from "@/lib/constants";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { toast } from "sonner";

interface ResultSummaryProps {
  result: CalculatorResult;
  unit: LengthUnit;
  className?: string;
  title?: string;
  productId?: string | null;
  sku?: string | null;
  productName?: string;
  showCost?: boolean;
}

export function ResultSummary({
  result,
  unit,
  className,
  title = "Calculation summary",
  productId: propProductId,
  sku: propSku,
  productName,
  showCost = true,
}: ResultSummaryProps) {
  const targetId = propProductId || propSku;
  const [copied, setCopied] = useState(false);
  const areaUnit = areaUnitFor(unit);
  const area = mm2ToArea(result.surfaceAreaMm2, areaUnit);
  const coverage = mm2ToArea(result.totalCoverageAreaMm2, areaUnit);
  const wastage = mm2ToArea(result.wastageAreaMm2, areaUnit);
  const { data: stock = [] } = useGetStockQuery();
  const { data: products = [] } = useGetProductsQuery();

  const targetProduct = useMemo(() => {
    if (!targetId) return undefined;
    return products.find((p) => p.productId === targetId || p.sku === targetId);
  }, [targetId, products]);
  const piecesPerBox = targetProduct?.piecesPerBox ?? 1;

  const stockEntry = useMemo(() => {
    if (!targetId) return undefined;
    return stock.find((s) => s.productId === targetId || s.sku === targetId);
  }, [targetId, stock]);

  const handleCopy = async () => {
    const text = [
      `📊 ${title}`,
      productName ? `Product: ${productName} (ID: ${targetId})` : null,
      `• Surface Area: ${formatNumber(area, { maximumFractionDigits: 2 })} ${areaUnitLabel(areaUnit)}`,
      `• Base Tiles: ${formatNumber(result.baseTilesNeeded)} | Extra: +${formatNumber(result.extraTiles)} | Total: ${formatNumber(result.totalTiles)} tiles`,
      `• Total Boxes Needed: ${formatNumber(result.totalBoxes)} boxes (Base: ${formatNumber(result.baseBoxesNeeded)} + Extra: ${formatNumber(result.extraBoxes)})`,
      `• Total Coverage: ${formatNumber(coverage, { maximumFractionDigits: 2 })} ${areaUnitLabel(areaUnit)} (Wastage: ${formatNumber(wastage, { maximumFractionDigits: 2 })} ${areaUnitLabel(areaUnit)})`,
      result.estimatedCost > 0 ? `• Estimated Cost: ${CURRENCY_SYMBOL} ${formatNumber(result.estimatedCost, { maximumFractionDigits: 2 })}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Summary copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy summary");
    }
  };

  if (!result.hasInputs) {
    return (
      <Card className={cn("border-dashed border-border/80 bg-muted/20 shadow-2xs", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Info className="h-4 w-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Fill in the dimensions above to see your exact tile count, box requirements, wastage, and cost estimate.
        </CardContent>
      </Card>
    );
  }

  const isStockShortage = stockEntry && result.totalBoxes > stockEntry.stockBoxes;

  return (
    <Card className={cn("border-border/90 bg-card shadow-sm overflow-hidden", className)}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 bg-muted/15 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
            <Ruler className="h-4 w-4" />
          </span>
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {productName ? (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                ID: {targetId} · {productName}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {productName ? (
            <Badge variant="secondary" className="text-xs font-medium">
              {productName}
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 gap-1.5 text-xs"
            aria-label="Copy estimate summary"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy summary"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Hero KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat
            icon={<Boxes className="h-4 w-4 text-primary" />}
            label="Total Boxes"
            value={`${formatNumber(result.totalBoxes)}`}
            badge="Final"
            sub={
              <span className="text-xs text-muted-foreground">
                {formatNumber(result.baseBoxesNeeded)} base + {formatNumber(result.extraBoxes)} extra
              </span>
            }
            highlight={true}
          />
          <Stat
            icon={<Grid3X3 className="h-4 w-4 text-primary" />}
            label="Total Tiles"
            value={formatNumber(result.totalTiles)}
            sub={
              <span className="text-xs text-muted-foreground">
                {formatNumber(result.baseTilesNeeded)} base + {formatNumber(result.extraTiles)} extra
              </span>
            }
          />
          <Stat
            icon={<Layers className="h-4 w-4 text-primary" />}
            label="Surface Area"
            value={`${formatNumber(area, { maximumFractionDigits: 2 })} ${areaUnitLabel(areaUnit)}`}
            sub={
              <span className="text-xs text-muted-foreground">
                Coverage: {formatNumber(coverage, { maximumFractionDigits: 2 })} {areaUnitLabel(areaUnit)}
              </span>
            }
          />
          {showCost && result.estimatedCost > 0 ? (
            <Stat
              icon={<Coins className="h-4 w-4 text-primary" />}
              label="Estimated Cost"
              value={`${CURRENCY_SYMBOL} ${formatNumber(result.estimatedCost, { maximumFractionDigits: 2 })}`}
              sub="Based on price per box"
            />
          ) : (
            <Stat
              icon={<Layers className="h-4 w-4 text-primary" />}
              label="Wastage Area"
              value={`${formatNumber(wastage, { maximumFractionDigits: 2 })} ${areaUnitLabel(areaUnit)}`}
              sub="Cuts & remainder margin"
            />
          )}
        </div>

        {/* Visual Math Breakdown Banner */}
        <div className="rounded-xl border border-border/70 bg-muted/25 p-3.5 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Calculation Breakdown
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="rounded-lg border border-border/60 bg-background p-2.5 shadow-2xs">
              <div className="text-[11px] font-medium text-muted-foreground">Base Requirement</div>
              <div className="mt-1 text-base font-bold text-foreground">
                {formatNumber(result.baseTilesNeeded)}{" "}
                <span className="text-xs font-normal text-muted-foreground">tiles</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                ({formatNumber(result.baseBoxesNeeded)} boxes)
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 shadow-2xs">
              <div className="text-[11px] font-medium text-primary">Extra Wastage</div>
              <div className="mt-1 text-base font-bold text-primary flex items-center justify-center gap-0.5">
                <Plus className="h-3.5 w-3.5" />
                {formatNumber(result.extraTiles)}{" "}
                <span className="text-xs font-normal text-primary/80">tiles</span>
              </div>
              <div className="text-[11px] text-primary/80">
                (+{formatNumber(result.extraBoxes)} boxes)
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-background p-2.5 shadow-2xs">
              <div className="text-[11px] font-medium text-muted-foreground">Total To Order</div>
              <div className="mt-1 text-base font-bold text-foreground">
                {formatNumber(result.totalTiles)}{" "}
                <span className="text-xs font-normal text-muted-foreground">tiles</span>
              </div>
              <div className="text-[11px] font-semibold text-primary">
                = {formatNumber(result.totalBoxes)} boxes
              </div>
            </div>
          </div>
        </div>

        {/* Live Stock Check Banner */}
        {targetId && stockEntry ? (
          <div
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-3.5 text-sm sm:flex-row sm:items-center sm:justify-between transition-colors",
              isStockShortage
                ? "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200"
                : "border-primary/40 bg-primary/10 text-emerald-950 dark:text-emerald-200"
            )}
          >
            <div className="flex items-start gap-2.5">
              {isStockShortage ? (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              ) : (
                <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              )}
              <div>
                <div className="font-semibold leading-tight">
                  {isStockShortage ? "Stock Shortage Warning" : "Stock Available"}
                </div>
                <div className="text-xs opacity-90 mt-0.5">
                  {isStockShortage
                    ? `You need ${result.totalBoxes} boxes, but only ${formatStockBoxesAndPieces(stockEntry.stockBoxes, piecesPerBox)} in stock (short by ${
                        formatNumber(result.totalBoxes - stockEntry.stockBoxes, { maximumFractionDigits: 2 })
                      } boxes).`
                    : `Currently ${formatStockBoxesAndPieces(stockEntry.stockBoxes, piecesPerBox)} in stock — you have sufficient stock for this project.`}
                </div>
              </div>
            </div>
            <StockStatusIndicator status={stockEntry.stockStatus} className="self-start sm:self-auto shrink-0" />
          </div>
        ) : null}

        {/* Warnings */}
        {result.warnings.length > 0 ? (
          <ul className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-900 dark:text-amber-200">
            {result.warnings.map((warning) => (
              <li key={warning} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  badge,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: React.ReactNode;
  badge?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 transition-all shadow-2xs flex flex-col justify-between",
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border/80 bg-background"
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-1 text-xs uppercase tracking-wider text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5">
            {icon}
            {label}
          </span>
          {badge ? (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.2 text-[10px] font-semibold text-primary">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 text-xl font-bold tracking-tight text-foreground">{value}</div>
      </div>
      {sub ? <div className="mt-1.5">{sub}</div> : null}
    </div>
  );
}