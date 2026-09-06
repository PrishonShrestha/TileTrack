"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { LENGTH_UNIT_LABELS } from "@/lib/constants-labels";
import { areaUnitFor, areaUnitLabel } from "@/features/calculator/lib/unitConversion";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trash2, Plus, DoorClosed } from "lucide-react";
import {
  removeWall,
  updateWall,
  addOpening,
  removeOpening,
  updateOpening,
  addWall,
} from "@/features/calculator/store/calculatorSlice";
import type { LengthUnit } from "@/lib/constants";

interface WallInputRowProps {
  section: "wall" | "bathroom";
  unit: LengthUnit;
}

export function WallInputRow({ section, unit }: WallInputRowProps) {
  const dispatch = useAppDispatch();
  const walls = useAppSelector((s) =>
    section === "wall" ? s.calculator.wall.walls : s.calculator.bathroom.walls,
  );

  const [wallModes, setWallModes] = useState<Record<string, "dimensions" | "area">>({});
  const areaLabel = areaUnitLabel(areaUnitFor(unit));

  return (
    <div className="space-y-4">
      {walls.map((wall, index) => {
        const mode = wallModes[wall.id] ?? "dimensions";
        const wallArea = Number((wall.length * wall.height).toFixed(2));

        return (
        <Card
          key={wall.id}
          className="border border-border/80 bg-muted/15 shadow-2xs"
        >
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <div className="flex flex-1 items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <input
                id={`wall-label-${wall.id}`}
                value={wall.label}
                onChange={(event) =>
                  dispatch(
                    updateWall({
                      section,
                      id: wall.id,
                      patch: { label: event.target.value },
                    }),
                  )
                }
                className="flex h-8.5 flex-1 max-w-xs rounded-md border border-input bg-background px-2.5 text-sm font-medium shadow-xs focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                placeholder={`Wall ${index + 1}`}
              />
            </div>
            {walls.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => dispatch(removeWall({ section, id: wall.id }))}
                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Remove ${wall.label}`}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {section === "wall" && (
              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <span className="text-xs font-medium text-muted-foreground">Input method:</span>
                <ToggleGroup
                  type="single"
                  value={mode}
                  onValueChange={(val) => {
                    if (val === "dimensions" || val === "area") {
                      setWallModes((prev) => ({ ...prev, [wall.id]: val }));
                    }
                  }}
                  className="bg-muted/40 p-0.5 rounded-lg"
                >
                  <ToggleGroupItem value="dimensions" className="text-xs px-2.5 py-1 h-7">
                    Length × Height
                  </ToggleGroupItem>
                  <ToggleGroupItem value="area" className="text-xs px-2.5 py-1 h-7">
                    Direct Area ({areaLabel})
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {mode === "dimensions" || section !== "wall" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Wall length / width
                  </Label>
                  <NumericInput
                    value={wall.length}
                    onValueChange={(val) =>
                      dispatch(
                        updateWall({
                          section,
                          id: wall.id,
                          patch: { length: val ?? 0 },
                        }),
                      )
                    }
                    suffix={LENGTH_UNIT_LABELS[unit]}
                    min={0}
                    allowDecimal={true}
                    placeholder="e.g. 10.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Wall height
                  </Label>
                  <NumericInput
                    value={wall.height}
                    onValueChange={(val) =>
                      dispatch(
                        updateWall({
                          section,
                          id: wall.id,
                          patch: { height: val ?? 0 },
                        }),
                      )
                    }
                    suffix={LENGTH_UNIT_LABELS[unit]}
                    min={0}
                    allowDecimal={true}
                    placeholder="e.g. 8.0"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 max-w-sm">
                <Label className="text-xs font-medium text-muted-foreground">
                  Wall direct area
                </Label>
                <NumericInput
                  value={wallArea > 0 ? wallArea : undefined}
                  onValueChange={(val) =>
                    dispatch(
                      updateWall({
                        section,
                        id: wall.id,
                        patch: { length: val ?? 0, height: 1 },
                      }),
                    )
                  }
                  suffix={areaLabel}
                  min={0}
                  allowDecimal={true}
                  placeholder="e.g. 144"
                />
                <p className="text-[11px] text-muted-foreground">
                  Direct surface area for this wall (openings can still be deducted below).
                </p>
              </div>
            )}

            {/* Openings deduction section */}
            <div className="space-y-2 rounded-lg border border-border/60 bg-background/50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DoorClosed className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold">
                    Opening deductions (doors &amp; windows)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    dispatch(addOpening({ section, wallId: wall.id }))
                  }
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" /> Add opening
                </Button>
              </div>

              {wall.openings.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No openings deducted. Add doors or windows to subtract their
                  area from this wall.
                </p>
              ) : null}

              {wall.openings.map((opening) => (
                <div
                  key={opening.id}
                  className="grid grid-cols-1 gap-2 rounded-md border border-border/80 bg-background p-2 sm:grid-cols-[1.2fr_1fr_1fr_auto] items-center"
                >
                  <input
                    value={opening.label}
                    onChange={(event) =>
                      dispatch(
                        updateOpening({
                          section,
                          wallId: wall.id,
                          openingId: opening.id,
                          patch: { label: event.target.value },
                        }),
                      )
                    }
                    placeholder="Door / Window label"
                    className="h-8.5 rounded-md border border-input bg-background px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                  <NumericInput
                    value={opening.width}
                    onValueChange={(val) =>
                      dispatch(
                        updateOpening({
                          section,
                          wallId: wall.id,
                          openingId: opening.id,
                          patch: { width: val ?? 0 },
                        }),
                      )
                    }
                    suffix={LENGTH_UNIT_LABELS[unit]}
                    min={0}
                    allowDecimal={true}
                    placeholder="Width"
                    className="h-8.5 text-xs"
                  />
                  <NumericInput
                    value={opening.height}
                    onValueChange={(val) =>
                      dispatch(
                        updateOpening({
                          section,
                          wallId: wall.id,
                          openingId: opening.id,
                          patch: { height: val ?? 0 },
                        }),
                      )
                    }
                    suffix={LENGTH_UNIT_LABELS[unit]}
                    min={0}
                    allowDecimal={true}
                    placeholder="Height"
                    className="h-8.5 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      dispatch(
                        removeOpening({
                          section,
                          wallId: wall.id,
                          openingId: opening.id,
                        }),
                      )
                    }
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove opening ${opening.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={() => dispatch(addWall({ section }))}
        className="w-full gap-1.5 border-dashed py-5 text-sm font-medium hover:border-primary hover:bg-primary/5"
      >
        <Plus className="h-4 w-4" /> Add another wall
      </Button>

      <span className="sr-only" aria-live="polite">
        {walls.length} wall{walls.length === 1 ? "" : "s"}
      </span>
    </div>
  );
}
