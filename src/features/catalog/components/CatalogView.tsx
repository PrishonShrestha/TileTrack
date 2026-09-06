"use client";

import Link from "next/link";
import { ArrowLeft, Filter, Plus, Layers, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CatalogSearch } from "@/features/catalog/components/CatalogSearch";
import { CatalogFilters } from "@/features/catalog/components/CatalogFilters";
import { CatalogTable } from "@/features/catalog/components/CatalogTable";
import { ProductFormDialog } from "@/features/catalog/components/ProductFormDialog";
import { ItemsView } from "@/features/items/components/ItemsView";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useGetProductsQuery,
  useGetBrandsQuery,
  useGetTypesQuery,
  useGetColorVariantsQuery,
} from "@/features/catalog/store/catalogApi";
import { useGetStockQuery } from "@/features/stock/store/stockApi";
import { useGetItemsQuery } from "@/features/items/store/itemsApi";
import { toast } from "sonner";

export function CatalogView() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("tiles");

  const { refetch: refetchProducts, isFetching: productsFetching } = useGetProductsQuery();
  const { refetch: refetchStock, isFetching: stockFetching } = useGetStockQuery();
  const { refetch: refetchBrands, isFetching: brandsFetching } = useGetBrandsQuery();
  const { refetch: refetchTypes, isFetching: typesFetching } = useGetTypesQuery();
  const { refetch: refetchColorVariants, isFetching: colorFetching } = useGetColorVariantsQuery();
  const { refetch: refetchItems, isFetching: itemsFetching } = useGetItemsQuery();

  const isRefreshing =
    productsFetching ||
    stockFetching ||
    brandsFetching ||
    typesFetching ||
    colorFetching ||
    itemsFetching;

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchProducts(),
        refetchStock(),
        refetchBrands(),
        refetchTypes(),
        refetchColorVariants(),
        refetchItems(),
      ]);
      toast.success("Catalog data refreshed");
    } catch {
      toast.error("Failed to refresh catalog");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Product Catalog</h1>
            <p className="text-sm text-muted-foreground">
              Live inventory synced from Google Sheets — browse tiles, sanitary ware, adhesives, and supplies.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-9 w-9 self-start sm:self-auto shrink-0"
          title="Refresh catalog data"
          aria-label="Refresh catalog data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tiles" className="gap-2">
            <Layers className="h-4 w-4" />
            Tiles & Marble
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-2">
            <Package className="h-4 w-4" />
            Other Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tiles" className="space-y-6 m-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Tiles & Marble</h2>
              <p className="text-sm text-muted-foreground">
                Floor tiles, wall tiles, kitchen/bathroom slabs, and marble.
              </p>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[18rem_1fr]">
            <aside className="hidden lg:block">
              <Card>
                <CardContent className="p-5">
                  <CatalogFilters />
                </CardContent>
              </Card>
            </aside>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CatalogSearch />
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setFilterOpen(true)}
                >
                  <Filter className="h-4 w-4" /> Filters
                </Button>
              </div>
              <CatalogTable />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-6 m-0">
          <ItemsView />
        </TabsContent>
      </Tabs>

      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <CatalogFilters />
        </DialogContent>
      </Dialog>

      <ProductFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
      />
    </div>
  );
}

