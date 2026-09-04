"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetWall,
  selectCatalogTile,
  setExtraType,
  setExtraPercent,
  setExtraBoxes,
  setWallSectionField,
  setWallTileSource,
} from "@/features/calculator/store/calculatorSlice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw, X, Ruler, Grid2X2, Table as TableIcon } from "lucide-react";
import { UnitToggle } from "./UnitToggle";
import { TileSourceToggle } from "./TileSourceToggle";
import { ExtraTilesSlider } from "./ExtraTilesSlider";
import { WallInputRow } from "./WallInputRow";
import { ResultSummary } from "./ResultSummary";
import { ProductPicker } from "@/features/catalog/components/ProductPicker";
import { selectWallResult } from "../store/selectors";
import { LENGTH_UNIT_LABELS } from "@/lib/constants-labels";
import { areaUnitFor, areaUnitLabel, mm2ToArea } from "@/features/calculator/lib/unitConversion";
import { NumericInput } from "@/components/ui/numeric-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SIZE_UNITS } from "@/lib/constants";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { Product, TileSourceMode, LengthUnit } from "@/types/domain";

export function WallCalculator() {
  const dispatch = useAppDispatch();
  const unit = useAppSelector((s) => s.calculator.unit);
  const wall = useAppSelector((s) => s.calculator.wall);
  const { combined, sections } = useAppSelector(selectWallResult);

  const handleSourceChange = (value: TileSourceMode) => dispatch(setWallTileSource(value));
  const handleSelectProduct = (product: Product) => {
    dispatch(
      selectCatalogTile({
        section: "wall",
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

  return (
    <div className="space-y-6">
      {/* Walls Input Card */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Walls</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Add each wall with its length and height. Deduct doors and windows to calculate net area accurately.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <UnitToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(resetWall())}
              className="h-8 gap-1 text-xs"
              aria-label="Reset walls"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <WallInputRow section="wall" unit={unit} />
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
              Pick custom tile dimensions or load specs from the product catalog.
            </p>
          </div>
          <TileSourceToggle value={wall.tileSource} onChange={handleSourceChange} />
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {wall.tileSource === "catalog" ? (
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Catalog product</p>
                  <p className="text-xs text-muted-foreground">
                    {wall.selectedSku
                      ? `Selected: ${wall.selectedSku}`
                      : "Browse the catalog to auto-fill tile dimensions and price."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {wall.selectedSku ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        dispatch(
                          selectCatalogTile({
                            section: "wall",
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
                    selectedSku={wall.selectedSku}
                    onSelect={handleSelectProduct}
                  />
                </div>
              </div>
              {wall.selectedSku ? (
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 pt-1">
                  <Spec label="Length" value={`${wall.tile.length} ${LENGTH_UNIT_LABELS[wall.tile.tileUnit]}`} />
                  <Spec label="Width" value={`${wall.tile.width} ${LENGTH_UNIT_LABELS[wall.tile.tileUnit]}`} />
                  <Spec label="Pieces / Box" value={wall.tile.piecesPerBox.toString()} />
                  <Spec label="Price / Box" value={`${CURRENCY_SYMBOL} ${wall.tile.pricePerBox.toFixed(2)}`} />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tile length</Label>
                  <NumericInput
                    value={wall.tile.length}
                    onValueChange={(val) =>
                      dispatch(
                        setWallSectionField({
                          tile: { ...wall.tile, length: val ?? 0 },
                        })
                      )
                    }
                    suffix={LENGTH_UNIT_LABELS[wall.tile.tileUnit]}
                    min={0}
                    allowDecimal={true}
                    placeholder="e.g. 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tile width</Label>
                  <NumericInput
                    value={wall.tile.width}
                    onValueChange={(val) =>
                      dispatch(
                        setWallSectionField({
                          tile: { ...wall.tile, width: val ?? 0 },
                        })
                      )
                    }
                    suffix={LENGTH_UNIT_LABELS[wall.tile.tileUnit]}
                    min={0}
                    allowDecimal={true}
                    placeholder="e.g. 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tile size unit</Label>
                  <ToggleGroup
                    type="single"
                    value={wall.tile.tileUnit}
                    onValueChange={(val: LengthUnit) =>
                      val && dispatch(setWallSectionField({ tile: { ...wall.tile, tileUnit: val } }))
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
                    value={wall.tile.piecesPerBox}
                    onValueChange={(val) =>
                      dispatch(
                        setWallSectionField({
                          tile: { ...wall.tile, piecesPerBox: val ? Math.max(1, Math.round(val)) : 1 },
                        })
                      )
                    }
                    placeholder="e.g. 6"
                    min={1}
                    step={1}
                    allowDecimal={false}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price per box ({CURRENCY_SYMBOL})</Label>
                  <NumericInput
                    value={wall.tile.pricePerBox}
                    onValueChange={(val) =>
                      dispatch(
                        setWallSectionField({
                          tile: { ...wall.tile, pricePerBox: val ?? 0 },
                        })
                      )
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
        type={wall.extra.type}
        percent={wall.extra.percent}
        boxes={wall.extra.boxes}
        baseTiles={combined.baseTilesNeeded}
        piecesPerBox={wall.tile.piecesPerBox}
        onTypeChange={(t) => dispatch(setExtraType({ section: "wall", type: t }))}
        onPercentChange={(val) => dispatch(setExtraPercent({ section: "wall", value: val }))}
        onBoxesChange={(val) => dispatch(setExtraBoxes({ section: "wall", value: val }))}
      />

      {/* Result Summary */}
      <ResultSummary
        result={combined}
        unit={unit}
        sku={wall.selectedSku}
        productName={wall.selectedSku ?? undefined}
        title="Wall calculation total"
      />

      {/* Per-wall Breakdown Table */}
      {sections.length > 0 && combined.hasInputs ? (
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Per-wall breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border border-border/80">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold">Wall</th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Net area ({areaUnitLabel(areaUnitFor(unit))})
                    </th>
                    <th className="px-3 py-2.5 text-right font-semibold">Base tiles</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Total tiles</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Boxes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {sections.map((section) => (
                    <tr key={section.label} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2.5 font-medium">{section.label}</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground font-mono text-xs">
                        {mm2ToArea(section.area, areaUnitFor(unit)).toFixed(2)} {areaUnitLabel(areaUnitFor(unit))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono">{section.result.baseTilesNeeded}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-primary">{section.result.totalTiles}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{section.result.totalBoxes}</td>
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

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-2">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}