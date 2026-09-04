"use client";

import Link from "next/link";
import { ArrowLeft, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CatalogSearch } from "@/features/catalog/components/CatalogSearch";
import { CatalogFilters } from "@/features/catalog/components/CatalogFilters";
import { CatalogTable } from "@/features/catalog/components/CatalogTable";
import { ProductFormDialog } from "@/features/catalog/components/ProductFormDialog";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CatalogView() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

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
            <h1 className="text-2xl font-semibold tracking-tight">Product catalog</h1>
            <p className="text-sm text-muted-foreground">
              Live data from your Google Sheet — add, edit, search, and inspect stock.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 self-start sm:self-auto"
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
