import { describe, expect, it } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import calculatorReducer, {
  addOpening,
  addWall,
  resetBathroom,
  resetFloor,
  resetKitchen,
  resetWall,
  selectCatalogTile,
  setBathroomField,
  setExtraBoxes,
  setExtraPercent,
  setExtraType,
  setFloorField,
  setKitchenField,
  setUnit,
  updateOpening,
  updateWall,
  setWallSectionField,
} from "./calculatorSlice";
import {
  selectBathroomResult,
  selectFloorResult,
  selectKitchenResult,
  selectWallResult,
} from "./selectors";
import type { RootState } from "@/store/store";

function createTestStore() {
  return configureStore({
    reducer: {
      calculator: calculatorReducer,
    },
  });
}

describe("Redux Selectors Comprehensive Test Suite", () => {
  describe("Floor Calculator Selector", () => {
    it("calculates floor accurately in meters", () => {
      const store = createTestStore();
      store.dispatch(setUnit("m"));
      store.dispatch(setFloorField({ length: 4, width: 3 }));
      store.dispatch(
        setFloorField({
          tile: { length: 0.6, width: 0.6, piecesPerBox: 4, pricePerBox: 800, tileUnit: "m" },
        })
      );
      store.dispatch(setExtraPercent({ section: "floor", value: 10 }));

      const state = store.getState() as RootState;
      const result = selectFloorResult(state);

      // 4m × 3m = 12 m² (12,000,000 mm²). Tile 0.6×0.6 = 0.36 m².
      // Base tiles = ceil(12 / 0.36) = ceil(33.333) = 34 tiles.
      // Base boxes = ceil(34 / 4) = 9 boxes.
      // Extra tiles (10%) = ceil(34 * 0.10) = 4 tiles.
      // Total tiles = 34 + 4 = 38 tiles.
      // Total boxes = ceil(38 / 4) = 10 boxes.
      // Estimated cost = 10 * 800 = 8,000.
      expect(result.surfaceAreaMm2).toBe(12_000_000);
      expect(result.baseTilesNeeded).toBe(34);
      expect(result.baseBoxesNeeded).toBe(9);
      expect(result.extraTiles).toBe(4);
      expect(result.totalTiles).toBe(38);
      expect(result.totalBoxes).toBe(10);
      expect(result.estimatedCost).toBe(8000);
    });

    it("calculates floor with extra boxes mode", () => {
      const store = createTestStore();
      store.dispatch(setUnit("m"));
      store.dispatch(setFloorField({ length: 4, width: 3 }));
      store.dispatch(
        setFloorField({
          tile: { length: 0.5, width: 0.5, piecesPerBox: 4, pricePerBox: 500, tileUnit: "m" },
        })
      );
      store.dispatch(setExtraType({ section: "floor", type: "boxes" }));
      store.dispatch(setExtraBoxes({ section: "floor", value: 2 }));

      const state = store.getState() as RootState;
      const result = selectFloorResult(state);

      // 12 m² / 0.25 m² = 48 base tiles. 12 base boxes.
      // Extra boxes: 2 -> extra tiles: 2 * 4 = 8 tiles.
      // Total tiles = 48 + 8 = 56 tiles -> 14 total boxes.
      // Estimated cost = 14 * 500 = 7,000.
      expect(result.baseTilesNeeded).toBe(48);
      expect(result.baseBoxesNeeded).toBe(12);
      expect(result.extraBoxes).toBe(2);
      expect(result.extraTiles).toBe(8);
      expect(result.totalTiles).toBe(56);
      expect(result.totalBoxes).toBe(14);
      expect(result.estimatedCost).toBe(7000);
    });
  });

  describe("Wall Calculator Selector (Meters & Openings)", () => {
    it("deducts openings accurately when unit is set to meters", () => {
      const store = createTestStore();
      store.dispatch(setUnit("m"));

      const state1 = store.getState() as RootState;
      const wallId = state1.calculator.wall.walls[0].id;

      // Wall 1: 6 m length × 2.8 m height = 16.8 m²
      store.dispatch(updateWall({ section: "wall", id: wallId, patch: { length: 6, height: 2.8 } }));

      // Add Door: 1.0 m × 2.1 m = 2.1 m²
      store.dispatch(addOpening({ section: "wall", wallId }));
      const state2 = store.getState() as RootState;
      const doorId = state2.calculator.wall.walls[0].openings[0].id;
      store.dispatch(
        updateOpening({
          section: "wall",
          wallId,
          openingId: doorId,
          patch: { label: "Door", width: 1.0, height: 2.1 },
        })
      );

      // Add Window: 1.5 m × 1.2 m = 1.8 m²
      store.dispatch(addOpening({ section: "wall", wallId }));
      const state3 = store.getState() as RootState;
      const windowId = state3.calculator.wall.walls[0].openings[1].id;
      store.dispatch(
        updateOpening({
          section: "wall",
          wallId,
          openingId: windowId,
          patch: { label: "Window", width: 1.5, height: 1.2 },
        })
      );

      // Net Area = 16.8 - 2.1 - 1.8 = 12.9 m² (12,900,000 mm²)
      // Tile: 0.3 m × 0.3 m = 0.09 m² (90,000 mm²), 10 pieces/box (0.9 m²/box), 10% wastage
      store.dispatch(
        setWallSectionField({
          tile: { length: 0.3, width: 0.3, piecesPerBox: 10, pricePerBox: 1500, tileUnit: "m" },
        })
      );
      store.dispatch(setExtraPercent({ section: "wall", value: 10 }));

      const finalState = store.getState() as RootState;
      const { combined, sections } = selectWallResult(finalState);

      expect(sections).toHaveLength(1);
      expect(sections[0].area).toBeCloseTo(12_900_000, -2);
      expect(combined.surfaceAreaMm2).toBeCloseTo(12_900_000, -2);

      // Base tiles = ceil(12.9 / 0.09) = ceil(143.333) = 144 tiles
      expect(combined.baseTilesNeeded).toBe(144);
      // Base boxes = ceil(144 / 10) = 15 boxes
      expect(combined.baseBoxesNeeded).toBe(15);
      // Extra tiles (10%) = ceil(144 * 0.10) = 15 tiles
      expect(combined.extraTiles).toBe(15);
      // Total tiles = 144 + 15 = 159 tiles
      expect(combined.totalTiles).toBe(159);
      // Total boxes = ceil(159 / 10) = 16 boxes
      expect(combined.totalBoxes).toBe(16);
      // Estimated cost = 16 * 1500 = 24,000
      expect(combined.estimatedCost).toBe(24000);
    });

    it("calculates multiple walls in meters with individual openings correctly", () => {
      const store = createTestStore();
      store.dispatch(setUnit("m"));

      const state1 = store.getState() as RootState;
      const wall1Id = state1.calculator.wall.walls[0].id;
      // Wall 1: 4m × 3m = 12 m² - Door 1m × 2m = 10 m²
      store.dispatch(updateWall({ section: "wall", id: wall1Id, patch: { label: "North Wall", length: 4, height: 3 } }));
      store.dispatch(addOpening({ section: "wall", wallId: wall1Id }));
      const state2 = store.getState() as RootState;
      const doorId = state2.calculator.wall.walls[0].openings[0].id;
      store.dispatch(updateOpening({ section: "wall", wallId: wall1Id, openingId: doorId, patch: { width: 1, height: 2 } }));

      // Wall 2: 5m × 3m = 15 m² (no openings)
      store.dispatch(addWall({ section: "wall" }));
      const state3 = store.getState() as RootState;
      const wall2Id = state3.calculator.wall.walls[1].id;
      store.dispatch(updateWall({ section: "wall", id: wall2Id, patch: { label: "South Wall", length: 5, height: 3 } }));

      // Combined Net Area = 10 + 15 = 25 m²
      // Tile: 0.5 m × 0.5 m = 0.25 m², 4 pcs/box (1 m²/box), 0% wastage
      store.dispatch(
        setWallSectionField({
          tile: { length: 0.5, width: 0.5, piecesPerBox: 4, pricePerBox: 600, tileUnit: "m" },
        })
      );
      store.dispatch(setExtraPercent({ section: "wall", value: 0 }));

      const finalState = store.getState() as RootState;
      const { combined, sections } = selectWallResult(finalState);

      expect(sections).toHaveLength(2);
      expect(sections[0].area).toBeCloseTo(10_000_000, -2);
      expect(sections[1].area).toBeCloseTo(15_000_000, -2);
      expect(combined.surfaceAreaMm2).toBeCloseTo(25_000_000, -2);

      // Base tiles = 25 / 0.25 = 100 tiles
      expect(combined.baseTilesNeeded).toBe(100);
      expect(combined.totalTiles).toBe(100);
      expect(combined.totalBoxes).toBe(25);
    });
  });

  describe("Kitchen Calculator Selector", () => {
    it("deducts sink opening from countertop and adds backsplash in meters", () => {
      const store = createTestStore();
      store.dispatch(setUnit("m"));

      // Countertop: 3.5 m × 0.6 m = 2.1 m²
      // Sink deduction: 0.8 m × 0.5 m = 0.4 m²
      // Net countertop = 1.7 m² (1,700,000 mm²)
      // Backsplash: 3.5 m × 0.6 m = 2.1 m²
      store.dispatch(
        setKitchenField({
          countertopLength: 3.5,
          countertopWidth: 0.6,
          sinkLength: 0.8,
          sinkWidth: 0.5,
          includeBacksplash: true,
          backsplashLength: 3.5,
          backsplashHeight: 0.6,
          countertopTile: { length: 0.6, width: 0.6, piecesPerBox: 4, pricePerBox: 1200, tileUnit: "m" },
          backsplashTile: { length: 0.1, width: 0.3, piecesPerBox: 30, pricePerBox: 1500, tileUnit: "m" },
        })
      );
      store.dispatch(setExtraPercent({ section: "kitchen", value: 10 }));

      const state = store.getState() as RootState;
      const { combined, sections } = selectKitchenResult(state);

      expect(sections).toHaveLength(2);
      // Countertop net area: 1.7 m²
      expect(sections[0].result.surfaceAreaMm2).toBeCloseTo(1_700_000, -2);
      // Tile 0.6×0.6 = 0.36 m² -> base tiles = ceil(1.7 / 0.36) = ceil(4.722) = 5 tiles -> 2 boxes
      expect(sections[0].result.baseTilesNeeded).toBe(5);

      // Backsplash area: 2.1 m²
      expect(sections[1].result.surfaceAreaMm2).toBeCloseTo(2_100_000, -2);
      // Tile 0.1×0.3 = 0.03 m² -> base tiles = ceil(2.1 / 0.03) = 70 tiles -> ceil(70/30) = 3 boxes
      expect(sections[1].result.baseTilesNeeded).toBe(70);

      // Combined
      expect(combined.surfaceAreaMm2).toBeCloseTo(3_800_000, -2);
      expect(combined.baseTilesNeeded).toBe(5 + 70); // 75 tiles
      expect(combined.hasInputs).toBe(true);
    });

    it("handles kitchen with countertop only (no backsplash)", () => {
      const store = createTestStore();
      store.dispatch(setUnit("m"));

      store.dispatch(
        setKitchenField({
          countertopLength: 2.0,
          countertopWidth: 0.6,
          sinkLength: 0,
          sinkWidth: 0,
          includeBacksplash: false,
          countertopTile: { length: 0.5, width: 0.5, piecesPerBox: 4, pricePerBox: 600, tileUnit: "m" },
        })
      );
      store.dispatch(setExtraPercent({ section: "kitchen", value: 0 }));

      const state = store.getState() as RootState;
      const { combined, sections } = selectKitchenResult(state);

      expect(sections).toHaveLength(1);
      expect(sections[0].label).toBe("Countertop");
      expect(combined.surfaceAreaMm2).toBeCloseTo(1_200_000, -2);
      // 1.2 m² / 0.25 m² = ceil(4.8) = 5 tiles
      expect(combined.baseTilesNeeded).toBe(5);
      expect(combined.totalBoxes).toBe(2);
    });
  });

  describe("Bathroom Calculator Selector", () => {
    it("calculates floor and multi-wall with door in meters", () => {
      const store = createTestStore();
      store.dispatch(setUnit("m"));

      // Floor: 2.5 m × 2.0 m = 5.0 m²
      // Floor Tile: 0.5 m × 0.5 m = 0.25 m², 4 pcs/box, price 800
      // Walls: 1 wall 9 m perimeter × 2.4 m height = 21.6 m² - Door 0.8 m × 2.0 m (1.6 m²) = 20.0 m²
      // Wall Tile: 0.3 m × 0.6 m = 0.18 m², 8 pcs/box, price 1200
      const state1 = store.getState() as RootState;
      const wallId = state1.calculator.bathroom.walls[0].id;

      store.dispatch(
        setBathroomField({
          floorLength: 2.5,
          floorWidth: 2.0,
          floorTile: { length: 0.5, width: 0.5, piecesPerBox: 4, pricePerBox: 800, tileUnit: "m" },
          tile: { length: 0.3, width: 0.6, piecesPerBox: 8, pricePerBox: 1200, tileUnit: "m" },
        })
      );
      store.dispatch(updateWall({ section: "bathroom", id: wallId, patch: { length: 9, height: 2.4 } }));
      store.dispatch(addOpening({ section: "bathroom", wallId }));
      const state2 = store.getState() as RootState;
      const doorId = state2.calculator.bathroom.walls[0].openings[0].id;
      store.dispatch(
        updateOpening({
          section: "bathroom",
          wallId,
          openingId: doorId,
          patch: { label: "Bathroom Door", width: 0.8, height: 2.0 },
        })
      );
      store.dispatch(setExtraPercent({ section: "bathroom", value: 10 }));

      const finalState = store.getState() as RootState;
      const { floor, wallCombined, combined } = selectBathroomResult(finalState);

      // Floor: 5.0 m² / 0.25 = 20 base tiles -> +2 extra (10%) = 22 total tiles -> 6 boxes (cost: 4800)
      expect(floor.surfaceAreaMm2).toBeCloseTo(5_000_000, -2);
      expect(floor.baseTilesNeeded).toBe(20);
      expect(floor.totalTiles).toBe(22);
      expect(floor.totalBoxes).toBe(6);
      expect(floor.estimatedCost).toBe(4800);

      // Walls: 20.0 m² / 0.18 = ceil(111.11) = 112 base tiles -> +12 extra = 124 total tiles -> 16 boxes (cost: 19200)
      expect(wallCombined.surfaceAreaMm2).toBeCloseTo(20_000_000, -2);
      expect(wallCombined.baseTilesNeeded).toBe(112);
      expect(wallCombined.totalTiles).toBe(124);
      expect(wallCombined.totalBoxes).toBe(16);
      expect(wallCombined.estimatedCost).toBe(19200);

      // Combined
      expect(combined.surfaceAreaMm2).toBeCloseTo(25_000_000, -2);
      expect(combined.baseTilesNeeded).toBe(20 + 112); // 132 tiles
      expect(combined.totalTiles).toBe(22 + 124); // 146 tiles
      expect(combined.totalBoxes).toBe(6 + 16); // 22 boxes
      expect(combined.estimatedCost).toBe(4800 + 19200); // 24,000
    });
  });

  describe("Unit Switching Reactivity", () => {
    it("syncs manual tileUnit when changing unit via setUnit", () => {
      const store = createTestStore();

      // Default unit is 'ft'
      expect(store.getState().calculator.unit).toBe("ft");
      expect(store.getState().calculator.wall.tile.tileUnit).toBe("ft");

      // Switch to 'm'
      store.dispatch(setUnit("m"));
      expect(store.getState().calculator.unit).toBe("m");
      expect(store.getState().calculator.wall.tile.tileUnit).toBe("m");
      expect(store.getState().calculator.floor.tile.tileUnit).toBe("m");
      expect(store.getState().calculator.kitchen.countertopTile.tileUnit).toBe("m");
      expect(store.getState().calculator.bathroom.floorTile.tileUnit).toBe("m");

      // Switch to 'inch'
      store.dispatch(setUnit("inch"));
      expect(store.getState().calculator.unit).toBe("inch");
      expect(store.getState().calculator.wall.tile.tileUnit).toBe("inch");
    });

    it("preserves catalog tile unit from Google Sheet data and calculates correctly when room unit differs", () => {
      const store = createTestStore();
      // Room dimensions entered in feet (ft)
      store.dispatch(setUnit("ft"));
      store.dispatch(setFloorField({ length: 10, width: 10 })); // 10 ft × 10 ft = 100 sq ft (9,290,304 mm²)

      // Catalog tile from Google Sheet in millimeters (mm): 600 mm × 600 mm = 360,000 mm²
      store.dispatch(
        selectCatalogTile({
          section: "floor",
          target: "main",
          sku: "TILE-MM-001",
          tile: {
            length: 600,
            width: 600,
            piecesPerBox: 4,
            pricePerBox: 1200,
            tileUnit: "mm", // Google Sheet size unit
          },
        })
      );
      store.dispatch(setExtraPercent({ section: "floor", value: 10 }));

      const state = store.getState() as RootState;
      const result = selectFloorResult(state);

      // 100 sq ft = 9,290,304 mm²
      // Tile area = 600 × 600 = 360,000 mm²
      // Base tiles = ceil(9,290,304 / 360,000) = ceil(25.8064) = 26 tiles
      // Base boxes = ceil(26 / 4) = 7 boxes
      // Extra tiles (10%) = ceil(26 * 0.10) = 3 tiles
      // Total tiles = 26 + 3 = 29 tiles
      // Total boxes = ceil(29 / 4) = 8 boxes
      // Estimated cost = 8 * 1200 = 9600
      expect(result.surfaceAreaMm2).toBeCloseTo(9_290_304, -2);
      expect(result.baseTilesNeeded).toBe(26);
      expect(result.baseBoxesNeeded).toBe(7);
      expect(result.extraTiles).toBe(3);
      expect(result.totalTiles).toBe(29);
      expect(result.totalBoxes).toBe(8);
      expect(result.estimatedCost).toBe(9600);

      // Switching global unit toggle does not overwrite catalog tile's unit
      store.dispatch(setUnit("m"));
      expect(store.getState().calculator.floor.tile.tileUnit).toBe("mm");
    });
  });
});
