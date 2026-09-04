"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { NumericInput } from "@/components/ui/numeric-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Minus, Plus, Percent, Boxes as BoxesIcon, Sparkles } from "lucide-react";
import {
  MAX_WASTAGE_PERCENT,
  MIN_WASTAGE_PERCENT,
  MAX_EXTRA_BOXES,
} from "@/lib/constants";
import { clampWastage, safeCeil } from "@/features/calculator/lib/formulas";
import type { WastageType } from "@/lib/constants";

interface ExtraTilesSliderProps {
  type?: WastageType;
  percent: number;
  boxes: number;
  baseTiles: number;
  piecesPerBox: number;
  onTypeChange?: (type: WastageType) => void;
  onPercentChange: (value: number) => void;
  onBoxesChange: (value: number) => void;
}

const PERCENT_PRESETS = [5, 10, 15, 20, 25];
const BOX_PRESETS = [1, 2, 3, 5];

export function ExtraTilesSlider({
  type = "percent",
  percent,
  boxes,
  baseTiles,
  piecesPerBox,
  onTypeChange,
  onPercentChange,
  onBoxesChange,
}: ExtraTilesSliderProps) {
  const currentPercent = clampWastage(percent);
  const currentBoxes = Math.max(0, boxes);
  const safePieces = piecesPerBox > 0 ? piecesPerBox : 1;

  const maxExtraBoxes =
    baseTiles > 0
      ? Math.max(MAX_EXTRA_BOXES, Math.ceil(baseTiles / safePieces) * 2)
      : MAX_EXTRA_BOXES;

  // Extra tiles calculated for display only in each mode
  const extraTilesFromPercent =
    baseTiles > 0 ? safeCeil(baseTiles * (currentPercent / 100)) : 0;
  const extraTilesFromBoxes = currentBoxes * safePieces;

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
      {/* Header with Title & Mode Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div>
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold">Extra tiles (wastage buffer)</Label>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              {type === "percent"
                ? `${currentPercent}% buffer`
                : `+${currentBoxes} box${currentBoxes === 1 ? "" : "es"}`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose either percentage buffer or a fixed number of extra boxes.
          </p>
        </div>

        {/* Mode Toggle: Percentage OR Extra Boxes */}
        {onTypeChange ? (
          <ToggleGroup
            type="single"
            value={type}
            onValueChange={(val: WastageType) => {
              if (val) onTypeChange(val);
            }}
            className="border border-border/80 rounded-lg p-0.5 bg-muted/30 self-start sm:self-auto"
          >
            <ToggleGroupItem
              value="percent"
              className="h-8 px-3 text-xs font-medium gap-1.5 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-2xs"
              aria-label="Use percentage buffer"
            >
              <Percent className="h-3.5 w-3.5" />
              Percentage (%)
            </ToggleGroupItem>
            <ToggleGroupItem
              value="boxes"
              className="h-8 px-3 text-xs font-medium gap-1.5 data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-2xs"
              aria-label="Use extra boxes"
            >
              <BoxesIcon className="h-3.5 w-3.5" />
              Extra boxes
            </ToggleGroupItem>
          </ToggleGroup>
        ) : null}
      </div>

      {/* Mode 1: Percentage Controls ONLY */}
      {type === "percent" ? (
        <div className="space-y-3.5 rounded-lg border border-border/60 bg-muted/15 p-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground">Percentage Buffer</span>
              <p className="text-[11px] text-muted-foreground">
                {baseTiles > 0
                  ? `Adds +${extraTilesFromPercent} extra tiles to your ${baseTiles} base tiles.`
                  : "Recommended 5%–15% for cuts, corners, and repair spares."}
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {PERCENT_PRESETS.map((p) => {
                const isSelected = Math.abs(currentPercent - p) < 0.25;
                return (
                  <Button
                    key={p}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs font-medium"
                    onClick={() => onPercentChange(p)}
                  >
                    +{p}%
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Slider & Numeric Input */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_90px] items-center pt-1">
            <div className="space-y-1.5">
              <Slider
                min={MIN_WASTAGE_PERCENT}
                max={MAX_WASTAGE_PERCENT}
                step={1}
                value={[currentPercent]}
                onValueChange={(val) => {
                  const valNum = val[0] ?? 0;
                  onPercentChange(clampWastage(valNum));
                }}
                aria-label="Wastage percentage slider"
                className="py-1 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <NumericInput
              value={currentPercent}
              onValueChange={(val) => onPercentChange(clampWastage(val ?? 0))}
              min={MIN_WASTAGE_PERCENT}
              max={MAX_WASTAGE_PERCENT}
              step={1}
              suffix="%"
              allowDecimal={true}
              className="h-8.5 text-center font-mono text-xs font-semibold"
              aria-label="Wastage percentage input"
            />
          </div>
        </div>
      ) : (
        /* Mode 2: Extra Boxes Controls ONLY */
        <div className="space-y-3.5 rounded-lg border border-border/60 bg-muted/15 p-3.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground">Exact Extra Boxes</span>
              <p className="text-[11px] text-muted-foreground">
                {baseTiles > 0
                  ? `Adds exactly +${currentBoxes} box${currentBoxes === 1 ? "" : "es"} (+${extraTilesFromBoxes} tiles) on top of base requirements.`
                  : "Add specific whole boxes for spare attic stock or unexpected breakage."}
              </p>
            </div>

            {/* Quick Box Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {BOX_PRESETS.map((b) => {
                const isSelected = currentBoxes === b;
                return (
                  <Button
                    key={b}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2.5 text-xs font-medium"
                    onClick={() => onBoxesChange(b)}
                  >
                    +{b} {b === 1 ? "box" : "boxes"}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Box Stepper & Numeric Input */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-muted-foreground">Number of extra boxes to add:</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8.5 w-8.5 shrink-0"
                disabled={currentBoxes <= 0}
                onClick={() => onBoxesChange(Math.max(0, currentBoxes - 1))}
                aria-label="Decrease extra boxes"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>

              <div className="w-24">
                <NumericInput
                  value={currentBoxes}
                  onValueChange={(val) =>
                    onBoxesChange(Math.max(0, Math.min(maxExtraBoxes, val ?? 0)))
                  }
                  min={0}
                  max={maxExtraBoxes}
                  step={1}
                  allowDecimal={false}
                  className="h-8.5 text-center font-mono font-semibold text-xs"
                  aria-label="Extra boxes count"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8.5 w-8.5 shrink-0"
                onClick={() => onBoxesChange(currentBoxes + 1)}
                aria-label="Increase extra boxes"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>

              <span className="text-xs font-medium text-muted-foreground ml-1">boxes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}