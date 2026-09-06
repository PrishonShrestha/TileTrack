"use client";

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
import { Pencil, Trash2, Package, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { StockUpdateButton } from "@/features/stock/components/StockUpdateButton";
import { StockStatusIndicator } from "@/features/stock/components/StockStatusIndicator";
import { useGetItemsQuery, useDeleteItemMutation } from "@/features/items/store/itemsApi";
import { useGetStockQuery } from "@/features/stock/store/stockApi";
import { ItemFormDialog } from "./ItemFormDialog";
import type { Item } from "@/types/domain";

interface ItemsTableProps {
  search?: string;
  categoryFilter?: string;
  brandFilter?: string;
}

function ItemCard({
  item,
  currentStock,
  onEdit,
  onDelete,
}: {
  item: Item;
  currentStock: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const liveStatus =
    currentStock <= 0
      ? "Out of Stock"
      : currentStock <= (item.minStock ?? 0)
        ? "Low Stock"
        : "In Stock";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs text-muted-foreground">{item.itemId}</span>
              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
            </div>
            <h3 className="mt-0.5 font-medium leading-tight">{item.name}</h3>
            <p className="text-sm text-muted-foreground">{item.brand}</p>
          </div>
          <StockStatusIndicator status={liveStatus} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold">{CURRENCY_SYMBOL} {formatNumber(item.pricePerUnit)}</span>
            <span className="text-muted-foreground">/{item.unit}</span>
            <span className="ml-3 text-muted-foreground">
              Stock: {formatNumber(currentStock)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <StockUpdateButton
              productId={item.itemId}
              sku={item.itemId}
              productName={item.name}
              currentStock={currentStock}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ItemsTable({ search = "", categoryFilter = "", brandFilter = "" }: ItemsTableProps) {
  const { data: items, isLoading, isError } = useGetItemsQuery();
  const { data: stock = [] } = useGetStockQuery();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteItemMutation();

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    stock.forEach((s) => map.set(s.productId || s.sku || "", s.stockBoxes));
    return map;
  }, [stock]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const hay = [item.itemId, item.name, item.category, item.brand].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (brandFilter && item.brand !== brandFilter) return false;
      return true;
    });
  }, [items, search, categoryFilter, brandFilter]);

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteItem({ itemId: deletingItem.itemId }).unwrap();
      toast.success(`"${deletingItem.name}" deleted.`);
    } catch {
      toast.error("Failed to delete item.");
    } finally {
      setDeletingItem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-destructive">
          Failed to load items. Check your Google Sheet connection.
        </CardContent>
      </Card>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {items?.length === 0
              ? "No items yet. Add your first item with the button above."
              : "No items match your filters."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Price / Unit</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => {
              const currentStock = stockMap.get(item.itemId) ?? item.stockQty;
              const liveStatus =
                currentStock <= 0
                  ? "Out of Stock"
                  : currentStock <= (item.minStock ?? 0)
                    ? "Low Stock"
                    : "In Stock";
              return (
                <TableRow key={item.itemId}>
                  <TableCell className="font-mono text-xs font-semibold">{item.itemId}</TableCell>
                  <TableCell>
                    <div className="font-medium leading-tight">{item.name}</div>
                    {item.notes && (
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{item.notes}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{item.brand || "—"}</TableCell>
                  <TableCell className="text-sm">{item.unit}</TableCell>
                  <TableCell>{CURRENCY_SYMBOL} {formatNumber(item.pricePerUnit)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StockStatusIndicator status={liveStatus} />
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(currentStock)} {item.unit}(s)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <StockUpdateButton
                        productId={item.itemId}
                        sku={item.itemId}
                        productName={item.name}
                        currentStock={currentStock}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingItem(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingItem(item)}
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

      {/* Mobile cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.map((item) => (
          <ItemCard
            key={item.itemId}
            item={item}
            currentStock={stockMap.get(item.itemId) ?? item.stockQty}
            onEdit={() => setEditingItem(item)}
            onDelete={() => setDeletingItem(item)}
          />
        ))}
      </div>

      {/* Edit dialog */}
      <ItemFormDialog
        open={Boolean(editingItem)}
        onOpenChange={(open) => { if (!open) setEditingItem(null); }}
        item={editingItem}
        mode="edit"
      />

      {/* Delete confirmation */}
      <Dialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => { if (!open) setDeletingItem(null); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Delete Item</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-foreground">
              Are you sure you want to delete{" "}
              <strong>{deletingItem?.name}</strong> (
              <span className="font-mono text-xs font-semibold">{deletingItem?.itemId}</span>)?
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            This will permanently remove this item from your Items catalog and Stock table in Google Sheets. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingItem(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
