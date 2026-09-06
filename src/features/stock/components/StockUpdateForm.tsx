"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STOCK_ACTIONS, type StockAction } from "@/lib/constants";
import { stockUpdateSchema, type StockUpdateFormValues } from "@/features/calculator/lib/schemas";
import { useUpdateStockMutation } from "../store/stockApi";
import { useGetProductsQuery } from "@/features/catalog/store/catalogApi";
import { useGetItemsQuery } from "@/features/items/store/itemsApi";
import type { Product, Item } from "@/types/domain";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { formatStockBoxesAndPieces } from "@/lib/utils";

export function StockUpdateForm({
  productId: propProductId,
  sku: propSku,
  productName,
  currentStock,
  open,
  onOpenChange,
}: {
  productId?: string;
  sku?: string;
  productName?: string;
  currentStock: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const targetId = propProductId || propSku || "";
  const { data: products = [] } = useGetProductsQuery();
  const { data: items = [] } = useGetItemsQuery();

  const product = products.find(
    (p) =>
      p.productId.toLowerCase() === targetId.toLowerCase() ||
      p.sku?.toLowerCase() === targetId.toLowerCase()
  );
  const nonTileItem = items.find(
    (i) => i.itemId.toLowerCase() === targetId.toLowerCase()
  );

  const piecesPerBox = product ? Math.max(1, product.piecesPerBox ?? 1) : 1;
  const allowLoosePieces = piecesPerBox > 1;

  const [action, setAction] = useState<StockAction>("Restock");
  const [boxes, setBoxes] = useState<number>(0);
  const [pieces, setPieces] = useState<number>(0);

  const form = useForm<StockUpdateFormValues>({
    resolver: zodResolver(stockUpdateSchema),
    defaultValues: {
      productId: targetId,
      sku: targetId,
      action: "Restock",
      quantityBoxes: 0,
      quantityPieces: 0,
      notes: "",
    },
  });
  const [updateStock, { isLoading }] = useUpdateStockMutation();

  useEffect(() => {
    if (open) {
      form.reset({
        productId: targetId,
        sku: targetId,
        action: "Restock",
        quantityBoxes: 0,
        quantityPieces: 0,
        notes: "",
      });
      setAction("Restock");
      setBoxes(0);
      setPieces(0);
    }
  }, [open, targetId, form]);

  const effectivePieces = allowLoosePieces ? pieces : 0;
  const totalBoxesCalculated = Number((boxes + effectivePieces / piecesPerBox).toFixed(4));
  const isPositive = action === "Restock" || action === "Return" || action === "Adjustment";
  const isSaleOverStock = action === "Sale" && totalBoxesCalculated > currentStock;
  const projectedStock = isPositive
    ? Number((currentStock + totalBoxesCalculated).toFixed(4))
    : Math.max(0, Number((currentStock - totalBoxesCalculated).toFixed(4)));

  const currentStockDisplay = nonTileItem
    ? `${currentStock} ${nonTileItem.unit || "units"}`
    : allowLoosePieces
    ? formatStockBoxesAndPieces(currentStock, piecesPerBox)
    : `${currentStock} ${currentStock === 1 ? "box" : "boxes"}`;

  const onSubmit = form.handleSubmit(async (values) => {
    if (isSaleOverStock) {
      toast.error(`Cannot sell more than available stock (${currentStockDisplay} available)`);
      return;
    }
    try {
      await updateStock({
        productId: targetId,
        sku: targetId,
        action,
        quantityBoxes: boxes,
        quantityPieces: effectivePieces,
        quantity: totalBoxesCalculated,
        notes: values.notes,
      }).unwrap();
      toast.success(`Stock updated for ${targetId}`);
      onOpenChange(false);
    } catch (error: unknown) {
      const apiErr = error as { data?: { error?: string }; message?: string };
      const message = apiErr?.data?.error || apiErr?.message || "Failed to update stock";
      toast.error(message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update stock</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {productName ? <span className="font-medium text-foreground">{productName} · </span> : ""}
            {nonTileItem ? "Item ID: " : "Product ID: "}<span className="font-mono">{targetId}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Current Stock: <span className="font-semibold text-foreground">{currentStockDisplay}</span>
            {product && allowLoosePieces ? ` (${piecesPerBox} pcs/box)` : ""}
          </p>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select
              value={action}
              onValueChange={(value: StockAction) => {
                setAction(value);
                form.setValue("action", value);
              }}
            >
              <SelectTrigger id="action">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                {STOCK_ACTIONS.map((act) => (
                  <SelectItem key={act} value={act}>
                    {act === "Return" ? "Return (Customer return)" : act}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {allowLoosePieces ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quantityBoxes">Boxes</Label>
                <Input
                  id="quantityBoxes"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={boxes === 0 ? "" : boxes}
                  placeholder="0"
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    setBoxes(val);
                    form.setValue("quantityBoxes", val);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityPieces">Loose Pieces / Tiles</Label>
                <Input
                  id="quantityPieces"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={piecesPerBox - 1}
                  step={1}
                  value={pieces === 0 ? "" : pieces}
                  placeholder="0"
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    setPieces(val);
                    form.setValue("quantityPieces", val);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="quantityBoxes">
                {nonTileItem ? `Quantity (${nonTileItem.unit || "Units"})` : "Quantity (Boxes)"}
              </Label>
              <Input
                id="quantityBoxes"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={boxes === 0 ? "" : boxes}
                placeholder="0"
                onChange={(e) => {
                  const val = Math.max(0, Number(e.target.value) || 0);
                  setBoxes(val);
                  setPieces(0);
                  form.setValue("quantityBoxes", val);
                  form.setValue("quantityPieces", 0);
                }}
              />
            </div>
          )}

          {isSaleOverStock ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Cannot sell <strong>{totalBoxesCalculated} {nonTileItem?.unit || "boxes"}</strong>. Only <strong>{currentStockDisplay}</strong> in stock.
              </span>
            </div>
          ) : null}

          {(boxes > 0 || effectivePieces > 0) && !isSaleOverStock ? (
            <div className="rounded-md bg-muted/40 p-3 text-xs space-y-1">
              <div className="flex justify-between font-medium">
                <span>Quantity:</span>
                <span className="text-primary font-semibold">
                  {allowLoosePieces ? (
                    <>
                      {boxes} {boxes === 1 ? "box" : "boxes"}
                      {effectivePieces > 0 ? ` + ${effectivePieces} pcs (${(effectivePieces / piecesPerBox).toFixed(2)} box)` : ""}
                      {" = "}
                      {totalBoxesCalculated} boxes
                    </>
                  ) : (
                    <>
                      {boxes} {nonTileItem ? (nonTileItem.unit || "units") : (boxes === 1 ? "box" : "boxes")}
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Projected new stock:</span>
                <span className="font-semibold text-foreground">
                  {nonTileItem
                    ? `${projectedStock} ${nonTileItem.unit || "units"}`
                    : allowLoosePieces
                    ? formatStockBoxesAndPieces(projectedStock, piecesPerBox)
                    : `${projectedStock} ${projectedStock === 1 ? "box" : "boxes"}`}
                </span>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              {...form.register("notes")}
              placeholder={action === "Return" ? "e.g. Leftover from Project A (2 boxes, 2 tiles)" : "e.g. Order #104 / Supplier batch"}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (boxes === 0 && pieces === 0) || isSaleOverStock}>
              {isLoading ? "Saving..." : "Save update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
