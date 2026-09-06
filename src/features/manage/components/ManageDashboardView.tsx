"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  RotateCcw,
  Package,
  AlertTriangle,
  ArrowRight,
  Plus,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGetStockHistoryQuery, useGetStockQuery } from "@/features/stock/store/stockApi";
import { useGetProductsQuery } from "@/features/catalog/store/catalogApi";
import { useGetItemsQuery } from "@/features/items/store/itemsApi";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { formatStockBoxesAndPieces } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

type RangeDays = 7 | 30;

export function ManageDashboardView() {
  const [rangeDays, setRangeDays] = useState<RangeDays>(7);

  const { data: history = [], isLoading: historyLoading, refetch: refetchHistory, isFetching: historyFetching } = useGetStockHistoryQuery();
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts, isFetching: productsFetching } = useGetProductsQuery();
  const { data: stock = [], isLoading: stockLoading, refetch: refetchStock, isFetching: stockFetching } = useGetStockQuery();
  const { data: items = [], isLoading: itemsLoading, refetch: refetchItems, isFetching: itemsFetching } = useGetItemsQuery();

  const isLoading = historyLoading || productsLoading || stockLoading || itemsLoading;
  const isRefreshing = historyFetching || productsFetching || stockFetching || itemsFetching;

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchHistory(),
        refetchProducts(),
        refetchStock(),
        refetchItems(),
      ]);
      toast.success("Dashboard refreshed");
    } catch {
      toast.error("Failed to refresh dashboard");
    }
  };

  // Map products by ID for price and details lookup
  const productsMap = useMemo(() => {
    const map = new Map<string, (typeof products)[0]>();
    products.forEach((p) => {
      if (p.productId) map.set(p.productId.toLowerCase(), p);
      if (p.sku) map.set(p.sku.toLowerCase(), p);
    });
    return map;
  }, [products]);

  // Map items by ID
  const itemsMap = useMemo(() => {
    const map = new Map<string, (typeof items)[0]>();
    items.forEach((i) => {
      if (i.itemId) map.set(i.itemId.toLowerCase(), i);
    });
    return map;
  }, [items]);

  // Aggregated KPIs
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    let salesTodayQty = 0;
    let salesTodayValue = 0;
    let returnsTotalQty = 0;
    let returnsTotalCount = 0;
    let salesTotalCount = 0;

    history.forEach((row) => {
      const rowDateStr = row.date.split("T")[0];
      const idKey = (row.productId || row.sku || "").toLowerCase();
      const prod = productsMap.get(idKey);
      const nonTile = itemsMap.get(idKey);
      const price = prod?.pricePerBox ?? nonTile?.pricePerUnit ?? 0;

      if (row.action === "Sale") {
        salesTotalCount += 1;
        if (rowDateStr === todayStr) {
          salesTodayQty += row.quantity;
          salesTodayValue += row.quantity * price;
        }
      } else if (row.action === "Return") {
        returnsTotalCount += 1;
        returnsTotalQty += row.quantity;
      }
    });

    const totalStockBoxes = stock.reduce((acc, s) => acc + s.stockBoxes, 0);
    const lowStockCount = stock.filter((s) => s.stockStatus !== "In Stock").length;

    return {
      salesTodayQty: Number(salesTodayQty.toFixed(2)),
      salesTodayValue: Math.round(salesTodayValue),
      returnsTotalQty: Number(returnsTotalQty.toFixed(2)),
      returnsTotalCount,
      salesTotalCount,
      totalStockBoxes: Number(totalStockBoxes.toFixed(2)),
      lowStockCount,
    };
  }, [history, productsMap, itemsMap, stock]);

  // Daily Chart Data for selected range (7d / 30d)
  const chartData = useMemo(() => {
    const days = rangeDays;
    const now = new Date();
    const result: Array<{
      date: string;
      label: string;
      sales: number;
      restocks: number;
      returns: number;
    }> = [];

    const map = new Map<string, { sales: number; restocks: number; returns: number }>();

    // Generate day buckets
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const monthDay = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      map.set(key, { sales: 0, restocks: 0, returns: 0 });
      result.push({
        date: key,
        label: monthDay,
        sales: 0,
        restocks: 0,
        returns: 0,
      });
    }

    // Populate data
    history.forEach((row) => {
      const key = row.date.split("T")[0];
      const bucket = map.get(key);
      if (bucket) {
        if (row.action === "Sale") {
          bucket.sales += row.quantity;
        } else if (row.action === "Restock") {
          bucket.restocks += row.quantity;
        } else if (row.action === "Return") {
          bucket.returns += row.quantity;
        }
      }
    });

    return result.map((item) => {
      const val = map.get(item.date);
      return {
        ...item,
        sales: Number((val?.sales ?? 0).toFixed(2)),
        restocks: Number((val?.restocks ?? 0).toFixed(2)),
        returns: Number((val?.returns ?? 0).toFixed(2)),
      };
    });
  }, [history, rangeDays]);

  const hasChartData = useMemo(() => {
    return chartData.some((d) => d.sales > 0 || d.restocks > 0 || d.returns > 0);
  }, [chartData]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Quick Links */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time overview of sales, customer returns, inventory movements, and catalog trends.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/manage/sales">
              <ShoppingCart className="h-4 w-4" /> Sales Report
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/manage/catalog">
              <Plus className="h-4 w-4" /> Manage Catalog
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Sales Today */}
        <Card className="border-border/70 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sales Today
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.salesTodayQty} <span className="text-sm font-normal text-muted-foreground">boxes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  Est. value: <span className="font-semibold text-foreground">{CURRENCY_SYMBOL} {stats.salesTodayValue.toLocaleString()}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Returns */}
        <Card className="border-border/70 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Returns
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <RotateCcw className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.returnsTotalQty} <span className="text-sm font-normal text-muted-foreground">boxes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {stats.returnsTotalCount} return {stats.returnsTotalCount === 1 ? "entry" : "entries"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Available Inventory */}
        <Card className="border-border/70 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total In Stock
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.totalStockBoxes} <span className="text-sm font-normal text-muted-foreground">boxes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {products.length} registered products
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card className="border-border/70 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Stock Alerts
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-1">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {stats.lowStockCount}
                  </span>
                  <Badge
                    variant={stats.lowStockCount > 0 ? "destructive" : "success"}
                    className="text-[11px]"
                  >
                    {stats.lowStockCount > 0 ? "Action Required" : "All Good"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.lowStockCount === 0
                    ? "All items have sufficient stock"
                    : `${stats.lowStockCount} items low or out of stock`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Activity Trends: Sales vs. Restocks
            </CardTitle>
            <CardDescription className="text-xs">
              Daily quantity movements (boxes) logged in Stock History over time.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Timeframe:</span>
            <ToggleGroup
              type="single"
              value={String(rangeDays)}
              onValueChange={(val) => {
                if (val) setRangeDays(Number(val) as RangeDays);
              }}
              className="border rounded-lg p-0.5"
            >
              <ToggleGroupItem value="7" className="text-xs h-7 px-2.5">
                7 Days
              </ToggleGroupItem>
              <ToggleGroupItem value="30" className="text-xs h-7 px-2.5">
                30 Days
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="h-[320px] flex items-center justify-center">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          ) : !hasChartData ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 rounded-lg border border-dashed bg-muted/20">
              <Package className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold text-foreground">No transaction history in this period</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                As sales, restocks, and returns are logged, daily volume trends will appear in this chart.
              </p>
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="restockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="returnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis
                    dataKey="label"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: 16, fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales (Boxes)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="restocks"
                    name="Restocks (Boxes)"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#restockGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="returns"
                    name="Returns (Boxes)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#returnGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Sales Management</span>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardTitle>
            <CardDescription className="text-xs">
              View all customer sales transactions, filter by date, and track total revenue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full justify-between">
              <Link href="/manage/sales">
                Open Sales Report <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Catalog Management</span>
              <Package className="h-4 w-4 text-primary" />
            </CardTitle>
            <CardDescription className="text-xs">
              Add new tile & marble products, edit specs, update prices, or remove items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full justify-between">
              <Link href="/manage/catalog">
                Open Product Catalog <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              <span>Stock & Restocks</span>
              <RotateCcw className="h-4 w-4 text-primary" />
            </CardTitle>
            <CardDescription className="text-xs">
              Record incoming shipments, customer sales, adjustments, and returns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full justify-between">
              <Link href="/manage/stock">
                Update Stock <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
