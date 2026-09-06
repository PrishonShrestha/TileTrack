"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { generateProductId } from "@/lib/utils";
import { ITEM_UNITS } from "@/types/domain";
import type { Item } from "@/types/domain";
import {
  useCreateItemMutation,
  useUpdateItemMutation,
  useGetItemCategoriesQuery,
} from "@/features/items/store/itemsApi";
import { useGetBrandsQuery } from "@/features/catalog/store/catalogApi";

const itemFormSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  unit: z.string().min(1, "Unit is required"),
  pricePerUnit: z.number({ error: "Price must be a number" }).min(0, "Price must be non-negative"),
  initialStockQty: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  notes: z.string().optional(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  mode?: "create" | "edit";
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  mode = item ? "edit" : "create",
}: ItemFormDialogProps) {
  const isEdit = mode === "edit" && Boolean(item);
  const [createItem, { isLoading: isCreating }] = useCreateItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateItemMutation();
  const isLoading = isCreating || isUpdating;

  const { data: itemCategories = [] } = useGetItemCategoriesQuery();
  const { data: sheetBrands = [] } = useGetBrandsQuery();

  const categoryOptions = useMemo(() => {
    const set = new Set(itemCategories.map((c) => c.name).filter(Boolean));
    if (item?.category) set.add(item.category);
    return Array.from(set).sort();
  }, [itemCategories, item]);

  const brandOptions = useMemo(() => {
    const set = new Set(sheetBrands.map((b) => b.name).filter(Boolean));
    if (item?.brand) set.add(item.brand);
    return Array.from(set).sort();
  }, [sheetBrands, item]);

  const [selectedCategory, setSelectedCategory] = useState<string>(item?.category || "");
  const [selectedBrand, setSelectedBrand] = useState<string>(item?.brand || "");
  const [selectedUnit, setSelectedUnit] = useState<string>(item?.unit || "Piece");

  const generatedId = useMemo(() => generateProductId("ITM"), []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      itemId: item?.itemId ?? generatedId,
      name: item?.name ?? "",
      category: item?.category ?? "",
      brand: item?.brand ?? "",
      unit: item?.unit ?? "Piece",
      pricePerUnit: item?.pricePerUnit ?? 0,
      initialStockQty: 0,
      minStock: item?.minStock ?? 2,
      notes: item?.notes ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      const newId = isEdit ? (item?.itemId ?? "") : generatedId;
      setSelectedCategory(item?.category ?? "");
      setSelectedBrand(item?.brand ?? "");
      setSelectedUnit(item?.unit ?? "Piece");
      reset({
        itemId: newId,
        name: item?.name ?? "",
        category: item?.category ?? "",
        brand: item?.brand ?? "",
        unit: item?.unit ?? "Piece",
        pricePerUnit: item?.pricePerUnit ?? 0,
        initialStockQty: 0,
        minStock: item?.minStock ?? 2,
        notes: item?.notes ?? "",
      });
    }
  }, [open, item, isEdit, reset, generatedId]);

  const onSubmit = async (data: ItemFormValues) => {
    try {
      if (isEdit && item) {
        await updateItem({
          itemId: item.itemId,
          name: data.name,
          category: data.category,
          brand: data.brand,
          unit: data.unit,
          pricePerUnit: data.pricePerUnit,
          minStock: data.minStock,
          notes: data.notes,
        }).unwrap();
        toast.success(`"${data.name}" updated successfully.`);
      } else {
        await createItem({
          itemId: data.itemId,
          name: data.name,
          category: data.category,
          brand: data.brand,
          unit: data.unit,
          pricePerUnit: data.pricePerUnit,
          initialStockQty: data.initialStockQty,
          minStock: data.minStock,
          notes: data.notes,
        }).unwrap();
        toast.success(`"${data.name}" added to catalog.`);
      }
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : (err as { data?: { error?: string } })?.data?.error ?? "Something went wrong";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update item details. Changes save to your Google Sheet."
              : "Add a non-tile product to your catalog. Synced with Google Sheet."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          {/* Item ID (readonly) */}
          <div className="space-y-1.5">
            <Label htmlFor="itemId" className="flex items-center gap-1.5">
              Item ID
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="itemId"
                {...register("itemId")}
                readOnly
                className="flex-1 font-mono text-sm bg-muted/40"
              />
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const newId = generateProductId("ITM");
                    setValue("itemId", newId);
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  New ID
                </Button>
              )}
            </div>
            {errors.itemId && (
              <p className="text-xs text-destructive">{errors.itemId.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Kohler Cimarron Commode"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={selectedCategory}
              onValueChange={(val) => {
                setSelectedCategory(val);
                setValue("category", val, { shouldValidate: true });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                {categoryOptions.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No categories found. Add rows to the Item_Categories sheet.
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <Label>Brand</Label>
            <Select
              value={selectedBrand}
              onValueChange={(val) => {
                setSelectedBrand(val);
                setValue("brand", val, { shouldValidate: true });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brandOptions.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
                {brandOptions.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No brands found. Add rows to the Brands sheet.
                  </div>
                )}
              </SelectContent>
            </Select>
            {errors.brand && (
              <p className="text-xs text-destructive">{errors.brand.message}</p>
            )}
          </div>

          {/* Unit + Price per unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select
                value={selectedUnit}
                onValueChange={(val) => {
                  setSelectedUnit(val);
                  setValue("unit", val, { shouldValidate: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-xs text-destructive">{errors.unit.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pricePerUnit">Price / {selectedUnit || "Unit"} ({CURRENCY_SYMBOL})</Label>
              <Input
                id="pricePerUnit"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register("pricePerUnit", { valueAsNumber: true })}
              />
              {errors.pricePerUnit && (
                <p className="text-xs text-destructive">{errors.pricePerUnit.message}</p>
              )}
            </div>
          </div>

          {/* Stock fields */}
          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="initialStockQty">Initial Stock</Label>
                <Input
                  id="initialStockQty"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  {...register("initialStockQty", { valueAsNumber: true })}
                />
                {errors.initialStockQty && (
                  <p className="text-xs text-destructive">{errors.initialStockQty.message}</p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="minStock">Min Stock Alert</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                step="1"
                placeholder="2"
                {...register("minStock", { valueAsNumber: true })}
              />
              {errors.minStock && (
                <p className="text-xs text-destructive">{errors.minStock.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Any additional info..."
              {...register("notes")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEdit
                  ? "Saving..."
                  : "Adding..."
                : isEdit
                  ? "Save Changes"
                  : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
