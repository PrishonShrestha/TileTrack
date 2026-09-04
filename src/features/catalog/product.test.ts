import { describe, expect, it } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
} from "@/features/calculator/lib/schemas";
import { formatStockBoxesAndPieces, generateProductId } from "@/lib/utils";

describe("Product Management & Formatting", () => {
  it("validates valid product creation payload", () => {
    const valid = createProductSchema.safeParse({
      productId: "TILE-101",
      productName: "Calacatta Gold",
      type: "Marble",
      brand: "Marazzi",
      length: 2,
      width: 2,
      sizeUnit: "ft",
      piecesPerBox: 4,
      pricePerBox: 45.5,
      colorVariant: "White/Gold",
      notes: "Polished finish",
      initialStockBoxes: 20,
      minimumBoxes: 5,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.productId).toBe("TILE-101");
      expect(valid.data.productName).toBe("Calacatta Gold");
      expect(valid.data.pricePerBox).toBe(45.5);
    }
  });

  it("fails product creation when required fields are missing or invalid", () => {
    const invalidId = createProductSchema.safeParse({
      productId: "TILE with spaces!",
      productName: "Test Tile",
      type: "Tile",
      brand: "Brand",
      length: 1,
      width: 1,
      piecesPerBox: 1,
      pricePerBox: 10,
    });
    expect(invalidId.success).toBe(false);

    const negativePrice = createProductSchema.safeParse({
      productId: "TILE-002",
      productName: "Test Tile",
      type: "Tile",
      brand: "Brand",
      length: 1,
      width: 1,
      piecesPerBox: 1,
      pricePerBox: -5,
    });
    expect(negativePrice.success).toBe(false);
  });

  it("validates product update schema", () => {
    const validUpdate = updateProductSchema.safeParse({
      productId: "TILE-101",
      productName: "Calacatta Gold Premium",
      type: "Marble",
      brand: "Marazzi",
      length: 2,
      width: 2,
      sizeUnit: "ft",
      piecesPerBox: 4,
      pricePerBox: 49.99,
      colorVariant: "White/Gold Extra",
    });
    expect(validUpdate.success).toBe(true);
  });

  it("validates product delete schema", () => {
    const validDelete = deleteProductSchema.safeParse({ productId: "TILE-101" });
    expect(validDelete.success).toBe(true);

    const emptyDelete = deleteProductSchema.safeParse({ productId: "   " });
    expect(emptyDelete.success).toBe(false);
  });

  it("generates unique clean product IDs", () => {
    const id1 = generateProductId();
    const id2 = generateProductId();
    expect(id1).toMatch(/^PRD-[A-Z0-9]{5}$/);
    expect(id2).toMatch(/^PRD-[A-Z0-9]{5}$/);
    expect(id1).not.toBe(id2);
  });

  it("formats stock in boxes and pieces accurately", () => {
    expect(formatStockBoxesAndPieces(0, 5)).toBe("0 boxes");
    expect(formatStockBoxesAndPieces(1, 5)).toBe("1 box");
    expect(formatStockBoxesAndPieces(10, 5)).toBe("10 boxes");
    expect(formatStockBoxesAndPieces(10.4, 5)).toBe("10 boxes, 2 pieces");
    expect(formatStockBoxesAndPieces(10.2, 5)).toBe("10 boxes, 1 piece");
    expect(formatStockBoxesAndPieces(0.4, 5)).toBe("2 pieces");
    expect(formatStockBoxesAndPieces(0.2, 5)).toBe("1 piece");
  });
});
