"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUnit } from "@/features/calculator/store/calculatorSlice";
import { ROOM_UNITS, type LengthUnit } from "@/lib/constants";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const ROOM_UNIT_LABELS: Record<"ft" | "m" | "inch", string> = {
  ft: "ft",
  m: "m",
  inch: "in",
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
      aria-label="Room measurement unit"
    >
      {ROOM_UNITS.map((u) => (
        <ToggleGroupItem
          key={u}
          value={u}
          className="h-8 px-2.5 text-xs font-semibold"
          aria-label={ROOM_UNIT_LABELS[u as "ft" | "m" | "inch"]}
        >
          {ROOM_UNIT_LABELS[u as "ft" | "m" | "inch"]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
