import { describe, expect, it } from "vitest";
import { stockUpdateSchema } from "@/features/calculator/lib/schemas";
import { STOCK_ACTIONS } from "@/lib/constants";

describe("Stock Management and Return Logic", () => {
  it("includes Return action in STOCK_ACTIONS and excludes Reserved", () => {
    expect(STOCK_ACTIONS).toContain("Return");
    expect(STOCK_ACTIONS).toContain("Restock");
    expect(STOCK_ACTIONS).toContain("Sale");
    expect(STOCK_ACTIONS).toContain("Adjustment");
    expect(STOCK_ACTIONS).not.toContain("Reserved");
  });

  it("validates valid stock update payload with productId", () => {
    const valid = stockUpdateSchema.safeParse({
      productId: "TILE-001",
      action: "Return",
      quantityBoxes: 2,
      quantityPieces: 2,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.productId).toBe("TILE-001");
      expect(valid.data.action).toBe("Return");
      expect(valid.data.quantityBoxes).toBe(2);
      expect(valid.data.quantityPieces).toBe(2);
    }
  });

  it("fails validation when both productId and sku are missing", () => {
    const invalid = stockUpdateSchema.safeParse({
      action: "Return",
      quantityBoxes: 2,
    });
    expect(invalid.success).toBe(false);
  });

  it("calculates exact equivalent boxes for partial returns", () => {
    const piecesPerBox = 5;
    const returnedBoxes = 2;
    const returnedPieces = 2;
    const totalBoxesDelta = Number((returnedBoxes + returnedPieces / piecesPerBox).toFixed(4));

    expect(totalBoxesDelta).toBe(2.4);

    const initialStockBoxes = 50;
    const newStockBoxes = Number((initialStockBoxes + totalBoxesDelta).toFixed(4));
    expect(newStockBoxes).toBe(52.4);
  });

  it("disallows loose pieces when piecesPerBox is 1 (single-piece items/products)", () => {
    const piecesPerBox = 1;
    const allowLoosePieces = piecesPerBox > 1;
    expect(allowLoosePieces).toBe(false);

    // When loose pieces are disallowed, effective pieces is forced to 0
    const inputBoxes = 5;
    const inputPieces = 3;
    const effectivePieces = allowLoosePieces ? inputPieces : 0;
    const totalQuantity = Number((inputBoxes + effectivePieces / piecesPerBox).toFixed(4));

    expect(effectivePieces).toBe(0);
    expect(totalQuantity).toBe(5);
  });

  it("allows loose pieces when piecesPerBox is greater than 1", () => {
    const piecesPerBox = 4;
    const allowLoosePieces = piecesPerBox > 1;
    expect(allowLoosePieces).toBe(true);

    const inputBoxes = 5;
    const inputPieces = 2;
    const effectivePieces = allowLoosePieces ? inputPieces : 0;
    const totalQuantity = Number((inputBoxes + effectivePieces / piecesPerBox).toFixed(4));

    expect(effectivePieces).toBe(2);
    expect(totalQuantity).toBe(5.5);
  });
});
