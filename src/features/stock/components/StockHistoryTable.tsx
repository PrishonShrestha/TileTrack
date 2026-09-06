"use client";

import { useGetStockHistoryQuery } from "@/features/stock/store/stockApi";
import { useGetProductsQuery } from "@/features/catalog/store/catalogApi";
import { useGetItemsQuery } from "@/features/items/store/itemsApi";
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
import { formatDate, formatNumber, formatStockBoxesAndPieces } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STOCK_ACTIONS, type StockAction } from "@/lib/constants";

export function StockHistoryTable({
  productId: propProductId,
  sku: propSku,
}: {
  productId?: string;
  sku?: string;
}) {
  const targetId = propProductId || propSku;
  const { data: history = [], isLoading: historyLoading } = useGetStockHistoryQuery(targetId ? { productId: targetId, sku: targetId } : undefined);
  const { data: products = [], isLoading: productsLoading } = useGetProductsQuery();
  const { data: items = [], isLoading: itemsLoading } = useGetItemsQuery();

  const isLoading = historyLoading || productsLoading || itemsLoading;

  const productMap = useMemo(() => new Map(products.map((p) => [p.productId.toLowerCase(), p])), [products]);
  const itemMap = useMemo(() => new Map(items.map((i) => [i.itemId.toLowerCase(), i])), [items]);

  const [actionFilter, setActionFilter] = useState<StockAction | "all">("all");
  const [searchFilter, setSearchFilter] = useState("");

  const filtered = useMemo(() => {
    return [...history]
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (isNaN(timeA) || isNaN(timeB)) return 0;
        return timeB - timeA;
      })
      .filter((entry) => {
        if (actionFilter !== "all" && entry.action !== actionFilter) return false;
        const id = (entry.productId || entry.sku || "").toLowerCase();
        const prod = productMap.get(id);
        const nonTile = itemMap.get(id);
        const name = (prod?.productName || nonTile?.name || "").toLowerCase();

        if (searchFilter) {
          const q = searchFilter.toLowerCase();
          if (!id.includes(q) && !name.includes(q)) return false;
        }
        return true;
      });
  }, [history, actionFilter, searchFilter, productMap, itemMap]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <Input
            placeholder="Search by ID or Name..."
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value)}
            className="sm:max-w-[14rem]"
          />
          <Select value={actionFilter} onValueChange={(v: StockAction | "all") => setActionFilter(v)}>
            <SelectTrigger className="sm:max-w-[10rem]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {STOCK_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item / Product ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Previous</TableHead>
              <TableHead>New</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No stock history yet. Updates will appear here.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => {
                const id = entry.productId || entry.sku || "";
                const key = id.toLowerCase();
                const product = productMap.get(key);
                const nonTileItem = itemMap.get(key);

                const name = product?.productName || nonTileItem?.name || "—";
                const unitLabel = nonTileItem?.unit || "unit";

                return (
                  <TableRow key={`${id}-${entry.date}`}>
                    <TableCell className="whitespace-nowrap text-xs">{formatDate(entry.date)}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{id}</TableCell>
                    <TableCell className="font-medium text-xs max-w-[160px] truncate">{name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.action === "Restock" || entry.action === "Return"
                            ? "success"
                            : entry.action === "Sale"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product ? (
                        entry.quantityPieces && entry.quantityPieces > 0 ? (
                          <span>
                            {entry.quantityBoxes ?? 0}b, {entry.quantityPieces} pcs{" "}
                            <span className="text-xs text-muted-foreground">
                              ({formatNumber(entry.quantity, { maximumFractionDigits: 2 })} b)
                            </span>
                          </span>
                        ) : (
                          <span>{formatNumber(entry.quantity, { maximumFractionDigits: 2 })} boxes</span>
                        )
                      ) : (
                        <span>{formatNumber(entry.quantity, { maximumFractionDigits: 2 })} {unitLabel}{entry.quantity === 1 ? "" : "s"}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {product
                        ? formatStockBoxesAndPieces(entry.previousStock, product.piecesPerBox)
                        : `${formatNumber(entry.previousStock)} ${unitLabel}${entry.previousStock === 1 ? "" : "s"}`}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {product
                        ? formatStockBoxesAndPieces(entry.newStock, product.piecesPerBox)
                        : `${formatNumber(entry.newStock)} ${unitLabel}${entry.newStock === 1 ? "" : "s"}`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {entry.notes || entry.reason || "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
