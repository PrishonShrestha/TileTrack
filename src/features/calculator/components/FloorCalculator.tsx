"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetFloor,
  selectCatalogTile,
  setExtraType,
  setExtraPercent,
  setExtraBoxes,
  setFloorField,
  setFloorTileSource,
} from "@/features/calculator/store/calculatorSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LENGTH_UNIT_LABELS } from "@/lib/constants-labels";
import { UnitToggle } from "./UnitToggle";
import { TileSourceToggle } from "./TileSourceToggle";
import { ExtraTilesSlider } from "./ExtraTilesSlider";
import { ResultSummary } from "./ResultSummary";
import { ProductPicker } from "@/features/catalog/components/ProductPicker";
import { selectFloorResult } from "../store/selectors";
import { RotateCcw, X, Layers, Grid2X2 } from "lucide-react";
import type { Product, TileSourceMode, LengthUnit } from "@/types/domain";
import { SIZE_UNITS } from "@/lib/constants";
import { CURRENCY_SYMBOL } from "@/lib/constants";

export function FloorCalculator() {
  const dispatch = useAppDispatch();
  const unit = useAppSelector((s) => s.calculator.unit);
  const floor = useAppSelector((s) => s.calculator.floor);
  const result = useAppSelector(selectFloorResult);

  const handleSourceChange = (value: TileSourceMode) => {
    dispatch(setFloorTileSource(value));
  };

  const handleSelectProduct = (product: Product) => {
    dispatch(
      selectCatalogTile({
        section: "floor",
        target: "main",
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

  const selectedProductName = floor.selectedSku ?? undefined;

  return (
    <div className="space-y-6">
      {/* Room Dimensions Card */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Room dimensions</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the length and width of the floor you want to tile.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <UnitToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(resetFloor())}
              className="h-8 gap-1 text-xs"
              aria-label="Reset floor inputs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Room length</Label>
              <NumericInput
                value={floor.length}
                onValueChange={(val) => dispatch(setFloorField({ length: val ?? 0 }))}
                suffix={LENGTH_UNIT_LABELS[unit]}
                min={0}
                allowDecimal={true}
                placeholder="e.g. 15.5"
                aria-label="Room length"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Room width</Label>
              <NumericInput
                value={floor.width}
                onValueChange={(val) => dispatch(setFloorField({ width: val ?? 0 }))}
                suffix={LENGTH_UNIT_LABELS[unit]}
                min={0}
                allowDecimal={true}
                placeholder="e.g. 12.25"
                aria-label="Room width"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tile Specifications Card */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Grid2X2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Tile source</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Use custom tile dimensions or pick from the live product catalog.
            </p>
          </div>
          <TileSourceToggle value={floor.tileSource} onChange={handleSourceChange} />
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {floor.tileSource === "catalog" ? (
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Catalog product</p>
                  <p className="text-xs text-muted-foreground">
                    {floor.selectedSku
                      ? `Selected: ${floor.selectedSku}`
                      : "Browse catalog to auto-fill tile dimensions, box pieces, and pricing."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {floor.selectedSku ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        dispatch(
                          selectCatalogTile({
                            section: "floor",
                            target: "main",
                            sku: null,
                            tile: { length: 0, width: 0, piecesPerBox: 1, pricePerBox: 0, tileUnit: unit },
                          })
                        )
                      }
                      className="h-8 text-xs text-destructive hover:text-destructive"
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Clear
                    </Button>
                  ) : null}
                  <ProductPicker
                    selectedSku={floor.selectedSku}
                    onSelect={handleSelectProduct}
                  />
                </div>
              </div>
              {floor.selectedSku ? (
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 pt-1">
                  <Spec label="Length" value={`${floor.tile.length} ${LENGTH_UNIT_LABELS[floor.tile.tileUnit]}`} />
                  <Spec label="Width" value={`${floor.tile.width} ${LENGTH_UNIT_LABELS[floor.tile.tileUnit]}`} />
                  <Spec label="Pieces / Box" value={floor.tile.piecesPerBox.toString()} />
                  <Spec label="Price / Box" value={`${CURRENCY_SYMBOL} ${floor.tile.pricePerBox.toFixed(2)}`} />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tile length</Label>
                  <NumericInput
                    value={floor.tile.length}
                    onValueChange={(val) =>
                      dispatch(setFloorField({ tile: { ...floor.tile, length: val ?? 0 } }))
                    }
                    suffix={LENGTH_UNIT_LABELS[floor.tile.tileUnit]}
                    min={0}
                    allowDecimal={true}
                    placeholder="e.g. 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tile width</Label>
                  <NumericInput
                    value={floor.tile.width}
                    onValueChange={(val) =>
                      dispatch(setFloorField({ tile: { ...floor.tile, width: val ?? 0 } }))
                    }
                    suffix={LENGTH_UNIT_LABELS[floor.tile.tileUnit]}
                    min={0}
                    allowDecimal={true}
                    placeholder="e.g. 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tile size unit</Label>
                  <ToggleGroup
                    type="single"
                    value={floor.tile.tileUnit}
                    onValueChange={(val: LengthUnit) =>
                      val && dispatch(setFloorField({ tile: { ...floor.tile, tileUnit: val } }))
                    }
                    className="w-full justify-start"
                  >
                    {SIZE_UNITS.map((u) => (
                      <ToggleGroupItem key={u} value={u} className="flex-1 text-xs" aria-label={LENGTH_UNIT_LABELS[u]}>
                        {LENGTH_UNIT_LABELS[u]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pieces per box</Label>
                  <NumericInput
                    value={floor.tile.piecesPerBox}
                    onValueChange={(val) =>
                      dispatch(setFloorField({ tile: { ...floor.tile, piecesPerBox: val ? Math.max(1, Math.round(val)) : 1 } }))
                    }
                    placeholder="e.g. 4"
                    min={1}
                    step={1}
                    allowDecimal={false}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price per box ({CURRENCY_SYMBOL})</Label>
                  <NumericInput
                    value={floor.tile.pricePerBox}
                    onValueChange={(val) =>
                      dispatch(setFloorField({ tile: { ...floor.tile, pricePerBox: val ?? 0 } }))
                    }
                    suffix={CURRENCY_SYMBOL}
                    min={0}
                    allowDecimal={true}
                    placeholder="e.g. 1500"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extra Wastage Buffer Section */}
      <ExtraTilesSlider
        type={floor.extra.type}
        percent={floor.extra.percent}
        boxes={floor.extra.boxes}
        baseTiles={result.baseTilesNeeded}
        piecesPerBox={floor.tile.piecesPerBox}
        onTypeChange={(t) => dispatch(setExtraType({ section: "floor", type: t }))}
        onPercentChange={(val) => dispatch(setExtraPercent({ section: "floor", value: val }))}
        onBoxesChange={(val) => dispatch(setExtraBoxes({ section: "floor", value: val }))}
      />

      {/* Live Result Summary */}
      <ResultSummary
        result={result}
        unit={unit}
        sku={floor.selectedSku}
        productName={selectedProductName}
        title="Floor calculation result"
      />
    </div>
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