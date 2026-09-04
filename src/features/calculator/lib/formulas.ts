import {
  DEFAULT_WASTAGE_PERCENT,
  MAX_WASTAGE_PERCENT,
  MIN_WASTAGE_PERCENT,
} from "@/lib/constants";
import type { CalculatorResult, TileSpec, WallInput } from "@/types/domain";
import { areaToMm2, lengthToMm } from "./unitConversion";

export interface CalculationInputs {
  surfaceAreaMm2: number;
  tile: TileSpec;
  extraPercent: number;
  pricePerBox: number;
}

export function safeCeil(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  // Guard against IEEE 754 floating point imprecision (e.g. 100.00000000000003 -> 100)
  const epsilon = 1e-7;
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < epsilon) {
    return Math.max(0, rounded);
  }
  return Math.ceil(value);
}

export function calculateFromSurface({
  surfaceAreaMm2,
  tile,
  extraPercent,
  pricePerBox,
}: CalculationInputs): CalculatorResult {
  const warnings: string[] = [];
  const hasInputs = surfaceAreaMm2 > 0 && tile.length > 0 && tile.width > 0 && tile.piecesPerBox > 0;

  if (tile.length <= 0 || tile.width <= 0) {
    warnings.push("Tile dimensions must be greater than zero.");
  }
  if (tile.piecesPerBox <= 0) {
    warnings.push("Pieces per box must be greater than zero.");
  }
  if (extraPercent < MIN_WASTAGE_PERCENT || extraPercent > MAX_WASTAGE_PERCENT) {
    warnings.push(
      `Wastage should be between ${MIN_WASTAGE_PERCENT}% and ${MAX_WASTAGE_PERCENT}%.`
    );
  }

  if (!hasInputs) {
    return {
      surfaceAreaMm2,
      baseTilesNeeded: 0,
      baseBoxesNeeded: 0,
      extraTiles: 0,
      extraBoxes: 0,
      totalTiles: 0,
      totalBoxes: 0,
      totalCoverageAreaMm2: 0,
      wastageAreaMm2: 0,
      estimatedCost: 0,
      hasInputs: false,
      warnings,
    };
  }

  const tileLengthMm = lengthToMm(tile.length, tile.tileUnit || "mm");
  const tileWidthMm = lengthToMm(tile.width, tile.tileUnit || "mm");
  const tileAreaMm2 = tileLengthMm * tileWidthMm;
  const baseTilesNeeded = safeCeil(surfaceAreaMm2 / tileAreaMm2);
  const baseBoxesNeeded = safeCeil(baseTilesNeeded / tile.piecesPerBox);

  const safePercent = clampWastage(extraPercent);
  const extraTiles = safeCeil(baseTilesNeeded * (safePercent / 100));
  const extraBoxes = safeCeil(extraTiles / tile.piecesPerBox);

  const totalTiles = baseTilesNeeded + extraTiles;
  const totalBoxes = safeCeil(totalTiles / tile.piecesPerBox);

  const totalCoverageAreaMm2 = totalBoxes * tile.piecesPerBox * tileAreaMm2;
  const wastageAreaMm2 = Math.max(0, totalCoverageAreaMm2 - surfaceAreaMm2);

  const estimatedCost = totalBoxes * pricePerBox;

  return {
    surfaceAreaMm2,
    baseTilesNeeded,
    baseBoxesNeeded,
    extraTiles,
    extraBoxes,
    totalTiles,
    totalBoxes,
    totalCoverageAreaMm2,
    wastageAreaMm2,
    estimatedCost,
    hasInputs: true,
    warnings,
  };
}

export interface CalculateFromSurfaceWithBoxesInputs {
  surfaceAreaMm2: number;
  tile: TileSpec;
  extraBoxes: number;
  pricePerBox: number;
}

export function calculateFromSurfaceWithBoxes({
  surfaceAreaMm2,
  tile,
  extraBoxes,
  pricePerBox,
}: CalculateFromSurfaceWithBoxesInputs): CalculatorResult {
  const warnings: string[] = [];
  const hasInputs = surfaceAreaMm2 > 0 && tile.length > 0 && tile.width > 0 && tile.piecesPerBox > 0;

  if (tile.length <= 0 || tile.width <= 0) {
    warnings.push("Tile dimensions must be greater than zero.");
  }
  if (tile.piecesPerBox <= 0) {
    warnings.push("Pieces per box must be greater than zero.");
  }
  if (extraBoxes < 0) {
    warnings.push("Extra boxes cannot be negative.");
  }

  if (!hasInputs) {
    return {
      surfaceAreaMm2,
      baseTilesNeeded: 0,
      baseBoxesNeeded: 0,
      extraTiles: 0,
      extraBoxes: 0,
      totalTiles: 0,
      totalBoxes: 0,
      totalCoverageAreaMm2: 0,
      wastageAreaMm2: 0,
      estimatedCost: 0,
      hasInputs: false,
      warnings,
    };
  }

  const tileLengthMm = lengthToMm(tile.length, tile.tileUnit || "mm");
  const tileWidthMm = lengthToMm(tile.width, tile.tileUnit || "mm");
  const tileAreaMm2 = tileLengthMm * tileWidthMm;
  const baseTilesNeeded = safeCeil(surfaceAreaMm2 / tileAreaMm2);
  const baseBoxesNeeded = safeCeil(baseTilesNeeded / tile.piecesPerBox);

  const safeExtraBoxes = Math.max(0, extraBoxes);
  const extraTiles = safeExtraBoxes * tile.piecesPerBox;
  const totalTiles = baseTilesNeeded + extraTiles;
  const totalBoxes = safeCeil(totalTiles / tile.piecesPerBox);

  const totalCoverageAreaMm2 = totalBoxes * tile.piecesPerBox * tileAreaMm2;
  const wastageAreaMm2 = Math.max(0, totalCoverageAreaMm2 - surfaceAreaMm2);

  const estimatedCost = totalBoxes * pricePerBox;

  return {
    surfaceAreaMm2,
    baseTilesNeeded,
    baseBoxesNeeded,
    extraTiles,
    extraBoxes: safeExtraBoxes,
    totalTiles,
    totalBoxes,
    totalCoverageAreaMm2,
    wastageAreaMm2,
    estimatedCost,
    hasInputs: true,
    warnings,
  };
}

export interface RoomCalculatorArgs {
  length: number;
  width: number;
  tile: TileSpec;
  extraPercent: number;
  pricePerBox: number;
  unit: import("@/lib/constants").LengthUnit;
}

export function calculateRoom({
  length,
  width,
  tile,
  extraPercent,
  pricePerBox,
  unit,
}: RoomCalculatorArgs): CalculatorResult {
  const surfaceLengthMm = lengthToMm(length, unit);
  const surfaceWidthMm = lengthToMm(width, unit);
  const surfaceAreaMm2 = surfaceLengthMm * surfaceWidthMm;
  return calculateFromSurface({
    surfaceAreaMm2,
    tile,
    extraPercent,
    pricePerBox,
  });
}

export interface CalculateRoomWithBoxesArgs {
  length: number;
  width: number;
  tile: TileSpec;
  extraBoxes: number;
  pricePerBox: number;
  unit: import("@/lib/constants").LengthUnit;
}

export function calculateRoomWithBoxes({
  length,
  width,
  tile,
  extraBoxes,
  pricePerBox,
  unit,
}: CalculateRoomWithBoxesArgs): CalculatorResult {
  const surfaceLengthMm = lengthToMm(length, unit);
  const surfaceWidthMm = lengthToMm(width, unit);
  const surfaceAreaMm2 = surfaceLengthMm * surfaceWidthMm;
  return calculateFromSurfaceWithBoxes({
    surfaceAreaMm2,
    tile,
    extraBoxes,
    pricePerBox,
  });
}

export function calculateWall(
  wall: WallInput,
  tile: TileSpec,
  extraPercent: number,
  pricePerBox: number,
  unit: import("@/lib/constants").LengthUnit
): { area: number; result: CalculatorResult } {
  const lengthMm = lengthToMm(wall.length, unit);
  const heightMm = lengthToMm(wall.height, unit);
  const openingsArea = wall.openings.reduce((acc, opening) => {
    const w = lengthToMm(opening.width, unit);
    const h = lengthToMm(opening.height, unit);
    return acc + w * h;
  }, 0);
  const grossArea = lengthMm * heightMm;
  const netArea = Math.max(0, grossArea - openingsArea);
  return {
    area: netArea,
    result: calculateFromSurface({
      surfaceAreaMm2: netArea,
      tile,
      extraPercent,
      pricePerBox,
    }),
  };
}

export function calculateWallWithBoxes(
  wall: WallInput,
  tile: TileSpec,
  extraBoxes: number,
  pricePerBox: number,
  unit: import("@/lib/constants").LengthUnit
): { area: number; result: CalculatorResult } {
  const lengthMm = lengthToMm(wall.length, unit);
  const heightMm = lengthToMm(wall.height, unit);
  const openingsArea = wall.openings.reduce((acc, opening) => {
    const w = lengthToMm(opening.width, unit);
    const h = lengthToMm(opening.height, unit);
    return acc + w * h;
  }, 0);
  const grossArea = lengthMm * heightMm;
  const netArea = Math.max(0, grossArea - openingsArea);
  return {
    area: netArea,
    result: calculateFromSurfaceWithBoxes({
      surfaceAreaMm2: netArea,
      tile,
      extraBoxes,
      pricePerBox,
    }),
  };
}

export function calculateMultipleWalls(
  walls: WallInput[],
  tile: TileSpec,
  extraPercent: number,
  pricePerBox: number,
  unit: import("@/lib/constants").LengthUnit
) {
  return walls.map((wall) => ({
    label: wall.label || "Wall",
    ...calculateWall(wall, tile, extraPercent, pricePerBox, unit),
  }));
}

export function calculateMultipleWallsWithBoxes(
  walls: WallInput[],
  tile: TileSpec,
  extraBoxes: number,
  pricePerBox: number,
  unit: import("@/lib/constants").LengthUnit
) {
  return walls.map((wall) => ({
    label: wall.label || "Wall",
    ...calculateWallWithBoxes(wall, tile, extraBoxes, pricePerBox, unit),
  }));
}

export function totalWallsArea(
  walls: WallInput[],
  unit: import("@/lib/constants").LengthUnit
): number {
  return walls.reduce((acc, wall) => {
    const lengthMm = lengthToMm(wall.length, unit);
    const heightMm = lengthToMm(wall.height, unit);
    const openings = wall.openings.reduce((sum, opening) => {
      const w = lengthToMm(opening.width, unit);
      const h = lengthToMm(opening.height, unit);
      return sum + w * h;
    }, 0);
    return acc + Math.max(0, lengthMm * heightMm - openings);
  }, 0);
}

export function combineResults(
  sections: { label: string; result: CalculatorResult }[],
  tile: TileSpec,
  extraPercent: number,
  pricePerBox: number
): CalculatorResult {
  const totalArea = sections.reduce((acc, s) => acc + s.result.surfaceAreaMm2, 0);
  const tileLengthMm = lengthToMm(tile.length, tile.tileUnit || "mm");
  const tileWidthMm = lengthToMm(tile.width, tile.tileUnit || "mm");
  const tileAreaMm2 = tileLengthMm * tileWidthMm;
  const baseTiles = safeCeil(totalArea / tileAreaMm2);
  const baseBoxes = safeCeil(baseTiles / tile.piecesPerBox);
  const extraTiles = safeCeil(baseTiles * (extraPercent / 100));
  const extraBoxes = safeCeil(extraTiles / tile.piecesPerBox);
  const totalTiles = baseTiles + extraTiles;
  const totalBoxes = safeCeil(totalTiles / tile.piecesPerBox);
  const totalCoverage = totalBoxes * tile.piecesPerBox * tileAreaMm2;
  const wastage = Math.max(0, totalCoverage - totalArea);
  return {
    surfaceAreaMm2: totalArea,
    baseTilesNeeded: baseTiles,
    baseBoxesNeeded: baseBoxes,
    extraTiles,
    extraBoxes,
    totalTiles,
    totalBoxes,
    totalCoverageAreaMm2: totalCoverage,
    wastageAreaMm2: wastage,
    estimatedCost: totalBoxes * pricePerBox,
    hasInputs: totalArea > 0 && tile.length > 0 && tile.width > 0 && tile.piecesPerBox > 0,
    warnings: [],
  };
}

export function percentFromBoxes(
  extraBoxes: number,
  baseTiles: number,
  piecesPerBox: number
): number {
  if (baseTiles <= 0 || piecesPerBox <= 0) return DEFAULT_WASTAGE_PERCENT;
  const percent = (extraBoxes * piecesPerBox / baseTiles) * 100;
  return Number(percent.toFixed(1));
}

export function boxesFromPercent(
  extraPercent: number,
  baseTiles: number,
  piecesPerBox: number
): number {
  if (piecesPerBox <= 0) return 0;
  const extraTiles = safeCeil(baseTiles * (extraPercent / 100));
  return safeCeil(extraTiles / piecesPerBox);
}

export function clampWastage(percent: number): number {
  if (!Number.isFinite(percent)) return DEFAULT_WASTAGE_PERCENT;
  return Math.min(MAX_WASTAGE_PERCENT, Math.max(MIN_WASTAGE_PERCENT, percent));
}

export function productSizeMm2(size: { length: number; width: number; unit: import("@/lib/constants").LengthUnit }) {
  return areaToMm2(1, "mm2") * (lengthToMm(size.length, size.unit) * lengthToMm(size.width, size.unit));
}