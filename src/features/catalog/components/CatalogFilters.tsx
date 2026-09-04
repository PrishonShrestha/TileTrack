"use client";

import {
  useGetProductsQuery,
  useGetBrandsQuery,
  useGetTypesQuery,
  useGetColorVariantsQuery,
} from "@/features/catalog/store/catalogApi";
import { uniqueProductColorVariants, uniqueProductTypes, uniqueProductBrands } from "@/lib/catalog-helpers";
import { memo, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setRangeFilter,
  toggleArrayFilter,
} from "@/features/catalog/store/catalogSlice";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { resetFilters } from "@/features/catalog/store/catalogSlice";

function CatalogFiltersBase() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.catalog);
  const { data: products = [] } = useGetProductsQuery();
  const { data: sheetBrands = [] } = useGetBrandsQuery();
  const { data: sheetTypes = [] } = useGetTypesQuery();
  const { data: sheetColorVariants = [] } = useGetColorVariantsQuery();

  const types = useMemo(() => {
    const fromSheet = sheetTypes.map((t) => t.name).filter(Boolean);
    if (fromSheet.length > 0) return Array.from(new Set(fromSheet)).sort();
    return uniqueProductTypes(products);
  }, [sheetTypes, products]);

  const brandNames = useMemo(() => {
    const fromSheet = sheetBrands.map((b) => b.name).filter(Boolean);
    if (fromSheet.length > 0) return Array.from(new Set(fromSheet)).sort();
    return uniqueProductBrands(products);
  }, [sheetBrands, products]);

  const colorVariants = useMemo(() => {
    const fromSheet = sheetColorVariants.map((c) => c.name).filter(Boolean);
    if (fromSheet.length > 0) return Array.from(new Set(fromSheet)).sort();
    return uniqueProductColorVariants(products);
  }, [sheetColorVariants, products]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={() => dispatch(resetFilters())}>
          Reset
        </Button>
      </div>

      <FilterGroup title="Type">
        {types.length === 0 ? <p className="text-xs text-muted-foreground">No types available.</p> : null}
        {types.map((value) => (
          <FilterCheckbox
            key={value}
            label={value}
            checked={filters.types.includes(value)}
            onChange={() => dispatch(toggleArrayFilter({ key: "types", value }))}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Brand">
        {brandNames.map((value) => (
          <FilterCheckbox
            key={value}
            label={value}
            checked={filters.brands.includes(value)}
            onChange={() => dispatch(toggleArrayFilter({ key: "brands", value }))}
          />
        ))}
      </FilterGroup>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Color variant</Label>
        <div className="flex flex-wrap gap-2">
          {colorVariants.map((color: string) => (
            <FilterChip
              key={color}
              label={color}
              active={filters.colorVariants.includes(color)}
              onClick={() => dispatch(toggleArrayFilter({ key: "colorVariants", value: color }))}
            />
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Price range / box</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(event) =>
              dispatch(
                setRangeFilter({
                  key: "minPrice",
                  value: event.target.value === "" ? null : Number(event.target.value),
                })
              )
            }
          />
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(event) =>
              dispatch(
                setRangeFilter({
                  key: "maxPrice",
                  value: event.target.value === "" ? null : Number(event.target.value),
                })
              )
            }
          />
        </div>
      </div>
    </div>
  );
}

export const CatalogFilters = memo(CatalogFiltersBase);

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  label: labelText,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md px-1 py-0.5 text-sm text-foreground transition-colors hover:bg-muted/50">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span>{labelText}</span>
    </label>
  );
}

function FilterChip({
  label: labelText,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted"
      }`}
    >
      {labelText}
    </button>
  );
}
