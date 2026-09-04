"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetProductsQuery } from "@/features/catalog/store/catalogApi";
import { useGetStockQuery } from "@/features/stock/store/stockApi";
import { StockHistoryTable } from "./StockHistoryTable";
import { Skeleton } from "@/components/ui/skeleton";
import { StockUpdateButton } from "./StockUpdateButton";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatStockBoxesAndPieces } from "@/lib/utils";
import { AlertTriangle, Package, ShieldCheck } from "lucide-react";

export function StockManagementView() {
  const { data: stock = [], isLoading } = useGetStockQuery();
  const { data: products = [] } = useGetProductsQuery();

  const productById = new Map(products.map((p) => [p.productId, p]));

  const sorted = [...stock].sort((a, b) => {
    const order = { "Out of Stock": 0, "Low Stock": 1, "In Stock": 2 } as const;
    return order[a.stockStatus] - order[b.stockStatus];
  });

  return (
    <Tabs defaultValue="current" className="space-y-6">
      <TabsList>
        <TabsTrigger value="current">Current stock</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="current">
        <Card>
          <CardHeader>
            <CardTitle>Current inventory</CardTitle>
            <CardDescription>Click &ldquo;Update&rdquo; on any row to record a stock change.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Product ID</th>
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-right">Available Stock</th>
                      <th className="px-3 py-2 text-right">Minimum</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((item) => {
                      const id = item.productId || item.sku || "";
                      const product = productById.get(id);
                      return (
                        <tr key={id} className="border-t">
                          <td className="px-3 py-2 font-mono text-xs font-semibold">{id}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{product?.productName ?? "—"}</div>
                            <div className="text-xs text-muted-foreground">{product?.brand} · {product?.colorVariant}</div>
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatStockBoxesAndPieces(item.stockBoxes, product?.piecesPerBox)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{formatNumber(item.minimumBoxes)} b</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={
                                item.stockStatus === "In Stock"
                                  ? "success"
                                  : item.stockStatus === "Low Stock"
                                    ? "warning"
                                    : "destructive"
                              }
                            >
                              <span className="flex items-center gap-1">
                                {item.stockStatus === "In Stock" ? (
                                  <ShieldCheck className="h-3 w-3" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3" />
                                )}
                                {item.stockStatus}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <StockUpdateButton
                              productId={id}
                              sku={id}
                              productName={product?.productName}
                              currentStock={item.stockBoxes}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {sorted.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          <Package className="mx-auto mb-2 h-6 w-6" />
                          No stock entries yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle>Stock history</CardTitle>
            <CardDescription>Every update is logged for traceability.</CardDescription>
          </CardHeader>
          <CardContent>
            <StockHistoryTable />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
