import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import {
  boxesFromPercent,
  calculateFromSurface,
  calculateFromSurfaceWithBoxes,
  calculateMultipleWalls,
  calculateMultipleWallsWithBoxes,
  calculateRoom,
  calculateRoomWithBoxes,
  percentFromBoxes,
  totalWallsArea,
} from "../lib/formulas";
import type { CalculatorResult, TileSpec } from "@/types/domain";
import type { LengthUnit, WastageType } from "@/lib/constants";

const selectCalculatorState = (state: RootState) => state.calculator;

export const selectUnit = createSelector(selectCalculatorState, (c) => c.unit);

export const selectFloorInputs = createSelector(selectCalculatorState, (c) => c.floor);
export const selectWallInputs = createSelector(selectCalculatorState, (c) => c.wall);
export const selectKitchenInputs = createSelector(selectCalculatorState, (c) => c.kitchen);
export const selectBathroomInputs = createSelector(selectCalculatorState, (c) => c.bathroom);

function lengthToMmFactor(unit: LengthUnit): number {
  switch (unit) {
    case "mm":
      return 1;
    case "cm":
      return 10;
    case "inch":
      return 25.4;
    case "ft":
      return 304.8;
    case "m":
      return 1000;
  }
}

function getExtraValue(extra: { type: WastageType; percent: number; boxes: number }): { percent: number; boxes: number } {
  return { percent: extra.percent, boxes: extra.boxes };
}

function tileSpecFromState(tile: { length: number; width: number; piecesPerBox: number; pricePerBox: number; tileUnit: LengthUnit }): TileSpec {
  return {
    length: tile.length,
    width: tile.width,
    piecesPerBox: tile.piecesPerBox,
    pricePerBox: tile.pricePerBox,
    tileUnit: tile.tileUnit,
  };
}

function pricePerBoxFromTile(tile: { pricePerBox: number }): number {
  return tile.pricePerBox;
}

function extraPercentValue(extra: { type: WastageType; percent: number; boxes: number }): number {
  return extra.type === "percent" ? extra.percent : 0;
}

function extraBoxesValue(extra: { type: WastageType; percent: number; boxes: number }): number {
  return extra.type === "boxes" ? extra.boxes : 0;
}

export const selectFloorResult = createSelector(
  [selectFloorInputs, selectUnit],
  (floor, unit) => {
    const tile = tileSpecFromState(floor.tile);
    const pricePerBox = pricePerBoxFromTile(floor.tile);
    const extraPercent = extraPercentValue(floor.extra);
    const extraBoxes = extraBoxesValue(floor.extra);

    if (floor.extra.type === "boxes") {
      return calculateRoomWithBoxes({
        length: floor.length,
        width: floor.width,
        tile,
        extraBoxes,
        pricePerBox,
        unit,
      });
    }

    return calculateRoom({
      length: floor.length,
      width: floor.width,
      tile,
      extraPercent,
      pricePerBox,
      unit,
    });
  }
);

export const selectWallResult = createSelector([selectWallInputs, selectUnit], (wall, unit) => {
  const tile = tileSpecFromState(wall.tile);
  const pricePerBox = pricePerBoxFromTile(wall.tile);
  const extraPercent = extraPercentValue(wall.extra);
  const extraBoxes = extraBoxesValue(wall.extra);

  if (wall.extra.type === "boxes") {
    const wallResults = calculateMultipleWallsWithBoxes(
      wall.walls,
      tile,
      extraBoxes,
      pricePerBox,
      unit
    );
    const combinedArea = totalWallsArea(wall.walls, unit);
    const combinedResult = calculateFromSurfaceWithBoxes({
      surfaceAreaMm2: combinedArea,
      tile,
      extraBoxes,
      pricePerBox,
    });
    return {
      sections: wallResults.map((section) => ({
        label: section.label,
        area: section.area,
        result: section.result,
      })),
      combined: combinedResult,
    };
  }

  const wallResults = calculateMultipleWalls(
    wall.walls,
    tile,
    extraPercent,
    pricePerBox,
    unit
  );
  const combinedArea = totalWallsArea(wall.walls, unit);
  const combinedResult = calculateFromSurface({
    surfaceAreaMm2: combinedArea,
    tile,
    extraPercent,
    pricePerBox,
  });
  return {
    sections: wallResults.map((section) => ({
      label: section.label,
      area: section.area,
      result: section.result,
    })),
    combined: combinedResult,
  };
});

export const selectKitchenResult = createSelector(
  [selectKitchenInputs, selectUnit],
  (kitchen, unit) => {
    const factor = lengthToMmFactor(unit);
    const countertopLengthMm = kitchen.countertopLength * factor;
    const countertopWidthMm = kitchen.countertopWidth * factor;
    const sinkLengthMm = kitchen.sinkLength * factor;
    const sinkWidthMm = kitchen.sinkWidth * factor;
    const countertopAreaMm2 = Math.max(0, countertopLengthMm * countertopWidthMm - sinkLengthMm * sinkWidthMm);
    const backsplashAreaMm2 = kitchen.includeBacksplash
      ? kitchen.backsplashLength * factor * (kitchen.backsplashHeight * factor)
      : 0;
    const countertopTile = tileSpecFromState(kitchen.countertopTile);
    const backsplashTile = tileSpecFromState(kitchen.backsplashTile);
    const countertopPricePerBox = pricePerBoxFromTile(kitchen.countertopTile);
    const backsplashPricePerBox = pricePerBoxFromTile(kitchen.backsplashTile);
    const extraPercent = extraPercentValue(kitchen.extra);
    const extraBoxes = extraBoxesValue(kitchen.extra);

    const calculateSection = (areaMm2: number, tile: TileSpec, pricePerBox: number) => {
      if (kitchen.extra.type === "boxes") {
        return calculateFromSurfaceWithBoxes({
          surfaceAreaMm2: areaMm2,
          tile,
          extraBoxes,
          pricePerBox,
        });
      }
      return calculateFromSurface({
        surfaceAreaMm2: areaMm2,
        tile,
        extraPercent,
        pricePerBox,
      });
    };

    const countertopResult = calculateSection(countertopAreaMm2, countertopTile, countertopPricePerBox);
    const backsplashResult = kitchen.includeBacksplash
      ? calculateSection(backsplashAreaMm2, backsplashTile, backsplashPricePerBox)
      : null;
    const sections: Array<{ label: string; result: CalculatorResult; tile: TileSpec }> = [
      { label: "Countertop", result: countertopResult, tile: countertopTile },
    ];
    if (backsplashResult) {
      sections.push({ label: "Backsplash", result: backsplashResult, tile: backsplashTile });
    }
    const totalArea = sections.reduce((acc, s) => acc + s.result.surfaceAreaMm2, 0);
    const totalCoverage = sections.reduce((acc, s) => acc + s.result.totalCoverageAreaMm2, 0);
    const wastage = Math.max(0, totalCoverage - totalArea);
    const hasInputs = sections.some((s) => s.result.hasInputs);
    const combined: CalculatorResult = {
      surfaceAreaMm2: totalArea,
      baseTilesNeeded: sections.reduce((acc, s) => acc + s.result.baseTilesNeeded, 0),
      baseBoxesNeeded: sections.reduce((acc, s) => acc + s.result.baseBoxesNeeded, 0),
      extraTiles: sections.reduce((acc, s) => acc + s.result.extraTiles, 0),
      extraBoxes: sections.reduce((acc, s) => acc + s.result.extraBoxes, 0),
      totalTiles: sections.reduce((acc, s) => acc + s.result.totalTiles, 0),
      totalBoxes: sections.reduce((acc, s) => acc + s.result.totalBoxes, 0),
      totalCoverageAreaMm2: totalCoverage,
      wastageAreaMm2: wastage,
      estimatedCost: sections.reduce((acc, s) => acc + s.result.estimatedCost, 0),
      hasInputs,
      warnings: [],
    };
    return { sections, combined };
  }
);

export const selectBathroomResult = createSelector(
  [selectBathroomInputs, selectUnit],
  (bathroom, unit) => {
    const floorTile = tileSpecFromState(bathroom.floorTile);
    const wallTile = tileSpecFromState(bathroom.tile);
    const floorPricePerBox = pricePerBoxFromTile(bathroom.floorTile);
    const wallPricePerBox = pricePerBoxFromTile(bathroom.tile);
    const extraPercent = extraPercentValue(bathroom.extra);
    const extraBoxes = extraBoxesValue(bathroom.extra);

    const calculateFloor = () => {
      if (bathroom.extra.type === "boxes") {
        return calculateRoomWithBoxes({
          length: bathroom.floorLength,
          width: bathroom.floorWidth,
          tile: floorTile,
          extraBoxes,
          pricePerBox: floorPricePerBox,
          unit,
        });
      }
      return calculateRoom({
        length: bathroom.floorLength,
        width: bathroom.floorWidth,
        tile: floorTile,
        extraPercent,
        pricePerBox: floorPricePerBox,
        unit,
      });
    };

    const calculateWalls = () => {
      if (bathroom.extra.type === "boxes") {
        const wallResults = calculateMultipleWallsWithBoxes(
          bathroom.walls,
          wallTile,
          extraBoxes,
          wallPricePerBox,
          unit
        );
        const combinedArea = totalWallsArea(bathroom.walls, unit);
        const combinedResult = calculateFromSurfaceWithBoxes({
          surfaceAreaMm2: combinedArea,
          tile: wallTile,
          extraBoxes,
          pricePerBox: wallPricePerBox,
        });
        return { wallResults, combinedResult };
      }
      const wallResults = calculateMultipleWalls(
        bathroom.walls,
        wallTile,
        extraPercent,
        wallPricePerBox,
        unit
      );
      const combinedArea = totalWallsArea(bathroom.walls, unit);
      const combinedResult = calculateFromSurface({
        surfaceAreaMm2: combinedArea,
        tile: wallTile,
        extraPercent,
        pricePerBox: wallPricePerBox,
      });
      return { wallResults, combinedResult };
    };

    const floorResult = calculateFloor();
    const { wallResults, combinedResult: wallCombined } = calculateWalls();

    const sections: Array<{ label: string; result: CalculatorResult; tile: TileSpec }> = [
      { label: "Floor", result: floorResult, tile: floorTile },
      ...wallResults.map((w) => ({ label: w.label, result: w.result, tile: wallTile })),
    ];
    const totalArea = floorResult.surfaceAreaMm2 + wallCombined.surfaceAreaMm2;
    const totalCoverage = floorResult.totalCoverageAreaMm2 + wallCombined.totalCoverageAreaMm2;
    const wastage = Math.max(0, totalCoverage - totalArea);
    const hasInputs = floorResult.hasInputs || wallCombined.hasInputs;
    const combined: CalculatorResult = {
      surfaceAreaMm2: totalArea,
      baseTilesNeeded: floorResult.baseTilesNeeded + wallCombined.baseTilesNeeded,
      baseBoxesNeeded: floorResult.baseBoxesNeeded + wallCombined.baseBoxesNeeded,
      extraTiles: floorResult.extraTiles + wallCombined.extraTiles,
      extraBoxes: floorResult.extraBoxes + wallCombined.extraBoxes,
      totalTiles: floorResult.totalTiles + wallCombined.totalTiles,
      totalBoxes: floorResult.totalBoxes + wallCombined.totalBoxes,
      totalCoverageAreaMm2: totalCoverage,
      wastageAreaMm2: wastage,
      estimatedCost: floorResult.estimatedCost + wallCombined.estimatedCost,
      hasInputs,
      warnings: [...floorResult.warnings, ...wallCombined.warnings],
    };
    return { floor: floorResult, wall: wallResults, wallCombined, combined };
  }
);

export function backSyncPercent(
  baseTiles: number,
  piecesPerBox: number,
  boxes: number
): number {
  return percentFromBoxes(boxes, baseTiles, piecesPerBox);
}