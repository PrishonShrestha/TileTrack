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
import { useGetItemsQuery } from "@/features/items/store/itemsApi";
import { useGetStockQuery, useGetStockHistoryQuery } from "@/features/stock/store/stockApi";
import { StockHistoryTable } from "./StockHistoryTable";
import { Skeleton } from "@/components/ui/skeleton";
import { StockUpdateButton } from "./StockUpdateButton";
import { StockStatusIndicator } from "./StockStatusIndicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatStockBoxesAndPieces } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Package, ShieldCheck, RefreshCw, X, ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { StockStatus } from "@/types/domain";

const ALPHABET = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), "#"];

function computeStatus(stock: number, minimum: number): StockStatus {
  if (stock <= 0) return "Out of Stock";
  if (stock <= minimum) return "Low Stock";
  return "In Stock";
}

export function StockManagementView() {
  const { data: stock = [], isLoading: stockLoading, refetch: refetchStock, isFetching: stockFetching } = useGetStockQuery();
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts, isFetching: productsFetching } = useGetProductsQuery();
  const { data: items = [], isLoading: itemsLoading, refetch: refetchItems, isFetching: itemsFetching } = useGetItemsQuery();
  const { refetch: refetchHistory, isFetching: historyFetching } = useGetStockHistoryQuery();

  const [activeTab, setActiveTab] = useState("current");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "all">("all");
  const [letterFilter, setLetterFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"status" | "name-asc" | "name-desc" | "stock-desc" | "stock-asc">("status");

  const isLoading = stockLoading || productsLoading || itemsLoading;
  const isRefreshing = stockFetching || productsFetching || itemsFetching || historyFetching;

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchStock(),
        refetchProducts(),
        refetchItems(),
        refetchHistory(),
      ]);
      toast.success("Inventory refreshed");
    } catch {
      toast.error("Failed to refresh inventory");
    }
  };

  const productById = useMemo(() => new Map(products.map((p) => [p.productId.toLowerCase(), p])), [products]);
  const itemById = useMemo(() => new Map(items.map((i) => [i.itemId.toLowerCase(), i])), [items]);

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "all" || letterFilter !== "All" || sortBy !== "status";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setLetterFilter("All");
    setSortBy("status");
  };

  const filteredAndSorted = useMemo(() => {
    // 1. Enrich
    const enriched = stock.map((s) => {
      const id = s.productId || s.sku || "";
      const key = id.toLowerCase();
      const product = productById.get(key);
      const nonTileItem = itemById.get(key);
      const name = product?.productName || nonTileItem?.name || "";
      const liveStatus = computeStatus(s.stockBoxes, s.minimumBoxes);
      return {
        ...s,
        id,
        name,
        product,
        nonTileItem,
        stockStatus: liveStatus,
      };
    });

    // 2. Filter
    const filtered = enriched.filter((item) => {
      if (statusFilter !== "all" && item.stockStatus !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = item.id.toLowerCase().includes(q);
        const nameMatch = item.name.toLowerCase().includes(q);
        const brandMatch = (item.product?.brand || item.nonTileItem?.brand || "").toLowerCase().includes(q);
        if (!idMatch && !nameMatch && !brandMatch) return false;
      }

      if (letterFilter !== "All") {
        const firstLetter = (item.name || item.id).trim().charAt(0).toUpperCase();
        if (letterFilter === "#") {
          if (/^[A-Z]/i.test(firstLetter)) return false;
        } else {
          if (firstLetter !== letterFilter) return false;
        }
      }

      return true;
    });

    // 3. Sort
    return filtered.sort((a, b) => {
      if (sortBy === "name-asc") {
        return (a.name || a.id).localeCompare(b.name || b.id);
      }
      if (sortBy === "name-desc") {
        return (b.name || b.id).localeCompare(a.name || a.id);
      }
      if (sortBy === "stock-asc") {
        return a.stockBoxes - b.stockBoxes;
      }
      if (sortBy === "stock-desc") {
        return b.stockBoxes - a.stockBoxes;
      }
      // Default: Status priority (Out of Stock -> Low Stock -> In Stock), then Name
      const order = { "Out of Stock": 0, "Low Stock": 1, "In Stock": 2 } as const;
      const diff = order[a.stockStatus] - order[b.stockStatus];
      if (diff !== 0) return diff;
      return (a.name || a.id).localeCompare(b.name || b.id);
    });
  }, [stock, productById, itemById, statusFilter, searchQuery, letterFilter, sortBy]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="current">Current Stock</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </Button>
      </div>

      <TabsContent value="current" className="m-0 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Current Inventory</CardTitle>
            <CardDescription>Live stock levels across tiles, marble, and store items. Click &ldquo;Update&rdquo; to adjust stock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* Search */}
                <Input
                  placeholder="Search by ID, name, brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9"
                />

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(val: StockStatus | "all") => setStatusFilter(val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="In Stock">
                      <div className="flex items-center gap-2">
                        <StockStatusIndicator status="In Stock" size="sm" />
                        <span>In Stock</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Low Stock">
                      <div className="flex items-center gap-2">
                        <StockStatusIndicator status="Low Stock" size="sm" />
                        <span>Low Stock</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Out of Stock">
                      <div className="flex items-center gap-2">
                        <StockStatusIndicator status="Out of Stock" size="sm" />
                        <span>Out of Stock</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select
                  value={sortBy}
                  onValueChange={(val: "status" | "name-asc" | "name-desc" | "stock-desc" | "stock-asc") => setSortBy(val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status Priority</SelectItem>
                    <SelectItem value="name-asc">Name (A → Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z → A)</SelectItem>
                    <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
                    <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Reset Filters */}
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-9 gap-1.5 text-muted-foreground hover:text-foreground justify-start sm:justify-center"
                  >
                    <X className="h-4 w-4" />
                    Reset Filters
                  </Button>
                ) : null}
              </div>

              {/* Alphabetical Quick Bar */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                <span className="text-xs font-semibold text-muted-foreground mr-1 shrink-0">A–Z:</span>
                {ALPHABET.map((letter) => {
                  const isSelected = letterFilter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setLetterFilter(letter)}
                      className={`h-7 min-w-[28px] px-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>
                  Showing {filteredAndSorted.length} of {stock.length} inventory items
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Item / Product ID</th>
                      <th className="px-3 py-2 text-left">Product Name</th>
                      <th className="px-3 py-2 text-right">Available Stock</th>
                      <th className="px-3 py-2 text-right">Min Alert</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSorted.map((item) => {
                      const id = item.id;
                      const product = item.product;
                      const nonTileItem = item.nonTileItem;

                      const name = product?.productName || nonTileItem?.name || "—";
                      const subtext = product
                        ? [product.brand, product.colorVariant].filter(Boolean).join(" · ")
                        : nonTileItem
                          ? [nonTileItem.brand, nonTileItem.category].filter(Boolean).join(" · ")
                          : "";

                      const unitLabel = nonTileItem?.unit || "unit";
                      const availableStockDisplay = product
                        ? formatStockBoxesAndPieces(item.stockBoxes, product.piecesPerBox)
                        : `${formatNumber(item.stockBoxes)} ${unitLabel}${item.stockBoxes === 1 ? "" : "s"}`;

                      const minStockDisplay = product
                        ? `${formatNumber(item.minimumBoxes)} b`
                        : `${formatNumber(item.minimumBoxes)} ${unitLabel.slice(0, 3)}`;

                      return (
                        <tr key={id} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 font-mono text-xs font-semibold">{id}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{name}</div>
                            {subtext && <div className="text-xs text-muted-foreground">{subtext}</div>}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {availableStockDisplay}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {minStockDisplay}
                          </td>
                          <td className="px-3 py-2">
                            <StockStatusIndicator status={item.stockStatus} />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <StockUpdateButton
                              productId={id}
                              sku={id}
                              productName={name !== "—" ? name : undefined}
                              currentStock={item.stockBoxes}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {filteredAndSorted.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          <Package className="mx-auto mb-2 h-6 w-6" />
                          {hasActiveFilters ? "No matching stock items found for current filters." : "No stock entries yet."}
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
      <TabsContent value="history" className="m-0">
        <Card>
          <CardHeader>
            <CardTitle>Stock History</CardTitle>
            <CardDescription>Every inventory update is logged for full audit traceability.</CardDescription>
          </CardHeader>
          <CardContent>
            <StockHistoryTable />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
