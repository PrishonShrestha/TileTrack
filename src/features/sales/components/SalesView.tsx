"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Search,
  ShoppingCart,
  RotateCcw,
  TrendingUp,
  DollarSign,
  FileText,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetStockHistoryQuery } from "@/features/stock/store/stockApi";
import { useGetProductsQuery } from "@/features/catalog/store/catalogApi";
import { useGetItemsQuery } from "@/features/items/store/itemsApi";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

type DatePreset = "today" | "7d" | "30d" | "this_month" | "all" | "custom";
type ActionTypeFilter = "sales_and_returns" | "sales_only" | "returns_only";

export function SalesView() {
  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory, isFetching: historyFetching } = useGetStockHistoryQuery();
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts, isFetching: productsFetching } = useGetProductsQuery();
  const { data: items = [], isLoading: itemsLoading, refetch: refetchItems, isFetching: itemsFetching } = useGetItemsQuery();

  const isLoading = historyLoading || productsLoading || itemsLoading;
  const isRefreshing = historyFetching || productsFetching || itemsFetching;

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchHistory(), refetchProducts(), refetchItems()]);
      toast.success("Sales report refreshed");
    } catch {
      toast.error("Failed to refresh sales report");
    }
  };

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [actionFilter, setActionFilter] = useState<ActionTypeFilter>("sales_and_returns");
  const [searchQuery, setSearchQuery] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Product Map
  const productMap = useMemo(() => {
    const map = new Map<string, (typeof products)[0]>();
    products.forEach((p) => {
      if (p.productId) map.set(p.productId.toLowerCase(), p);
      if (p.sku) map.set(p.sku.toLowerCase(), p);
    });
    return map;
  }, [products]);

  // Items Map
  const itemMap = useMemo(() => {
    const map = new Map<string, (typeof items)[0]>();
    items.forEach((i) => {
      if (i.itemId) map.set(i.itemId.toLowerCase(), i);
    });
    return map;
  }, [items]);

  // Date Range Bounds
  const { fromDate, toDate } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (datePreset === "today") {
      return { fromDate: todayStr, toDate: todayStr };
    }
    if (datePreset === "7d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { fromDate: d.toISOString().split("T")[0], toDate: todayStr };
    }
    if (datePreset === "30d") {
      const d = new Date(now);
      d.setDate(d.getDate() - 29);
      return { fromDate: d.toISOString().split("T")[0], toDate: todayStr };
    }
    if (datePreset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      return { fromDate: firstDay, toDate: todayStr };
    }
    if (datePreset === "custom") {
      return { fromDate: customFrom || "1970-01-01", toDate: customTo || "2099-12-31" };
    }
    // "all"
    return { fromDate: "1970-01-01", toDate: "2099-12-31" };
  }, [datePreset, customFrom, customTo]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return history.filter((entry) => {
      // 1. Action filter: Only Sales & Returns
      if (entry.action !== "Sale" && entry.action !== "Return") return false;
      if (actionFilter === "sales_only" && entry.action !== "Sale") return false;
      if (actionFilter === "returns_only" && entry.action !== "Return") return false;

      // 2. Date filter
      const entryDate = entry.date.split("T")[0];
      if (entryDate < fromDate || entryDate > toDate) return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const id = (entry.productId || entry.sku || "").toLowerCase();
        const product = productMap.get(id);
        const nonTile = itemMap.get(id);
        const name = (product?.productName || nonTile?.name || "").toLowerCase();
        const brand = (product?.brand || nonTile?.brand || "").toLowerCase();
        const notes = (entry.notes || entry.reason || "").toLowerCase();

        if (
          !id.includes(q) &&
          !name.includes(q) &&
          !brand.includes(q) &&
          !notes.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [history, actionFilter, fromDate, toDate, searchQuery, productMap, itemMap]);

  // Summary Metrics for the filtered period
  const summary = useMemo(() => {
    let grossSalesBoxes = 0;
    let grossSalesValue = 0;
    let returnsBoxes = 0;
    let returnsValue = 0;
    let salesCount = 0;
    let returnsCount = 0;

    filteredEntries.forEach((entry) => {
      const id = (entry.productId || entry.sku || "").toLowerCase();
      const product = productMap.get(id);
      const nonTile = itemMap.get(id);
      const price = product?.pricePerBox ?? nonTile?.pricePerUnit ?? 0;
      const value = entry.quantity * price;

      if (entry.action === "Sale") {
        salesCount += 1;
        grossSalesBoxes += entry.quantity;
        grossSalesValue += value;
      } else if (entry.action === "Return") {
        returnsCount += 1;
        returnsBoxes += entry.quantity;
        returnsValue += value;
      }
    });

    const netSalesBoxes = Math.max(0, grossSalesBoxes - returnsBoxes);
    const netSalesValue = Math.max(0, grossSalesValue - returnsValue);

    return {
      grossSalesBoxes: Number(grossSalesBoxes.toFixed(2)),
      grossSalesValue: Math.round(grossSalesValue),
      returnsBoxes: Number(returnsBoxes.toFixed(2)),
      returnsValue: Math.round(returnsValue),
      netSalesBoxes: Number(netSalesBoxes.toFixed(2)),
      netSalesValue: Math.round(netSalesValue),
      salesCount,
      returnsCount,
      totalEntries: filteredEntries.length,
    };
  }, [filteredEntries, productMap, itemMap]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales &amp; Returns Report</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track customer sales, loose tile returns, and calculated transaction values.
          </p>
        </div>
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Net Sales Revenue */}
        <Card className="border-border/70 shadow-sm bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Sales Value
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {CURRENCY_SYMBOL} {summary.netSalesValue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gross: {CURRENCY_SYMBOL} {summary.grossSalesValue.toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Net Quantity Sold */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Net Boxes Sold
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {summary.netSalesBoxes} <span className="text-sm font-normal text-muted-foreground">boxes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.salesCount} sale {summary.salesCount === 1 ? "order" : "orders"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Returns */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Customer Returns
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <RotateCcw className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {summary.returnsBoxes} <span className="text-sm font-normal text-muted-foreground">boxes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Value: {CURRENCY_SYMBOL} {summary.returnsValue.toLocaleString()} ({summary.returnsCount} returns)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Transactions
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {summary.totalEntries}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  In selected timeframe
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-border/70 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, name, or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Action Filter */}
            <Select
              value={actionFilter}
              onValueChange={(val: ActionTypeFilter) => setActionFilter(val)}
            >
              <SelectTrigger className="w-full sm:w-44 text-xs">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales_and_returns">All (Sales &amp; Returns)</SelectItem>
                <SelectItem value="sales_only">Sales Only</SelectItem>
                <SelectItem value="returns_only">Returns Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Preset */}
            <Select
              value={datePreset}
              onValueChange={(val: DatePreset) => setDatePreset(val)}
            >
              <SelectTrigger className="w-full sm:w-40 text-xs">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Inputs */}
          {datePreset === "custom" ? (
            <div className="flex items-center gap-2 pt-2 lg:pt-0">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="text-xs w-36"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="text-xs w-36"
              />
            </div>
          ) : null}
        </div>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead>Item / Product ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                </TableRow>
              ))
            ) : filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No sales or returns found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry, idx) => {
                const id = entry.productId || entry.sku || "";
                const key = id.toLowerCase();
                const product = productMap.get(key);
                const nonTile = itemMap.get(key);
                const name = product?.productName || nonTile?.name || "—";
                const subtext = product
                  ? [product.brand, product.type].filter(Boolean).join(" · ")
                  : nonTile
                    ? [nonTile.brand, nonTile.category].filter(Boolean).join(" · ")
                    : "";
                const unitLabel = nonTile?.unit || "unit";
                const price = product?.pricePerBox ?? nonTile?.pricePerUnit ?? 0;
                const totalValue = Math.round(entry.quantity * price);

                return (
                  <TableRow key={`${id}-${entry.date}-${idx}`}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(entry.date)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold">
                      {id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">{name}</div>
                      {subtext ? (
                        <span className="text-[11px] text-muted-foreground">{subtext}</span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={entry.action === "Sale" ? "warning" : "success"}
                        className="text-[11px]"
                      >
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {product ? (
                        entry.quantityPieces && entry.quantityPieces > 0 ? (
                          <span>
                            {entry.quantityBoxes ?? 0}b, {entry.quantityPieces} pcs{" "}
                            <span className="text-[10px] text-muted-foreground">
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
                      {price > 0 ? `${CURRENCY_SYMBOL} ${price.toLocaleString()}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {price > 0 ? (
                        <span className={entry.action === "Return" ? "text-amber-600 dark:text-amber-400" : ""}>
                          {entry.action === "Return" ? "-" : ""}{CURRENCY_SYMBOL} {totalValue.toLocaleString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                      {entry.notes || entry.reason || "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))
        ) : filteredEntries.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No sales or returns found for the selected filters.
          </Card>
        ) : (
          filteredEntries.map((entry, idx) => {
            const id = entry.productId || entry.sku || "";
            const key = id.toLowerCase();
            const product = productMap.get(key);
            const nonTile = itemMap.get(key);
            const name = product?.productName || nonTile?.name || "—";
            const unitLabel = nonTile?.unit || "unit";
            const price = product?.pricePerBox ?? nonTile?.pricePerUnit ?? 0;
            const totalValue = Math.round(entry.quantity * price);

            return (
              <Card key={`${id}-${entry.date}-${idx}`} className="p-4 border-border/70 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold">{id}</span>
                    <h3 className="text-sm font-semibold text-foreground">{name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDate(entry.date)}
                    </p>
                  </div>
                  <Badge
                    variant={entry.action === "Sale" ? "warning" : "success"}
                    className="text-xs"
                  >
                    {entry.action}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs border-t">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase">Quantity</span>
                    <p className="font-medium">
                      {product ? (
                        entry.quantityPieces && entry.quantityPieces > 0
                          ? `${entry.quantityBoxes ?? 0}b, ${entry.quantityPieces} pcs`
                          : `${formatNumber(entry.quantity, { maximumFractionDigits: 2 })} boxes`
                      ) : (
                        `${formatNumber(entry.quantity, { maximumFractionDigits: 2 })} ${unitLabel}${entry.quantity === 1 ? "" : "s"}`
                      )}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase">Total Value</span>
                    <p className="font-bold text-foreground">
                      {price > 0
                        ? `${entry.action === "Return" ? "-" : ""}${CURRENCY_SYMBOL} ${totalValue.toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                </div>

                {entry.notes || entry.reason ? (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
                    <span className="font-medium">Note:</span> {entry.notes || entry.reason}
                  </p>
                ) : null}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
