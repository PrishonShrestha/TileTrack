"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useGetProductsQuery } from "@/features/catalog/store/catalogApi";
import { useGetStockQuery } from "@/features/stock/store/stockApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatStockBoxesAndPieces } from "@/lib/utils";
import { LENGTH_UNIT_LABELS } from "@/lib/constants-labels";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { Product } from "@/types/domain";

interface ProductPickerProps {
  selectedSku?: string | null;
  selectedProductId?: string | null;
  onSelect: (product: Product) => void;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost";
}

export function ProductPicker({
  selectedSku,
  selectedProductId,
  onSelect,
  triggerLabel = "Browse catalog",
  triggerVariant = "outline",
}: ProductPickerProps) {
  const selectedId = selectedProductId || selectedSku;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: products, isLoading, isError } = useGetProductsQuery();
  const { data: stock = [] } = useGetStockQuery();

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      [product.productName, product.productId, product.colorVariant, product.brand]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, search]);

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    stock.forEach((s) => map.set(s.productId || s.sku || "", s.stockBoxes));
    return map;
  }, [stock]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className="w-full sm:w-auto">
          {selectedId ? "Change product" : triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Select a product</DialogTitle>
          <DialogDescription>
            Search the catalog to pre-fill tile dimensions, pieces per box, and pricing.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, product ID, brand, or color variant"
              className="pl-9"
            />
          </div>
        </div>
        <ScrollArea className="max-h-[60vh] border-t">
          <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-24 w-full" />
                ))
              : null}
            {isError ? (
              <div className="col-span-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                Failed to load products. Check your API connection.
              </div>
            ) : null}
            {!isLoading && !isError && filtered.length === 0 ? (
              <div className="col-span-2 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                No products match your search.
              </div>
            ) : null}
            {filtered.map((product) => {
              const remaining = stockMap.get(product.productId) ?? 0;
              return (
                <button
                  key={product.productId}
                  onClick={() => {
                    onSelect(product);
                    setOpen(false);
                  }}
                  className={`group flex h-full flex-col gap-1 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 ${
                    product.productId === selectedId ? "border-primary/60 bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold leading-tight">{product.productName}</div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {product.productId}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {product.length} × {product.width} {LENGTH_UNIT_LABELS[product.sizeUnit]} · {product.piecesPerBox} pcs/box
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{product.brand} · {product.colorVariant || "—"}</span>
                    <span className="font-semibold text-foreground">
                      {CURRENCY_SYMBOL} {formatNumber(product.pricePerBox, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Stock: {formatStockBoxesAndPieces(remaining, product.piecesPerBox)}</span>
                    <Badge
                      variant={remaining > 0 ? "success" : "destructive"}
                      className="text-[10px]"
                    >
                      {remaining > 0 ? "In stock" : "Out"}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}