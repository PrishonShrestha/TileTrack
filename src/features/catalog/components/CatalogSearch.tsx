"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSearch } from "@/features/catalog/store/catalogSlice";
import { Button } from "@/components/ui/button";

export function CatalogSearch() {
  const dispatch = useAppDispatch();
  const value = useAppSelector((s) => s.catalog.search);
  return (
    <div className="relative w-full sm:max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search by name, product ID, brand, or color variant"
        value={value}
        onChange={(event) => dispatch(setSearch(event.target.value))}
        className="pl-9 pr-10"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => dispatch(setSearch(""))}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
