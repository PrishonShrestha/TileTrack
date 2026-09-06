import { describe, expect, it } from "vitest";
import type { Product, Item, StockHistoryEntry } from "@/types/domain";

describe("Sales and Revenue Calculations", () => {
  const sampleProducts: Product[] = [
    {
      productId: "PRD-001",
      productName: "Calacatta Gold 60x60",
      sku: "PRD-001",
      type: "Tile",
      brand: "Kajaria",
      length: 2,
      width: 2,
      sizeUnit: "ft",
      colorVariant: "White",
      piecesPerBox: 4,
      pricePerBox: 1200,
    },
  ];

  const sampleItems: Item[] = [
    {
      itemId: "ITM-001",
      name: "Sika Tile Adhesive",
      category: "Adhesive",
      brand: "Sika",
      unit: "Bag",
      pricePerUnit: 650,
      stockQty: 35,
      minStock: 5,
      stockStatus: "In Stock",
    },
  ];

  const sampleHistory: StockHistoryEntry[] = [
    {
      date: "2026-09-01T10:00:00.000Z",
      productId: "PRD-001",
      action: "Sale",
      quantityBoxes: 10,
      quantityPieces: 0,
      quantity: 10,
      previousStock: 100,
      newStock: 90,
      reason: "Invoice #1001",
    },
    {
      date: "2026-09-02T14:30:00.000Z",
      productId: "ITM-001",
      action: "Sale",
      quantityBoxes: 5, // 5 bags
      quantityPieces: 0,
      quantity: 5,
      previousStock: 40,
      newStock: 35,
      reason: "Invoice #1002",
    },
    {
      date: "2026-09-03T09:15:00.000Z",
      productId: "PRD-001",
      action: "Return",
      quantityBoxes: 2,
      quantityPieces: 2, // 2 boxes + 2 pieces (2.5 boxes)
      quantity: 2.5,
      previousStock: 90,
      newStock: 92.5,
      reason: "Leftover return",
    },
  ];

  it("computes total gross sales amount accurately", () => {
    // Sale 1: 10 boxes * 1200 = 12,000
    // Sale 2: 5 bags * 650 = 3,250
    // Gross = 15,250
    const sales = sampleHistory.filter((h) => h.action === "Sale");
    let grossTotal = 0;

    for (const sale of sales) {
      const prod = sampleProducts.find((p) => p.productId === sale.productId);
      const item = sampleItems.find((i) => i.itemId === sale.productId);
      const price = prod?.pricePerBox ?? item?.pricePerUnit ?? 0;
      grossTotal += (sale.quantityBoxes ?? sale.quantity) * price;
    }

    expect(grossTotal).toBe(15250);
  });

  it("computes return value and net sales amount accurately", () => {
    // Return: 2 boxes + 2 pieces of Calacatta (4 pcs/box) = 2.5 boxes * 1200 = 3,000
    const returns = sampleHistory.filter((h) => h.action === "Return");
    let returnTotal = 0;

    for (const ret of returns) {
      const prod = sampleProducts.find((p) => p.productId === ret.productId);
      const item = sampleItems.find((i) => i.itemId === ret.productId);
      const price = prod?.pricePerBox ?? item?.pricePerUnit ?? 0;
      const piecesPerBox = prod?.piecesPerBox || 1;
      const totalBoxes = (ret.quantityBoxes ?? 0) + (ret.quantityPieces ?? 0) / piecesPerBox;
      returnTotal += totalBoxes * price;
    }

    expect(returnTotal).toBe(3000);

    const netSales = 15250 - returnTotal;
    expect(netSales).toBe(12250);
  });

  it("computes stock status transitions accurately", () => {
    function computeStatus(currentBoxes: number, minBoxes: number): "In Stock" | "Low Stock" | "Out of Stock" {
      if (currentBoxes <= 0) return "Out of Stock";
      if (currentBoxes <= minBoxes) return "Low Stock";
      return "In Stock";
    }

    expect(computeStatus(50, 10)).toBe("In Stock");
    expect(computeStatus(10, 10)).toBe("Low Stock");
    expect(computeStatus(8, 10)).toBe("Low Stock");
    expect(computeStatus(0, 10)).toBe("Out of Stock");
    expect(computeStatus(-1, 10)).toBe("Out of Stock");
  });

  it("sorts stock history entries by date in descending order", () => {
    const unsorted: StockHistoryEntry[] = [
      { ...sampleHistory[0], date: "2026-09-01T10:00:00.000Z" },
      { ...sampleHistory[1], date: "2026-09-05T12:00:00.000Z" },
      { ...sampleHistory[2], date: "2026-09-03T09:00:00.000Z" },
    ];

    const sorted = [...unsorted].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    expect(sorted[0].date).toBe("2026-09-05T12:00:00.000Z");
    expect(sorted[1].date).toBe("2026-09-03T09:00:00.000Z");
    expect(sorted[2].date).toBe("2026-09-01T10:00:00.000Z");
  });
});
