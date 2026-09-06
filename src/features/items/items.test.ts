import { describe, expect, it } from "vitest";
import { z } from "zod";
import { generateProductId } from "@/lib/utils";
import { ITEM_UNITS } from "@/types/domain";

const createItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  unit: z.string().min(1, "Unit is required"),
  pricePerUnit: z.number().min(0, "Price must be non-negative"),
  initialStockQty: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  notes: z.string().optional(),
});

describe("Items Feature Management", () => {
  it("validates valid non-tile item creation payload", () => {
    const valid = createItemSchema.safeParse({
      itemId: "ITM-001",
      name: "Kohler Cimarron Commode",
      category: "Commode",
      brand: "Kohler",
      unit: "Piece",
      pricePerUnit: 4500,
      initialStockQty: 5,
      minStock: 1,
      notes: "One-piece elongated toilet",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.itemId).toBe("ITM-001");
      expect(valid.data.category).toBe("Commode");
      expect(valid.data.unit).toBe("Piece");
      expect(valid.data.pricePerUnit).toBe(4500);
    }
  });

  it("fails when price is negative", () => {
    const invalid = createItemSchema.safeParse({
      itemId: "ITM-002",
      name: "Sika Silicone Sealant",
      category: "Silicon",
      brand: "Sika",
      unit: "Tube",
      pricePerUnit: -100,
    });
    expect(invalid.success).toBe(false);
  });

  it("fails when required fields are missing", () => {
    const missingName = createItemSchema.safeParse({
      itemId: "ITM-003",
      category: "Adhesive",
      brand: "Mapei",
      unit: "Bag",
      pricePerUnit: 350,
    });
    expect(missingName.success).toBe(false);
  });

  it("generates unique item IDs with ITM prefix", () => {
    const id1 = generateProductId("ITM");
    const id2 = generateProductId("ITM");
    expect(id1).toMatch(/^ITM-[A-Z0-9]{5}$/);
    expect(id2).toMatch(/^ITM-[A-Z0-9]{5}$/);
    expect(id1).not.toBe(id2);
  });

  it("includes common store units", () => {
    expect(ITEM_UNITS).toContain("Piece");
    expect(ITEM_UNITS).toContain("Bag");
    expect(ITEM_UNITS).toContain("Tube");
    expect(ITEM_UNITS).toContain("Liter");
    expect(ITEM_UNITS).toContain("Roll");
    expect(ITEM_UNITS).toContain("Kg");
  });
});
