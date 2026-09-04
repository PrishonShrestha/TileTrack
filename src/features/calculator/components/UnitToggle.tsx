"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUnit } from "@/features/calculator/store/calculatorSlice";
import { SIZE_UNITS, type LengthUnit } from "@/lib/constants";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const LABELS: Record<LengthUnit, string> = {
  ft: "Feet",
  m: "Meters",
  inch: "Inches",
  mm: "mm",
  cm: "cm",
};

export function UnitToggle({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const unit = useAppSelector((state) => state.calculator.unit);
  return (
    <ToggleGroup
      type="single"
      value={unit}
      onValueChange={(value: LengthUnit) => value && dispatch(setUnit(value))}
      className={className}
      aria-label="Measurement unit"
    >
      {SIZE_UNITS.map((u) => (
        <ToggleGroupItem key={u} value={u} aria-label={LABELS[u]}>
          {LABELS[u]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
