import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { OpeningInput, WallInput } from "@/types/domain";
import {
  DEFAULT_WASTAGE_PERCENT,
  SIZE_UNITS,
  type LengthUnit,
  type TileSourceMode,
  type WastageType,
} from "@/lib/constants";

let wallCounter = 0;
let openingCounter = 0;

function makeId(prefix: string) {
  if (prefix === "wall") {
    wallCounter += 1;
    return `wall-${Date.now()}-${wallCounter}`;
  }
  openingCounter += 1;
  return `opening-${Date.now()}-${openingCounter}`;
}

const initialWall: WallInput = {
  id: makeId("wall"),
  label: "Wall 1",
  length: 0,
  height: 0,
  openings: [],
};

interface TileState {
  length: number;
  width: number;
  piecesPerBox: number;
  pricePerBox: number;
  tileUnit: LengthUnit;
}

interface ExtraState {
  type: WastageType;
  percent: number;
  boxes: number;
}

export interface FloorState {
  length: number;
  width: number;
  tileSource: TileSourceMode;
  tile: TileState;
  selectedSku: string | null;
  extra: ExtraState;
}

export interface WallSectionState {
  walls: WallInput[];
  tileSource: TileSourceMode;
  tile: TileState;
  selectedSku: string | null;
  extra: ExtraState;
}

export interface KitchenState {
  countertopLength: number;
  countertopWidth: number;
  sinkLength: number;
  sinkWidth: number;
  includeBacksplash: boolean;
  backsplashLength: number;
  backsplashHeight: number;
  countertopTile: TileState;
  countertopSource: TileSourceMode;
  countertopSku: string | null;
  backsplashTile: TileState;
  backsplashSource: TileSourceMode;
  backsplashSku: string | null;
  extra: ExtraState;
}

export interface BathroomState extends WallSectionState {
  floorLength: number;
  floorWidth: number;
  floorTile: TileState;
  floorSource: TileSourceMode;
  floorSku: string | null;
}

export interface CalculatorState {
  unit: LengthUnit;
  floor: FloorState;
  wall: WallSectionState;
  kitchen: KitchenState;
  bathroom: BathroomState;
}

const emptyTile: TileState = {
  length: 0,
  width: 0,
  piecesPerBox: 1,
  pricePerBox: 0,
  tileUnit: "ft",
};

const emptyExtra: ExtraState = {
  type: "percent",
  percent: DEFAULT_WASTAGE_PERCENT,
  boxes: 0,
};

const initialState: CalculatorState = {
  unit: "ft",
  floor: {
    length: 0,
    width: 0,
    tileSource: "manual",
    tile: { ...emptyTile, tileUnit: "ft" },
    selectedSku: null,
    extra: { ...emptyExtra },
  },
  wall: {
    walls: [initialWall],
    tileSource: "manual",
    tile: { ...emptyTile, tileUnit: "ft" },
    selectedSku: null,
    extra: { ...emptyExtra },
  },
  kitchen: {
    countertopLength: 0,
    countertopWidth: 0,
    sinkLength: 0,
    sinkWidth: 0,
    includeBacksplash: false,
    backsplashLength: 0,
    backsplashHeight: 0,
    countertopTile: { ...emptyTile, tileUnit: "ft" },
    countertopSource: "manual",
    countertopSku: null,
    backsplashTile: { ...emptyTile, tileUnit: "ft" },
    backsplashSource: "manual",
    backsplashSku: null,
    extra: { ...emptyExtra },
  },
  bathroom: {
    floorLength: 0,
    floorWidth: 0,
    floorTile: { ...emptyTile, tileUnit: "ft" },
    floorSource: "manual",
    floorSku: null,
    walls: [makeId("wall")].map((id) => ({ id, label: "Wall 1", length: 0, height: 0, openings: [] })),
    tileSource: "manual",
    tile: { ...emptyTile, tileUnit: "ft" },
    selectedSku: null,
    extra: { ...emptyExtra },
  },
};

const calculatorSlice = createSlice({
  name: "calculator",
  initialState,
  reducers: {
    setUnit(state, action: PayloadAction<LengthUnit>) {
      if (SIZE_UNITS.includes(action.payload)) {
        const newUnit = action.payload;
        state.unit = newUnit;
        if (state.floor.tileSource === "manual" && !state.floor.selectedSku) {
          state.floor.tile.tileUnit = newUnit;
        }
        if (state.wall.tileSource === "manual" && !state.wall.selectedSku) {
          state.wall.tile.tileUnit = newUnit;
        }
        if (state.kitchen.countertopSource === "manual" && !state.kitchen.countertopSku) {
          state.kitchen.countertopTile.tileUnit = newUnit;
        }
        if (state.kitchen.backsplashSource === "manual" && !state.kitchen.backsplashSku) {
          state.kitchen.backsplashTile.tileUnit = newUnit;
        }
        if (state.bathroom.floorSource === "manual" && !state.bathroom.floorSku) {
          state.bathroom.floorTile.tileUnit = newUnit;
        }
        if (state.bathroom.tileSource === "manual" && !state.bathroom.selectedSku) {
          state.bathroom.tile.tileUnit = newUnit;
        }
      }
    },
    resetFloor(state) {
      state.floor = { ...initialState.floor, tile: { ...emptyTile, tileUnit: state.unit }, extra: { ...emptyExtra } };
    },
    resetWall(state) {
      state.wall = {
        ...initialState.wall,
        tile: { ...emptyTile, tileUnit: state.unit },
        extra: { ...emptyExtra },
        walls: [makeId("wall")].map((id) => ({ id, label: "Wall 1", length: 0, height: 0, openings: [] })),
      };
    },
    resetKitchen(state) {
      state.kitchen = {
        ...initialState.kitchen,
        countertopTile: { ...emptyTile, tileUnit: state.unit },
        backsplashTile: { ...emptyTile, tileUnit: state.unit },
        extra: { ...emptyExtra },
      };
    },
    resetBathroom(state) {
      state.bathroom = {
        ...initialState.bathroom,
        floorTile: { ...emptyTile, tileUnit: state.unit },
        tile: { ...emptyTile, tileUnit: state.unit },
        walls: [makeId("wall")].map((id) => ({ id, label: "Wall 1", length: 0, height: 0, openings: [] })),
        extra: { ...emptyExtra },
      };
    },
    setFloorField(state, action: PayloadAction<Partial<FloorState>>) {
      state.floor = { ...state.floor, ...action.payload };
    },
    setWallSectionField(state, action: PayloadAction<Partial<WallSectionState>>) {
      state.wall = { ...state.wall, ...action.payload };
    },
    setKitchenField(state, action: PayloadAction<Partial<KitchenState>>) {
      state.kitchen = { ...state.kitchen, ...action.payload };
    },
    setBathroomField(state, action: PayloadAction<Partial<BathroomState>>) {
      state.bathroom = { ...state.bathroom, ...action.payload };
    },
    addWall(state, action: PayloadAction<{ section: "wall" | "bathroom" }>) {
      const target = action.payload.section === "wall" ? state.wall : state.bathroom;
      const nextNumber = target.walls.length + 1;
      target.walls.push({
        id: makeId("wall"),
        label: `Wall ${nextNumber}`,
        length: 0,
        height: 0,
        openings: [],
      });
    },
    removeWall(state, action: PayloadAction<{ section: "wall" | "bathroom"; id: string }>) {
      const target = action.payload.section === "wall" ? state.wall : state.bathroom;
      target.walls = target.walls.filter((w) => w.id !== action.payload.id);
      if (target.walls.length === 0) {
        target.walls.push({
          id: makeId("wall"),
          label: "Wall 1",
          length: 0,
          height: 0,
          openings: [],
        });
      }
    },
    updateWall(
      state,
      action: PayloadAction<{ section: "wall" | "bathroom"; id: string; patch: Partial<WallInput> }>
    ) {
      const target = action.payload.section === "wall" ? state.wall : state.bathroom;
      const wall = target.walls.find((w) => w.id === action.payload.id);
      if (wall) Object.assign(wall, action.payload.patch);
    },
    addOpening(state, action: PayloadAction<{ section: "wall" | "bathroom"; wallId: string }>) {
      const target = action.payload.section === "wall" ? state.wall : state.bathroom;
      const wall = target.walls.find((w) => w.id === action.payload.wallId);
      if (wall) {
        const next = wall.openings.length + 1;
        const opening: OpeningInput = {
          id: makeId("opening"),
          label: `Opening ${next}`,
          width: 0,
          height: 0,
        };
        wall.openings.push(opening);
      }
    },
    removeOpening(
      state,
      action: PayloadAction<{ section: "wall" | "bathroom"; wallId: string; openingId: string }>
    ) {
      const target = action.payload.section === "wall" ? state.wall : state.bathroom;
      const wall = target.walls.find((w) => w.id === action.payload.wallId);
      if (wall) {
        wall.openings = wall.openings.filter((o) => o.id !== action.payload.openingId);
      }
    },
    updateOpening(
      state,
      action: PayloadAction<{
        section: "wall" | "bathroom";
        wallId: string;
        openingId: string;
        patch: Partial<OpeningInput>;
      }>
    ) {
      const target = action.payload.section === "wall" ? state.wall : state.bathroom;
      const wall = target.walls.find((w) => w.id === action.payload.wallId);
      if (wall) {
        const opening = wall.openings.find((o) => o.id === action.payload.openingId);
        if (opening) Object.assign(opening, action.payload.patch);
      }
    },
    setExtraType(
      state,
      action: PayloadAction<{ section: keyof Pick<CalculatorState, "floor" | "wall" | "kitchen" | "bathroom">; type: WastageType }>
    ) {
      const { section, type } = action.payload;
      const target = state[section] as { extra: ExtraState };
      target.extra.type = type;
    },
    setExtraPercent(
      state,
      action: PayloadAction<{ section: keyof Pick<CalculatorState, "floor" | "wall" | "kitchen" | "bathroom">; value: number }>
    ) {
      const { section, value } = action.payload;
      const target = state[section] as { extra: ExtraState };
      target.extra.percent = Math.max(0, Math.min(100, value));
      target.extra.type = "percent";
    },
    setExtraBoxes(
      state,
      action: PayloadAction<{ section: keyof Pick<CalculatorState, "floor" | "wall" | "kitchen" | "bathroom">; value: number }>
    ) {
      const { section, value } = action.payload;
      const target = state[section] as { extra: ExtraState };
      target.extra.boxes = Math.max(0, value);
      target.extra.type = "boxes";
    },
    selectCatalogTile(
      state,
      action: PayloadAction<{
        section: "floor" | "wall" | "bathroom";
        target: "main" | "floor";
        productId?: string | null;
        sku?: string | null;
        tile: { length: number; width: number; piecesPerBox: number; pricePerBox: number; tileUnit: LengthUnit };
      }>
    ) {
      const { section, target: tileKey, tile } = action.payload;
      const targetId = action.payload.productId !== undefined ? action.payload.productId : action.payload.sku ?? null;
      if (section === "floor") {
        state.floor.tile = tile;
        state.floor.selectedSku = targetId;
        state.floor.tileSource = targetId ? "catalog" : "manual";
      } else if (section === "wall") {
        state.wall.tile = tile;
        state.wall.selectedSku = targetId;
        state.wall.tileSource = targetId ? "catalog" : "manual";
      } else if (section === "bathroom") {
        if (tileKey === "floor") {
          state.bathroom.floorTile = tile;
          state.bathroom.floorSku = targetId;
          state.bathroom.floorSource = targetId ? "catalog" : "manual";
        } else {
          state.bathroom.tile = tile;
          state.bathroom.selectedSku = targetId;
          state.bathroom.tileSource = targetId ? "catalog" : "manual";
        }
      }
    },
    selectKitchenCatalogTile(
      state,
      action: PayloadAction<{
        surface: "countertop" | "backsplash";
        productId?: string | null;
        sku?: string | null;
        tile: { length: number; width: number; piecesPerBox: number; pricePerBox: number; tileUnit: LengthUnit };
      }>
    ) {
      const { surface, tile } = action.payload;
      const targetId = action.payload.productId !== undefined ? action.payload.productId : action.payload.sku ?? null;
      if (surface === "countertop") {
        state.kitchen.countertopTile = tile;
        state.kitchen.countertopSku = targetId;
        state.kitchen.countertopSource = targetId ? "catalog" : "manual";
      } else {
        state.kitchen.backsplashTile = tile;
        state.kitchen.backsplashSku = targetId;
        state.kitchen.backsplashSource = targetId ? "catalog" : "manual";
      }
    },
    setFloorTileSource(state, action: PayloadAction<TileSourceMode>) {
      state.floor.tileSource = action.payload;
    },
    setWallTileSource(state, action: PayloadAction<TileSourceMode>) {
      state.wall.tileSource = action.payload;
    },
    setBathroomFloorTileSource(state, action: PayloadAction<TileSourceMode>) {
      state.bathroom.floorSource = action.payload;
    },
    setBathroomWallTileSource(state, action: PayloadAction<TileSourceMode>) {
      state.bathroom.tileSource = action.payload;
    },
    setKitchenCountertopSource(state, action: PayloadAction<TileSourceMode>) {
      state.kitchen.countertopSource = action.payload;
    },
    setKitchenBacksplashSource(state, action: PayloadAction<TileSourceMode>) {
      state.kitchen.backsplashSource = action.payload;
    },
  },
});

export const {
  setUnit,
  resetFloor,
  resetWall,
  resetKitchen,
  resetBathroom,
  setFloorField,
  setWallSectionField,
  setKitchenField,
  setBathroomField,
  addWall,
  removeWall,
  updateWall,
  addOpening,
  removeOpening,
  updateOpening,
  setExtraType,
  setExtraPercent,
  setExtraBoxes,
  selectCatalogTile,
  selectKitchenCatalogTile,
  setFloorTileSource,
  setWallTileSource,
  setBathroomFloorTileSource,
  setBathroomWallTileSource,
  setKitchenCountertopSource,
  setKitchenBacksplashSource,
} = calculatorSlice.actions;

export default calculatorSlice.reducer;