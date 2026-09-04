export const APP_NAME = "TileCalc Pro";
export const APP_DESCRIPTION =
  "Tile and marble quantity calculator with a live product catalog synced from Google Sheets.";

export const CANONICAL_UNIT = "mm" as const;
export const LENGTH_UNIT_FACTORS: Record<LengthUnit, number> = {
  mm: 1,
  cm: 10,
  inch: 25.4,
  ft: 304.8,
  m: 1000,
};

export const AREA_UNIT_FACTORS: Record<AreaUnit, number> = {
  mm2: 1,
  cm2: 100,
  inch2: 645.16,
  ft2: 92903.04,
  m2: 1_000_000,
};

export const SIZE_UNITS: LengthUnit[] = ["ft", "m", "inch"];
export const ALL_UNITS: LengthUnit[] = ["ft", "m", "inch", "mm", "cm"];

export const DEFAULT_WASTAGE_PERCENT = 10;
export const MIN_WASTAGE_PERCENT = 0;
export const MAX_WASTAGE_PERCENT = 100;
export const MAX_EXTRA_BOXES = 100;

export const STOCK_ACTIONS = ["Restock", "Sale", "Adjustment", "Return"] as const;
export type StockAction = (typeof STOCK_ACTIONS)[number];

export const STOCK_STATUSES = ["In Stock", "Low Stock", "Out of Stock"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const TILE_SOURCE_MODES = ["manual", "catalog"] as const;
export type TileSourceMode = (typeof TILE_SOURCE_MODES)[number];

export const WASTAGE_TYPES = ["percent", "boxes"] as const;
export type WastageType = (typeof WASTAGE_TYPES)[number];

export const CALCULATOR_SECTIONS = ["floor", "wall", "kitchen", "bathroom"] as const;
export type CalculatorSection = (typeof CALCULATOR_SECTIONS)[number];

export const SHARED_SHEET_IDS = {
  products: "Products",
  stock: "Stock",
  stockHistory: "Stock_History",
  categories: "Categories",
  brands: "Brands",
  types: "Types",
  colorVariants: "Color_Variants",
} as const;

export const CURRENCY = "NPR" as const;
export const CURRENCY_SYMBOL = "NRs." as const;

export type LengthUnit = "ft" | "m" | "inch" | "mm" | "cm";
export type AreaUnit = "mm2" | "cm2" | "inch2" | "ft2" | "m2";