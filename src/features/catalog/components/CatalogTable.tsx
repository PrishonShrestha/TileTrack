"use client";

import { useGetProductsQuery } from "@/features/catalog/store/catalogApi";
import { useGetStockQuery } from "@/features/stock/store/stockApi";
import { useAppSelector } from "@/store/hooks";
import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LENGTH_UNIT_LABELS } from "@/lib/constants-labels";
import { formatCurrency, formatNumber, formatStockBoxesAndPieces } from "@/lib/utils";
import { StockUpdateButton } from "@/features/stock/components/StockUpdateButton";
import { ProductCard } from "./ProductCard";
import { ProductFormDialog } from "./ProductFormDialog";
import { ProductDeleteDialog } from "./ProductDeleteDialog";
import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types/domain";

export function CatalogTable() {
  const filters = useAppSelector((s) => s.catalog);
  const { data: products, isLoading, isError } = useGetProductsQuery();
  const { data: stock = [] } = useGetStockQuery();
  const [view, setView] = useState<"table" | "cards">("table");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    if (!products) return [];
    const search = filters.search.trim().toLowerCase();
    return products.filter((product) => {
      if (search) {
        const haystack = [product.productName, product.productId, product.colorVariant, product.brand]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (filters.types.length && !filters.types.includes(product.type)) return false;
      if (filters.brands.length && !filters.brands.includes(product.brand)) return false;
      if (filters.colorVariants.length && !filters.colorVariants.includes(product.colorVariant)) return false;
      if (filters.minPrice !== null && product.pricePerBox < filters.minPrice) return false;
      if (filters.maxPrice !== null && product.pricePerBox > filters.maxPrice) return false;
      return true;
    });
  }, [filters, products]);

  const stockMap = useMemo(() => {
    const map = new Map<string, (typeof stock)[number]>();
    stock.forEach((s) => map.set(s.productId || s.sku || "", s));
    return map;
  }, [stock]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          Failed to load catalog. Please check your network or API.
        </CardContent>
      </Card>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No products match your filters. Try adjusting the search or filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-muted-foreground md:hidden">View</span>
        <div className="inline-flex rounded-md border bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setView("table")}
            className={`rounded-sm px-3 py-1 ${view === "table" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`rounded-sm px-3 py-1 ${view === "cards" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            Cards
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Color Variant</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Pieces/Box</TableHead>
                <TableHead>Price / Box</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => {
                const stockEntry = stockMap.get(product.productId);
                return (
                  <TableRow key={product.productId}>
                    <TableCell className="font-mono text-xs font-semibold">{product.productId}</TableCell>
                    <TableCell>
                      <div className="font-medium leading-tight">{product.productName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {product.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{product.brand || "—"}</TableCell>
                    <TableCell className="text-sm">{product.colorVariant || "—"}</TableCell>
                    <TableCell>
                      {formatNumber(product.length)} × {formatNumber(product.width)}{" "}
                      {LENGTH_UNIT_LABELS[product.sizeUnit]}
                    </TableCell>
                    <TableCell>{formatNumber(product.piecesPerBox)}</TableCell>
                    <TableCell>{formatCurrency(product.pricePerBox)}</TableCell>
                    <TableCell>
                      {stockEntry ? (
                        <Badge
                          variant={
                            stockEntry.stockStatus === "In Stock"
                              ? "success"
                              : stockEntry.stockStatus === "Low Stock"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {stockEntry.stockStatus}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No data</span>
                      )}
                      {stockEntry ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatStockBoxesAndPieces(stockEntry.stockBoxes, product.piecesPerBox)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <StockUpdateButton
                          productId={product.productId}
                          sku={product.productId}
                          productName={product.productName}
                          currentStock={stockEntry?.stockBoxes ?? 0}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Edit product"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete product"
                          onClick={() => setDeletingProduct(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="hidden grid-cols-1 gap-3 sm:grid-cols-2 md:grid">
          {filtered.map((product) => (
            <ProductCard
              key={product.productId}
              product={product}
              stock={stockMap.get(product.productId)}
              onEdit={() => setEditingProduct(product)}
              onDelete={() => setDeletingProduct(product)}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.map((product) => (
          <ProductCard
            key={product.productId}
            product={product}
            stock={stockMap.get(product.productId)}
            onEdit={() => setEditingProduct(product)}
            onDelete={() => setDeletingProduct(product)}
          />
        ))}
      </div>

      <ProductFormDialog
        open={Boolean(editingProduct)}
        onOpenChange={(open) => {
          if (!open) setEditingProduct(null);
        }}
        product={editingProduct}
        mode="edit"
      />

      <ProductDeleteDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => {
          if (!open) setDeletingProduct(null);
        }}
        product={deletingProduct}
      />
    </div>
  );
}
