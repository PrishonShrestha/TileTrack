"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles, Lock } from "lucide-react";
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
import { SIZE_UNITS, type LengthUnit, CURRENCY_SYMBOL } from "@/lib/constants";
import { LENGTH_UNIT_LABELS } from "@/lib/constants-labels";
import { generateProductId } from "@/lib/utils";
import type { Product } from "@/types/domain";
import {
  createProductSchema,
  type CreateProductFormValues,
} from "@/features/calculator/lib/schemas";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetBrandsQuery,
  useGetTypesQuery,
  useGetColorVariantsQuery,
} from "@/features/catalog/store/catalogApi";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  mode?: "create" | "edit";
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  mode = product ? "edit" : "create",
}: ProductFormDialogProps) {
  const isEdit = mode === "edit" && Boolean(product);
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const isLoading = isCreating || isUpdating;

  const { data: sheetTypes = [] } = useGetTypesQuery();
  const { data: sheetBrands = [] } = useGetBrandsQuery();
  const { data: sheetColorVariants = [] } = useGetColorVariantsQuery();

  // Extract dropdown options directly and exclusively from the respective Google Sheets
  const typeOptions = useMemo(() => {
    const set = new Set(sheetTypes.map((t) => t.name).filter(Boolean));
    if (product?.type) set.add(product.type);
    return Array.from(set).sort();
  }, [sheetTypes, product]);

  const brandOptions = useMemo(() => {
    const set = new Set(sheetBrands.map((b) => b.name).filter(Boolean));
    if (product?.brand) set.add(product.brand);
    return Array.from(set).sort();
  }, [sheetBrands, product]);

  const colorOptions = useMemo(() => {
    const set = new Set(sheetColorVariants.map((c) => c.name).filter(Boolean));
    if (product?.colorVariant) set.add(product.colorVariant);
    return Array.from(set).sort();
  }, [sheetColorVariants, product]);

  const [selectedUnit, setSelectedUnit] = useState<LengthUnit>(
    product?.sizeUnit ?? "ft",
  );
  const [selectedType, setSelectedType] = useState<string>(product?.type || "");
  const [selectedBrand, setSelectedBrand] = useState<string>(
    product?.brand || "",
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colorVariant || "",
  );

  const form = useForm<CreateProductFormValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      productId: product?.productId ?? generateProductId(),
      productName: product?.productName ?? "",
      type: product?.type || "",
      brand: product?.brand || "",
      length: product?.length ?? 1,
      width: product?.width ?? 1,
      sizeUnit: product?.sizeUnit ?? "ft",
      colorVariant: product?.colorVariant || "",
      piecesPerBox: product?.piecesPerBox ?? 1,
      pricePerBox: product?.pricePerBox ?? 0,
      notes: product?.notes ?? "",
      initialStockBoxes: 0,
      minimumBoxes: 10,
    },
  });

  useEffect(() => {
    if (open) {
      if (isEdit && product) {
        form.reset({
          productId: product.productId,
          productName: product.productName,
          type: product.type || "",
          brand: product.brand || "",
          length: product.length || 1,
          width: product.width || 1,
          sizeUnit: product.sizeUnit || "ft",
          piecesPerBox: product.piecesPerBox || 1,
          pricePerBox: product.pricePerBox || 0,
          colorVariant: product.colorVariant || "",
          notes: product.notes || "",
          initialStockBoxes: 0,
          minimumBoxes: 10,
        });
        setSelectedUnit(product.sizeUnit || "ft");
        setSelectedType(product.type || "");
        setSelectedBrand(product.brand || "");
        setSelectedColor(product.colorVariant || "");
      } else {
        const generated = generateProductId();
        const initialType = typeOptions[0] || "";
        const initialBrand = brandOptions[0] || "";
        const initialColor = colorOptions[0] || "";

        form.reset({
          productId: generated,
          productName: "",
          type: initialType,
          brand: initialBrand,
          length: 1,
          width: 1,
          sizeUnit: "ft",
          piecesPerBox: 1,
          pricePerBox: 0,
          colorVariant: initialColor,
          notes: "",
          initialStockBoxes: 0,
          minimumBoxes: 10,
        });
        setSelectedUnit("ft");
        setSelectedType(initialType);
        setSelectedBrand(initialBrand);
        setSelectedColor(initialColor);
      }
    }
  }, [open, isEdit, product, form, typeOptions, brandOptions, colorOptions]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await updateProduct({
          productId: values.productId,
          productName: values.productName,
          type: values.type,
          brand: values.brand,
          length: values.length,
          width: values.width,
          sizeUnit: values.sizeUnit,
          piecesPerBox: values.piecesPerBox,
          pricePerBox: values.pricePerBox,
          colorVariant: values.colorVariant || "",
          notes: values.notes || undefined,
        }).unwrap();
        toast.success(`Product "${values.productName}" updated successfully`);
      } else {
        await createProduct({
          productId: values.productId,
          productName: values.productName,
          type: values.type,
          brand: values.brand,
          length: values.length,
          width: values.width,
          sizeUnit: values.sizeUnit,
          piecesPerBox: values.piecesPerBox,
          pricePerBox: values.pricePerBox,
          colorVariant: values.colorVariant || "",
          notes: values.notes || undefined,
          initialStockBoxes: values.initialStockBoxes ?? 0,
          minimumBoxes: values.minimumBoxes ?? 10,
        }).unwrap();
        toast.success(`Product "${values.productName}" created successfully`);
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const apiErr = error as { data?: { error?: string }; message?: string };
      const message =
        apiErr?.data?.error || apiErr?.message || "Failed to save product";
      toast.error(message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Product" : "Add New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update product specifications and pricing in the catalog."
              : "Create a new product tile/marble entry and initialize its inventory."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-2" onSubmit={onSubmit}>
          {/* Product ID (Read-only) & Product Name */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="productId"
                  className="text-xs font-semibold flex items-center gap-1 text-muted-foreground"
                >
                  <Lock className="h-3 w-3" /> Product ID
                </Label>
              </div>
              <Input
                id="productId"
                {...form.register("productId")}
                readOnly
                disabled
                className="font-mono text-xs uppercase bg-muted/50 cursor-not-allowed select-all"
                placeholder="PRD-XXXXX"
              />
              <p className="text-[10px] text-muted-foreground">
                Auto-assigned unique ID
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="productName" className="text-xs font-semibold">
                Product Name *
              </Label>
              <Input
                id="productName"
                {...form.register("productName")}
                placeholder="e.g. Royal Calacatta Gold"
              />
              {form.formState.errors.productName ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.productName.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* Type & Brand (Dropdowns from Google Sheet) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-semibold">
                Type *
              </Label>
              <Select
                value={selectedType}
                onValueChange={(val) => {
                  setSelectedType(val);
                  form.setValue("type", val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue
                    placeholder={
                      typeOptions.length === 0
                        ? "No types in sheet"
                        : "Select type"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.type ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.type.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-xs font-semibold">
                Brand *
              </Label>
              <Select
                value={selectedBrand}
                onValueChange={(val) => {
                  setSelectedBrand(val);
                  form.setValue("brand", val, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
              >
                <SelectTrigger id="brand" className="w-full">
                  <SelectValue
                    placeholder={
                      brandOptions.length === 0
                        ? "No brands in sheet"
                        : "Select brand"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {brandOptions.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.brand ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.brand.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* Color Variant (Dropdown from Google Sheet) */}
          <div className="space-y-1.5">
            <Label htmlFor="colorVariant" className="text-xs font-semibold">
              Color Variant / Finish
            </Label>
            <Select
              value={selectedColor}
              onValueChange={(val) => {
                setSelectedColor(val);
                form.setValue("colorVariant", val, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            >
              <SelectTrigger id="colorVariant" className="w-full">
                <SelectValue
                  placeholder={
                    colorOptions.length === 0
                      ? "No color variants in sheet"
                      : "Select color variant"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dimensions & Unit */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="text-xs font-semibold text-foreground">
              Tile Dimensions & Unit
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label
                  htmlFor="length"
                  className="text-[11px] text-muted-foreground"
                >
                  Length *
                </Label>
                <Input
                  id="length"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0.01}
                  {...form.register("length", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="width"
                  className="text-[11px] text-muted-foreground"
                >
                  Width *
                </Label>
                <Input
                  id="width"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0.01}
                  {...form.register("width", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="sizeUnit"
                  className="text-[11px] text-muted-foreground"
                >
                  Size Unit *
                </Label>
                <Select
                  value={selectedUnit}
                  onValueChange={(u: LengthUnit) => {
                    setSelectedUnit(u);
                    form.setValue("sizeUnit", u, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                >
                  <SelectTrigger id="sizeUnit">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {LENGTH_UNIT_LABELS[unit]} ({unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pieces Per Box & Price Per Box */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="piecesPerBox" className="text-xs font-semibold">
                Pieces per box *
              </Label>
              <Input
                id="piecesPerBox"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                {...form.register("piecesPerBox", { valueAsNumber: true })}
              />
              {form.formState.errors.piecesPerBox ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.piecesPerBox.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pricePerBox" className="text-xs font-semibold">
                Price per box ({CURRENCY_SYMBOL}) *
              </Label>
              <Input
                id="pricePerBox"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                {...form.register("pricePerBox", { valueAsNumber: true })}
              />
              {form.formState.errors.pricePerBox ? (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.pricePerBox.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* Initial Stock (Create Mode Only) */}
          {!isEdit ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-lg border bg-muted/15 p-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="initialStockBoxes"
                  className="text-xs font-semibold"
                >
                  Initial Stock (Boxes)
                </Label>
                <Input
                  id="initialStockBoxes"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  placeholder="0"
                  {...form.register("initialStockBoxes", {
                    valueAsNumber: true,
                  })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="minimumBoxes" className="text-xs font-semibold">
                  Minimum Alert Threshold (Boxes)
                </Label>
                <Input
                  id="minimumBoxes"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  placeholder="10"
                  {...form.register("minimumBoxes", { valueAsNumber: true })}
                />
              </div>
            </div>
          ) : null}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              rows={2}
              {...form.register("notes")}
              placeholder="e.g. Suitable for high-traffic indoor floors, anti-skid"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
