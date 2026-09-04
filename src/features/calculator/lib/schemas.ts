import { z } from "zod";
import {
  MAX_WASTAGE_PERCENT,
  MIN_WASTAGE_PERCENT,
  STOCK_ACTIONS,
} from "@/lib/constants";

export const positiveNumber = z
  .number({ error: "Must be a number" })
  .finite()
  .positive("Must be greater than zero");

export const nonNegativeNumber = z
  .number({ error: "Must be a number" })
  .finite()
  .min(0, "Cannot be negative");

export const wallSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
  length: positiveNumber,
  height: positiveNumber,
  openings: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(1, "Opening label required"),
        width: nonNegativeNumber,
        height: nonNegativeNumber,
      })
    )
    .default([]),
});

export const tileSpecSchema = z.object({
  length: positiveNumber,
  width: positiveNumber,
  piecesPerBox: positiveNumber,
  pricePerBox: nonNegativeNumber,
  productId: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().optional(),
});

export const wastageSchema = z.object({
  extraPercent: z
    .number()
    .min(MIN_WASTAGE_PERCENT, `Minimum ${MIN_WASTAGE_PERCENT}%`)
    .max(MAX_WASTAGE_PERCENT, `Maximum ${MAX_WASTAGE_PERCENT}%`),
  extraBoxes: nonNegativeNumber,
});

export const createProductSchema = z.object({
  productId: z
    .string()
    .trim()
    .min(1, "Product ID is required")
    .regex(/^[A-Za-z0-9_-]+$/, "Product ID can only contain letters, numbers, hyphens, and underscores"),
  productName: z.string().trim().min(1, "Product Name is required"),
  type: z.string().trim().min(1, "Type is required"),
  brand: z.string().trim().min(1, "Brand is required"),
  length: positiveNumber,
  width: positiveNumber,
  sizeUnit: z.enum(["ft", "m", "inch", "mm", "cm"]),
  piecesPerBox: positiveNumber,
  pricePerBox: nonNegativeNumber,
  colorVariant: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  initialStockBoxes: z.number().min(0, "Initial stock cannot be negative").optional(),
  minimumBoxes: z.number().min(0, "Minimum stock cannot be negative").optional(),
});

export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  productName: z.string().trim().min(1, "Product Name is required"),
  type: z.string().trim().min(1, "Type is required"),
  brand: z.string().trim().min(1, "Brand is required"),
  length: positiveNumber,
  width: positiveNumber,
  sizeUnit: z.enum(["ft", "m", "inch", "mm", "cm"]),
  piecesPerBox: positiveNumber,
  pricePerBox: nonNegativeNumber,
  colorVariant: z.string().trim().default(""),
  notes: z.string().trim().optional(),
});

export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

export const deleteProductSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

export const stockUpdateSchema = z
  .object({
    productId: z.string().optional(),
    sku: z.string().optional(),
    action: z.enum(STOCK_ACTIONS),
    quantityBoxes: z.number().min(0).optional(),
    quantityPieces: z.number().min(0).optional(),
    quantity: z.number().min(0).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => Boolean(data.productId?.trim() || data.sku?.trim()), {
    message: "Product ID is required",
    path: ["productId"],
  })
  .refine(
    (data) =>
      (data.quantityBoxes ?? 0) +
        (data.quantityPieces ?? 0) +
        (data.quantity ?? 0) >
      0,
    {
      message: "Quantity (boxes or pieces) must be greater than 0",
      path: ["quantityBoxes"],
    }
  );

export type StockUpdateFormValues = z.infer<typeof stockUpdateSchema>;

export const roomSchema = z.object({
  length: positiveNumber,
  width: positiveNumber,
});

export const kitchenSchema = z.object({
  countertopLength: positiveNumber,
  countertopWidth: positiveNumber,
  sinkLength: nonNegativeNumber.default(0),
  sinkWidth: nonNegativeNumber.default(0),
  backsplashLength: nonNegativeNumber.default(0),
  backsplashHeight: nonNegativeNumber.default(0),
  includeBacksplash: z.boolean().default(false),
});
