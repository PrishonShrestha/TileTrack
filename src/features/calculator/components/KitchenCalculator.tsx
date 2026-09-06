"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetKitchen,
  selectKitchenCatalogTile,
  setExtraType,
  setExtraPercent,
  setExtraBoxes,
  setKitchenBacksplashSource,
  setKitchenCountertopSource,
  setKitchenField,
} from "@/features/calculator/store/calculatorSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, ChefHat, Grid2X2, Table as TableIcon } from "lucide-react";
import { UnitToggle } from "./UnitToggle";
import { TileSourceToggle } from "./TileSourceToggle";
import { ExtraTilesSlider } from "./ExtraTilesSlider";
import { NumericInput } from "@/components/ui/numeric-input";
import { Switch } from "@/components/ui/switch";
import { ProductPicker } from "@/features/catalog/components/ProductPicker";
import { ResultSummary } from "./ResultSummary";
import { selectKitchenResult } from "../store/selectors";
import { LENGTH_UNIT_LABELS } from "@/lib/constants-labels";
import { areaUnitFor, areaUnitLabel, mm2ToArea } from "@/features/calculator/lib/unitConversion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SIZE_UNITS } from "@/lib/constants";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { Product, TileSourceMode, LengthUnit } from "@/types/domain";

export function KitchenCalculator() {
  const dispatch = useAppDispatch();
  const unit = useAppSelector((s) => s.calculator.unit);
  const kitchen = useAppSelector((s) => s.calculator.kitchen);
  const { combined, sections } = useAppSelector(selectKitchenResult);

  const handleSelectProduct = (
    surface: "countertop" | "backsplash",
    product: Product
  ) => {
    dispatch(
      selectKitchenCatalogTile({
        surface,
        productId: product.productId,
        sku: product.productId,
        tile: {
          length: product.length,
          width: product.width,
          piecesPerBox: product.piecesPerBox,
          pricePerBox: product.pricePerBox,
          tileUnit: product.sizeUnit,
        },
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Kitchen Dimensions Card */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Kitchen dimensions</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Combine a countertop (with optional sink deduction) and an optional backsplash.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <UnitToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => dispatch(resetKitchen())}
              className="h-8 w-8 shrink-0"
              title="Reset kitchen"
              aria-label="Reset kitchen"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Countertop length</Label>
              <NumericInput
                value={kitchen.countertopLength}
                onValueChange={(val) => dispatch(setKitchenField({ countertopLength: val ?? 0 }))}
                suffix={LENGTH_UNIT_LABELS[unit]}
                min={0}
                allowDecimal={true}
                placeholder="e.g. 10.5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Countertop width / depth</Label>
              <NumericInput
                value={kitchen.countertopWidth}
                onValueChange={(val) => dispatch(setKitchenField({ countertopWidth: val ?? 0 }))}
                suffix={LENGTH_UNIT_LABELS[unit]}
                min={0}
                allowDecimal={true}
                placeholder="e.g. 2.5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sink cutout length (deducted)</Label>
              <NumericInput
                value={kitchen.sinkLength}
                onValueChange={(val) => dispatch(setKitchenField({ sinkLength: val ?? 0 }))}
                suffix={LENGTH_UNIT_LABELS[unit]}
                min={0}
                allowDecimal={true}
                placeholder="e.g. 3.0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sink cutout width (deducted)</Label>
              <NumericInput
                value={kitchen.sinkWidth}
                onValueChange={(val) => dispatch(setKitchenField({ sinkWidth: val ?? 0 }))}
                suffix={LENGTH_UNIT_LABELS[unit]}
                min={0}
                allowDecimal={true}
                placeholder="e.g. 1.8"
              />
            </div>
          </div>

          {/* Backsplash Toggle & Inputs */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/20 p-3.5">
            <div>
              <Label className="text-sm font-semibold">Include backsplash</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adds a vertical backsplash surface with its own tile or marble selection.
              </p>
            </div>
            <Switch
              checked={kitchen.includeBacksplash}
              onCheckedChange={(val) => dispatch(setKitchenField({ includeBacksplash: val }))}
              aria-label="Toggle backsplash"
            />
          </div>

          {kitchen.includeBacksplash ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Backsplash length</Label>
                <NumericInput
                  value={kitchen.backsplashLength}
                  onValueChange={(val) => dispatch(setKitchenField({ backsplashLength: val ?? 0 }))}
                  suffix={LENGTH_UNIT_LABELS[unit]}
                  min={0}
                  allowDecimal={true}
                  placeholder="e.g. 10.5"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Backsplash height</Label>
                <NumericInput
                  value={kitchen.backsplashHeight}
                  onValueChange={(val) => dispatch(setKitchenField({ backsplashHeight: val ?? 0 }))}
                  suffix={LENGTH_UNIT_LABELS[unit]}
                  min={0}
                  allowDecimal={true}
                  placeholder="e.g. 1.5"
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Countertop Surface Tile Card */}
      <SurfaceTileCard
        title="Countertop surface"
        source={kitchen.countertopSource}
        sku={kitchen.countertopSku}
        tile={kitchen.countertopTile}
        tileUnit={kitchen.countertopTile.tileUnit}
        onSourceChange={(val) => dispatch(setKitchenCountertopSource(val))}
        onSelect={(product) => handleSelectProduct("countertop", product)}
        onClear={() =>
          dispatch(
            selectKitchenCatalogTile({
              surface: "countertop",
              sku: null,
              tile: { length: 0, width: 0, piecesPerBox: 1, pricePerBox: 0, tileUnit: unit },
            })
          )
        }
        onTileChange={(tile) => dispatch(setKitchenField({ countertopTile: tile }))}
      />

      {/* Backsplash Surface Tile Card */}
      {kitchen.includeBacksplash ? (
        <SurfaceTileCard
          title="Backsplash surface"
          source={kitchen.backsplashSource}
          sku={kitchen.backsplashSku}
          tile={kitchen.backsplashTile}
          tileUnit={kitchen.backsplashTile.tileUnit}
          onSourceChange={(val) => dispatch(setKitchenBacksplashSource(val))}
          onSelect={(product) => handleSelectProduct("backsplash", product)}
          onClear={() =>
            dispatch(
              selectKitchenCatalogTile({
                surface: "backsplash",
                sku: null,
                tile: { length: 0, width: 0, piecesPerBox: 1, pricePerBox: 0, tileUnit: unit },
              })
            )
          }
          onTileChange={(tile) => dispatch(setKitchenField({ backsplashTile: tile }))}
        />
      ) : null}

      {/* Extra Wastage Buffer */}
      <ExtraTilesSlider
        type={kitchen.extra.type}
        percent={kitchen.extra.percent}
        boxes={kitchen.extra.boxes}
        baseTiles={combined.baseTilesNeeded}
        piecesPerBox={kitchen.countertopTile.piecesPerBox}
        onTypeChange={(t) => dispatch(setExtraType({ section: "kitchen", type: t }))}
        onPercentChange={(val) => dispatch(setExtraPercent({ section: "kitchen", value: val }))}
        onBoxesChange={(val) => dispatch(setExtraBoxes({ section: "kitchen", value: val }))}
      />

      {/* Result Summary */}
      <ResultSummary result={combined} unit={unit} title="Kitchen total calculation" />

      {/* Breakdown Table */}
      {combined.hasInputs ? (
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Kitchen surface breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-border/80">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold">Surface</th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Area ({areaUnitLabel(areaUnitFor(unit))})
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">Tiles</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Boxes</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Estimated Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {sections.map((section) => (
                    <tr key={section.label} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5 font-medium">{section.label}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">
                        {mm2ToArea(section.result.surfaceAreaMm2, areaUnitFor(unit)).toFixed(2)} {areaUnitLabel(areaUnitFor(unit))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-primary">{section.result.totalTiles}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{section.result.totalBoxes}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">
                        {CURRENCY_SYMBOL} {section.result.estimatedCost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

interface SurfaceTileCardProps {
  title: string;
  source: TileSourceMode;
  sku: string | null;
  tile: {
    length: number;
    width: number;
    piecesPerBox: number;
    pricePerBox: number;
    tileUnit: import("@/lib/constants").LengthUnit;
  };
  tileUnit: import("@/lib/constants").LengthUnit;
  onSourceChange: (value: TileSourceMode) => void;
  onSelect: (product: Product) => void;
  onClear: () => void;
  onTileChange: (
    tile: { length: number; width: number; piecesPerBox: number; pricePerBox: number; tileUnit: import("@/lib/constants").LengthUnit }
  ) => void;
}

function SurfaceTileCard({
  title,
  source,
  sku,
  tile,
  tileUnit,
  onSourceChange,
  onSelect,
  onClear,
  onTileChange,
}: SurfaceTileCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">Pick a tile or marble for this surface.</p>
        </div>
        <TileSourceToggle value={source} onChange={onSourceChange} />
      </CardHeader>
      <CardContent className="space-y-4">
        {source === "catalog" ? (
          <div className="space-y-3 rounded-lg border bg-card/40 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Catalog product</p>
                <p className="text-xs text-muted-foreground">
                  {sku ? `Selected: ${sku}` : "Browse the catalog to populate specs."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sku ? (
                  <Button variant="ghost" size="sm" onClick={onClear}>
                    <X className="mr-1 h-4 w-4" /> Clear
                  </Button>
                ) : null}
                <ProductPicker selectedSku={sku} onSelect={onSelect} />
              </div>
            </div>
            {sku ? (
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <Spec label="Length" value={`${tile.length} ${LENGTH_UNIT_LABELS[tile.tileUnit]}`} />
                <Spec label="Width" value={`${tile.width} ${LENGTH_UNIT_LABELS[tile.tileUnit]}`} />
                <Spec label="Pieces/box" value={tile.piecesPerBox.toString()} />
                <Spec label="Price/box" value={`${CURRENCY_SYMBOL} ${tile.pricePerBox.toFixed(2)}`} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Tile length</Label>
              <NumericInput
                value={tile.length}
                onValueChange={(value) => value !== null && onTileChange({ ...tile, length: value })}
                suffix={LENGTH_UNIT_LABELS[tile.tileUnit]}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Tile width</Label>
              <NumericInput
                value={tile.width}
                onValueChange={(value) => value !== null && onTileChange({ ...tile, width: value })}
                suffix={LENGTH_UNIT_LABELS[tile.tileUnit]}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Tile unit</Label>
              <ToggleGroup
                type="single"
                value={tile.tileUnit}
                onValueChange={(value: import("@/lib/constants").LengthUnit) => value && onTileChange({ ...tile, tileUnit: value })}
              >
                {SIZE_UNITS.map((u) => (
                  <ToggleGroupItem key={u} value={u} aria-label={LENGTH_UNIT_LABELS[u]}>
                    {LENGTH_UNIT_LABELS[u]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="space-y-2">
              <Label>Pieces per box</Label>
              <NumericInput
                value={tile.piecesPerBox}
                onValueChange={(value) => value !== null && onTileChange({ ...tile, piecesPerBox: Math.max(1, value) })}
                placeholder="Enter pieces"
                min={1}
                allowDecimal={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Price per box ({CURRENCY_SYMBOL})</Label>
              <NumericInput
                value={tile.pricePerBox}
                onValueChange={(value) => value !== null && onTileChange({ ...tile, pricePerBox: value })}
                suffix={CURRENCY_SYMBOL}
                min={0}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}