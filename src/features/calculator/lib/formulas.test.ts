import { describe, expect, it } from "vitest";
import {
  boxesFromPercent,
  calculateFromSurface,
  calculateFromSurfaceWithBoxes,
  calculateMultipleWalls,
  calculateMultipleWallsWithBoxes,
  calculateRoom,
  calculateRoomWithBoxes,
  calculateWall,
  calculateWallWithBoxes,
  clampWastage,
  percentFromBoxes,
  safeCeil,
  totalWallsArea,
} from "@/features/calculator/lib/formulas";
import type { WallInput, TileSpec } from "@/types/domain";

const tile: TileSpec = {
  length: 300,
  width: 300,
  piecesPerBox: 6,
  pricePerBox: 9, // 1.5 * 6
  tileUnit: "mm",
};

describe("safeCeil", () => {
  it("returns 0 for non-positive or non-finite values", () => {
    expect(safeCeil(0)).toBe(0);
    expect(safeCeil(-3)).toBe(0);
    expect(safeCeil(Number.NaN)).toBe(0);
  });

  it("rounds up to the next integer", () => {
    expect(safeCeil(1.0001)).toBe(2);
    expect(safeCeil(2.99999)).toBe(3);
  });
});

describe("calculateFromSurface", () => {
  it("computes an exact fit (no wastage)", () => {
    const surfaceMm2 = 1_000_000; // 1 m²
    const exactTile: TileSpec = { ...tile, length: 500, width: 500, piecesPerBox: 4, pricePerBox: 6 }; // 0.25 m² each
    const result = calculateFromSurface({
      surfaceAreaMm2: surfaceMm2,
      tile: exactTile,
      extraPercent: 0,
      pricePerBox: exactTile.pricePerBox,
    });
    expect(result.baseTilesNeeded).toBe(4);
    expect(result.baseBoxesNeeded).toBe(1);
    expect(result.extraTiles).toBe(0);
    expect(result.extraBoxes).toBe(0);
    expect(result.totalTiles).toBe(4);
    expect(result.totalBoxes).toBe(1);
    expect(result.estimatedCost).toBeCloseTo(exactTile.pricePerBox);
  });

  it("rounds up for tiny remainders", () => {
    // 0.26 m² with a 0.25 m² tile -> need 2 tiles (rounded up)
    const result = calculateFromSurface({
      surfaceAreaMm2: 260_000,
      tile: { ...tile, length: 500, width: 500, piecesPerBox: 4 },
      extraPercent: 0,
      pricePerBox: 6,
    });
    expect(result.baseTilesNeeded).toBe(2);
    expect(result.baseBoxesNeeded).toBe(1);
  });

  it("returns 0 and a warning when tile size is 0", () => {
    const result = calculateFromSurface({
      surfaceAreaMm2: 100_000,
      tile: { ...tile, length: 0, width: 300, piecesPerBox: 4 },
      extraPercent: 0,
      pricePerBox: 6,
    });
    expect(result.baseTilesNeeded).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("returns 0 when surface area is 0", () => {
    const result = calculateFromSurface({
      surfaceAreaMm2: 0,
      tile,
      extraPercent: 10,
      pricePerBox: 6,
    });
    expect(result.totalTiles).toBe(0);
    expect(result.totalBoxes).toBe(0);
  });

  it("derives totalBoxes from totalTiles, not by adding baseBoxes+extraBoxes", () => {
    // Surface needs 5 tiles, wastage 20% -> +1 tile = 6 tiles, 1 box of 6.
    const result = calculateFromSurface({
      surfaceAreaMm2: 5 * 90_000, // each tile 0.09 m²
      tile: { ...tile, length: 300, width: 300, piecesPerBox: 6 },
      extraPercent: 20,
      pricePerBox: 6,
    });
    expect(result.baseTilesNeeded).toBe(5);
    expect(result.extraTiles).toBe(1);
    expect(result.totalTiles).toBe(6);
    expect(result.totalBoxes).toBe(1);
  });

  it("applies wastage as a percent of the BASE tile count", () => {
    const result = calculateFromSurface({
      surfaceAreaMm2: 1_000_000,
      tile: { ...tile, length: 500, width: 500, piecesPerBox: 4 },
      extraPercent: 10,
      pricePerBox: 6,
    });
    // 4 base tiles * 10% = 0.4 -> ceil 1
    expect(result.baseTilesNeeded).toBe(4);
    expect(result.extraTiles).toBe(1);
    expect(result.totalTiles).toBe(5);
  });
});

describe("calculateRoom", () => {
  it("uses the user-selected unit consistently", () => {
    // 10 ft × 10 ft = 100 ft² ≈ 9.29 m². With a 1 ft tile we need 100 tiles.
    const result = calculateRoom({
      length: 10,
      width: 10,
      tile: { ...tile, length: 1, width: 1, piecesPerBox: 10, tileUnit: "ft" },
      extraPercent: 0,
      pricePerBox: 30,
      unit: "ft",
    });
    expect(result.baseTilesNeeded).toBe(100);
    expect(result.baseBoxesNeeded).toBe(10);
  });
});

describe("multi-wall math", () => {
  const walls: WallInput[] = [
    {
      id: "w1",
      label: "North",
      length: 4,
      height: 3,
      openings: [{ id: "o1", label: "Door", width: 1, height: 2.1 }],
    },
    {
      id: "w2",
      label: "South",
      length: 4,
      height: 3,
      openings: [],
    },
  ];

  it("deducts openings per wall", () => {
    // Wall 1: 4×3 = 12 m², door 1×2.1 = 2.1 m² -> 9.9 m² net
    // Wall 2: 4×3 = 12 m² -> 12 m² net
    // Total 21.9 m²
    const result = calculateMultipleWalls(
      walls,
      { ...tile, length: 0.5, width: 0.5, piecesPerBox: 4, tileUnit: "m" },
      0,
      8,
      "m"
    );
    const totalMm2 = result.reduce((acc, w) => acc + w.area, 0);
    const totalM2 = totalMm2 / 1_000_000;
    expect(totalM2).toBeCloseTo(21.9, 3);
  });

  it("summation matches totalWallsArea helper", () => {
    const total = totalWallsArea(walls, "m");
    const breakdown = calculateMultipleWalls(
      walls,
      { ...tile, length: 0.5, width: 0.5, piecesPerBox: 4, tileUnit: "m" },
      0,
      8,
      "m"
    );
    const sum = breakdown.reduce((acc, w) => acc + w.area, 0);
    expect(total).toBeCloseTo(sum, 6);
  });

  it("clamps negative net area to zero", () => {
    const wall: WallInput = {
      id: "w1",
      label: "Big door",
      length: 2,
      height: 2,
      openings: [{ id: "o1", label: "Door", width: 4, height: 4 }],
    };
    const [first] = calculateMultipleWalls(
      [wall],
      tile,
      0,
      8,
      "m"
    );
    expect(first.area).toBe(0);
  });
});

describe("wastage slider sync", () => {
  it("boxes-from-percent rounds up", () => {
    expect(boxesFromPercent(10, 50, 4)).toBe(2); // 5 tiles / 4 = 1.25 -> 2
  });

  it("percent-from-boxes back-solves", () => {
    expect(percentFromBoxes(2, 50, 4)).toBeCloseTo(16, 1); // 2*4/50*100 = 16
  });

  it("clamps wastage within bounds", () => {
    expect(clampWastage(-5)).toBe(0);
    expect(clampWastage(150)).toBe(100);
    expect(clampWastage(8.4)).toBe(8.4);
  });
});

describe("calculateFromSurfaceWithBoxes and calculateRoomWithBoxes", () => {
  it("calculates extra tiles and total boxes correctly when extraBoxes is provided", () => {
    // 100 tiles needed, 10 tiles/box = 10 base boxes.
    // Adding 2 extra boxes = 20 extra tiles -> total 120 tiles, 12 total boxes.
    const result = calculateFromSurfaceWithBoxes({
      surfaceAreaMm2: 100 * 90_000,
      tile: { ...tile, length: 300, width: 300, piecesPerBox: 10, tileUnit: "mm" },
      extraBoxes: 2,
      pricePerBox: 50,
    });
    expect(result.baseTilesNeeded).toBe(100);
    expect(result.baseBoxesNeeded).toBe(10);
    expect(result.extraBoxes).toBe(2);
    expect(result.extraTiles).toBe(20);
    expect(result.totalTiles).toBe(120);
    expect(result.totalBoxes).toBe(12);
    expect(result.estimatedCost).toBe(600); // 12 * 50
  });

  it("calculates room with boxes correctly", () => {
    const result = calculateRoomWithBoxes({
      length: 10,
      width: 10,
      tile: { ...tile, length: 1, width: 1, piecesPerBox: 10, tileUnit: "ft" },
      extraBoxes: 3,
      pricePerBox: 25,
      unit: "ft",
    });
    expect(result.baseTilesNeeded).toBe(100);
    expect(result.baseBoxesNeeded).toBe(10);
    expect(result.extraBoxes).toBe(3);
    expect(result.extraTiles).toBe(30);
    expect(result.totalTiles).toBe(130);
    expect(result.totalBoxes).toBe(13);
    expect(result.estimatedCost).toBe(325); // 13 * 25
  });

  it("handles 0 surface area safely with extra boxes", () => {
    const result = calculateRoomWithBoxes({
      length: 0,
      width: 10,
      tile: { ...tile, length: 1, width: 1, piecesPerBox: 10, tileUnit: "ft" },
      extraBoxes: 2,
      pricePerBox: 25,
      unit: "ft",
    });
    expect(result.baseTilesNeeded).toBe(0);
    expect(result.baseBoxesNeeded).toBe(0);
    expect(result.totalBoxes).toBe(0);
    expect(result.hasInputs).toBe(false);
  });
});

describe("tile unit conversion (inches, feet, meters, cm, mm)", () => {
  it("accurately calculates room when tile size is in inches (12 x 12 in = 1 ft²)", () => {
    // 10 ft × 10 ft room = 100 ft². Tile is 12 in × 12 in (1 ft²).
    // Base tiles needed should be exactly 100.
    const result = calculateRoom({
      length: 10,
      width: 10,
      tile: {
        length: 12,
        width: 12,
        piecesPerBox: 4,
        pricePerBox: 100,
        tileUnit: "inch",
      },
      extraPercent: 0,
      pricePerBox: 100,
      unit: "ft",
    });

    expect(result.baseTilesNeeded).toBe(100);
    expect(result.baseBoxesNeeded).toBe(25);
    expect(result.totalTiles).toBe(100);
    expect(result.totalBoxes).toBe(25);
  });

  it("accurately calculates room when tile size is 24 x 24 inches (4 ft²)", () => {
    // 10 ft × 10 ft room = 100 ft². Tile is 24 in × 24 in (4 ft²).
    // Base tiles needed should be exactly 25.
    const result = calculateRoom({
      length: 10,
      width: 10,
      tile: {
        length: 24,
        width: 24,
        piecesPerBox: 2,
        pricePerBox: 80,
        tileUnit: "inch",
      },
      extraPercent: 10,
      pricePerBox: 80,
      unit: "ft",
    });

    expect(result.baseTilesNeeded).toBe(25);
    expect(result.baseBoxesNeeded).toBe(13); // ceil(25 / 2)
    expect(result.extraTiles).toBe(3); // ceil(25 * 0.10) = 3
    expect(result.totalTiles).toBe(28); // 25 + 3
    expect(result.totalBoxes).toBe(14); // ceil(28 / 2)
  });

  it("accurately calculates when surface area is in meters and tile is in inches", () => {
    // 1 m² surface. Tile is 20 in × 20 in (0.508 m × 0.508 m = 0.258064 m²).
    // Base tiles needed should be ceil(1 / 0.258064) = 4 tiles.
    const result = calculateFromSurface({
      surfaceAreaMm2: 1_000_000,
      tile: {
        length: 20,
        width: 20,
        piecesPerBox: 4,
        pricePerBox: 50,
        tileUnit: "inch",
      },
      extraPercent: 0,
      pricePerBox: 50,
    });

    expect(result.baseTilesNeeded).toBe(4);
    expect(result.totalBoxes).toBe(1);
  });

  it("accurately calculates multiple walls with tile in inches", () => {
    // Two walls 10 ft × 8 ft each = 160 ft² total.
    // Tile is 12 in × 24 in = 2 ft² each.
    // Base tiles = 160 / 2 = 80 tiles.
    const walls: WallInput[] = [
      { id: "w1", label: "Wall 1", length: 10, height: 8, openings: [] },
      { id: "w2", label: "Wall 2", length: 10, height: 8, openings: [] },
    ];
    const wallTile: TileSpec = {
      length: 12,
      width: 24,
      piecesPerBox: 5,
      pricePerBox: 120,
      tileUnit: "inch",
    };

    const breakdown = calculateMultipleWalls(walls, wallTile, 0, 120, "ft");
    const totalTiles = breakdown.reduce((acc, w) => acc + w.result.baseTilesNeeded, 0);
    expect(totalTiles).toBe(80);
  });

  it("accurately calculates wall in meters with door and window openings", () => {
    // Wall: 5 m length × 3 m height = 15 m² gross area.
    // Door opening: 1 m width × 2.1 m height = 2.1 m².
    // Window opening: 1.2 m width × 1.0 m height = 1.2 m².
    // Total opening area = 3.3 m². Net wall area = 15 - 3.3 = 11.7 m² (11,700,000 mm²).
    // Tile: 0.3 m × 0.6 m (300 mm × 600 mm = 0.18 m²), 8 pieces per box (1.44 m²/box), 10% wastage.
    const wallInput: WallInput = {
      id: "w1",
      label: "Living Room Wall",
      length: 5,
      height: 3,
      openings: [
        { id: "o1", label: "Main Door", width: 1, height: 2.1 },
        { id: "o2", label: "Window", width: 1.2, height: 1.0 },
      ],
    };
    const wallTile: TileSpec = {
      length: 0.3,
      width: 0.6,
      piecesPerBox: 8,
      pricePerBox: 1200,
      tileUnit: "m",
    };

    const { area, result } = calculateWall(wallInput, wallTile, 10, 1200, "m");
    const netAreaM2 = area / 1_000_000;
    expect(netAreaM2).toBeCloseTo(11.7, 4);
    // Base tiles: ceil(11.7 / 0.18) = ceil(65.0) = 65 tiles
    expect(result.baseTilesNeeded).toBe(65);
    // Base boxes: ceil(65 / 8) = 9 boxes
    expect(result.baseBoxesNeeded).toBe(9);
    // Extra tiles (10%): ceil(65 * 0.10) = 7 tiles
    expect(result.extraTiles).toBe(7);
    // Total tiles: 65 + 7 = 72 tiles
    expect(result.totalTiles).toBe(72);
    // Total boxes: ceil(72 / 8) = 9 boxes
    expect(result.totalBoxes).toBe(9);
    // Estimated cost: 9 * 1200 = 10,800
    expect(result.estimatedCost).toBe(10800);
  });

  it("accurately handles unit conversion consistency between meters and feet", () => {
    // 3.048 m × 3.048 m room = exactly 10 ft × 10 ft (100 ft² ≈ 9.290304 m²).
    // Tile in m: 0.3048 m × 0.3048 m = 1 ft × 1 ft (0.09290304 m²).
    const resultInMeters = calculateRoom({
      length: 3.048,
      width: 3.048,
      tile: { length: 0.3048, width: 0.3048, piecesPerBox: 10, pricePerBox: 50, tileUnit: "m" },
      extraPercent: 10,
      pricePerBox: 50,
      unit: "m",
    });

    const resultInFeet = calculateRoom({
      length: 10,
      width: 10,
      tile: { length: 1, width: 1, piecesPerBox: 10, pricePerBox: 50, tileUnit: "ft" },
      extraPercent: 10,
      pricePerBox: 50,
      unit: "ft",
    });

    expect(resultInMeters.baseTilesNeeded).toBe(resultInFeet.baseTilesNeeded);
    expect(resultInMeters.baseBoxesNeeded).toBe(resultInFeet.baseBoxesNeeded);
    expect(resultInMeters.totalTiles).toBe(resultInFeet.totalTiles);
    expect(resultInMeters.totalBoxes).toBe(resultInFeet.totalBoxes);
    expect(resultInMeters.estimatedCost).toBe(resultInFeet.estimatedCost);
  });
});