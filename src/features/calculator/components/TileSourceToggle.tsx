"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TileSourceMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TileSourceToggleProps {
  value: TileSourceMode;
  onChange: (value: TileSourceMode) => void;
  className?: string;
  id?: string;
}

export function TileSourceToggle({ value, onChange, className, id }: TileSourceToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next: TileSourceMode) => next && onChange(next)}
      className={cn("inline-flex w-full sm:w-auto", className)}
      aria-label="Tile source"
      id={id}
    >
      <ToggleGroupItem value="manual" className="flex-1 sm:flex-none">
        Manual size
      </ToggleGroupItem>
      <ToggleGroupItem value="catalog" className="flex-1 sm:flex-none">
        From catalog
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
