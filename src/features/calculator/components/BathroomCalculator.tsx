"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetBathroom,
  selectCatalogTile,
  setBathroomField,
  setExtraType,
  setExtraPercent,
  setExtraBoxes,
  setBathroomFloorTileSource,
  setBathroomWallTileSource,
} from "@/features/calculator/store/calculatorSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, Bath, Square, Ruler, Grid2X2 } from "lucide-react";
import { UnitToggle } from "./UnitToggle";
import { TileSourceToggle } from "./TileSourceToggle";
import { ExtraTilesSlider } from "./ExtraTilesSlider";
import { WallInputRow } from "./WallInputRow";
import { ResultSummary } from "./ResultSummary";
import { ProductPicker } from "@/features/catalog/components/ProductPicker";
import { selectBathroomResult } from "../store/selectors";
import { NumericInput } from "@/components/ui/numeric-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SIZE_UNITS } from "@/lib/constants";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { LENGTH_UNIT_LABELS } from "@/lib/constants-labels";
import type { Product, TileSourceMode, LengthUnit } from "@/types/domain";

export function BathroomCalculator() {
  const dispatch = useAppDispatch();
  const unit = useAppSelector((s) => s.calculator.unit);
  const bathroom = useAppSelector((s) => s.calculator.bathroom);
  const { combined, floor, wall, wallCombined } = useAppSelector(selectBathroomResult);

  const handleSelectProduct = (target: "main" | "floor", product: Product) => {
    dispatch(
      selectCatalogTile({
        section: "bathroom",
        target,
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
      {/* Bathroom Floor Area Card */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Square className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Bathroom floor</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Bathroom floor area to tile.</p>
          </div>
          <div className="flex items-center gap-2">
            <UnitToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => dispatch(resetBathroom())}
              className="h-8 w-8 shrink-0"
              title="Reset bathroom"
              aria-label="Reset bathroom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Floor length</Label>
              <NumericInput
                value={bathroom.floorLength}
                onValueChange={(val) => dispatch(setBathroomField({ floorLength: val ?? 0 }))}
                suffix={LENGTH_UNIT_LABELS[unit]}
                min={0}
                allowDecimal={true}
                placeholder="e.g. 8.5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Floor width</Label>
              <NumericInput
                value={bathroom.floorWidth}
                onValueChange={(val) => dispatch(setBathroomField({ floorWidth: val ?? 0 }))}
                suffix={LENGTH_UNIT_LABELS[unit]}
                min={0}
                allowDecimal={true}
                placeholder="e.g. 6.0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bathroom Walls Card */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Bathroom walls</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Add each wall to tile (usually 2 to 4 walls) with door/window deductions.
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <WallInputRow section="bathroom" unit={unit} />
        </CardContent>
      </Card>

      {/* Floor Tile Selection */}
      <SurfaceTileCard
        title="Floor tile specification"
        source={bathroom.floorSource}
        sku={bathroom.floorSku}
        tile={bathroom.floorTile}
        onSourceChange={(val) => dispatch(setBathroomFloorTileSource(val))}
        onSelect={(product) => handleSelectProduct("floor", product)}
        onClear={() =>
          dispatch(
            selectCatalogTile({
              section: "bathroom",
              target: "floor",
              sku: null,
              tile: { length: 0, width: 0, piecesPerBox: 1, pricePerBox: 0, tileUnit: unit },
            })
          )
        }
        onTileChange={(tile) => dispatch(setBathroomField({ floorTile: tile }))}
      />

      {/* Wall Tile Selection */}
      <SurfaceTileCard
        title="Wall tile specification"
        source={bathroom.tileSource}
        sku={bathroom.selectedSku}
        tile={bathroom.tile}
        onSourceChange={(val) => dispatch(setBathroomWallTileSource(val))}
        onSelect={(product) => handleSelectProduct("main", product)}
        onClear={() =>
          dispatch(
            selectCatalogTile({
              section: "bathroom",
              target: "main",
              sku: null,
              tile: { length: 0, width: 0, piecesPerBox: 1, pricePerBox: 0, tileUnit: unit },
            })
          )
        }
        onTileChange={(tile) => dispatch(setBathroomField({ tile }))}
      />

      {/* Extra Wastage Buffer */}
      <ExtraTilesSlider
        type={bathroom.extra.type}
        percent={bathroom.extra.percent}
        boxes={bathroom.extra.boxes}
        baseTiles={combined.baseTilesNeeded}
        piecesPerBox={bathroom.floorTile.piecesPerBox}
        onTypeChange={(t) => dispatch(setExtraType({ section: "bathroom", type: t }))}
        onPercentChange={(val) => dispatch(setExtraPercent({ section: "bathroom", value: val }))}
        onBoxesChange={(val) => dispatch(setExtraBoxes({ section: "bathroom", value: val }))}
      />

      {/* Overall Bathroom Result */}
      <ResultSummary result={combined} unit={unit} title="Bathroom total calculation" />

      {/* Floor vs Wall Breakdown Cards */}
      {combined.hasInputs ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ResultSummary result={floor} unit={unit} title="Floor portion only" showCost={true} />
          <ResultSummary
            result={wallCombined}
            unit={unit}
            title="Walls portion only"
            showCost={true}
          />
        </div>
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
    tileUnit: LengthUnit;
  };
  onSourceChange: (value: TileSourceMode) => void;
  onSelect: (product: Product) => void;
  onClear: () => void;
  onTileChange: (
    tile: { length: number; width: number; piecesPerBox: number; pricePerBox: number; tileUnit: LengthUnit }
  ) => void;
}

function SurfaceTileCard({
  title,
  source,
  sku,
  tile,
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
          <p className="text-sm text-muted-foreground">Pick a manual size or load from the catalog.</p>
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
                onValueChange={(value: LengthUnit) => value && onTileChange({ ...tile, tileUnit: value })}
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