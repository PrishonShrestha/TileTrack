"use client";

import { useGetStockHistoryQuery } from "@/features/stock/store/stockApi";
import { useGetProductsQuery } from "@/features/catalog/store/catalogApi";
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
  const { data: history = [], isLoading } = useGetStockHistoryQuery(targetId ? { productId: targetId, sku: targetId } : undefined);
  const { data: products = [] } = useGetProductsQuery();
  const productMap = useMemo(() => new Map(products.map((p) => [p.productId, p])), [products]);

  const [actionFilter, setActionFilter] = useState<StockAction | "all">("all");
  const [idFilter, setIdFilter] = useState("");

  const filtered = useMemo(() => {
    return history.filter((entry) => {
      if (actionFilter !== "all" && entry.action !== actionFilter) return false;
      const id = entry.productId || entry.sku || "";
      if (idFilter && !id.toLowerCase().includes(idFilter.toLowerCase())) return false;
      return true;
    });
  }, [history, actionFilter, idFilter]);

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
            placeholder="Filter by Product ID"
            value={idFilter}
            onChange={(event) => setIdFilter(event.target.value)}
            className="sm:max-w-[12rem]"
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product ID</TableHead>
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
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  No stock history yet. Updates will appear here.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => {
                const id = entry.productId || entry.sku || "";
                const product = productMap.get(id);
                const piecesPerBox = product?.piecesPerBox ?? 1;

                return (
                  <TableRow key={`${id}-${entry.date}`}>
                    <TableCell className="whitespace-nowrap text-xs">{formatDate(entry.date)}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{id}</TableCell>
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
                      {entry.quantityPieces && entry.quantityPieces > 0 ? (
                        <span>
                          {entry.quantityBoxes ?? 0}b, {entry.quantityPieces} pcs{" "}
                          <span className="text-xs text-muted-foreground">
                            ({formatNumber(entry.quantity, { maximumFractionDigits: 2 })} b)
                          </span>
                        </span>
                      ) : (
                        <span>{formatNumber(entry.quantity, { maximumFractionDigits: 2 })} boxes</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatStockBoxesAndPieces(entry.previousStock, piecesPerBox)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {formatStockBoxesAndPieces(entry.newStock, piecesPerBox)}
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
