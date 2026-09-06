import type {
  LengthUnit,
  StockAction,
  StockStatus,
  TileSourceMode,
  WastageType,
} from "@/lib/constants";

export type {
  LengthUnit,
  StockAction,
  StockStatus,
  TileSourceMode,
  WastageType,
};

export interface Product {
  productId: string;
  sku?: string; // alias for compatibility
  productName: string;
  type: string;
  brand: string;
  length: number;
  width: number;
  sizeUnit: LengthUnit;
  colorVariant: string;
  piecesPerBox: number;
  pricePerBox: number;
  notes?: string;
}

export interface Stock {
  productId: string;
  sku?: string; // alias for compatibility
  stockBoxes: number;
  minimumBoxes: number;
  stockStatus: StockStatus;
  lastUpdated: string;
}

export interface StockHistoryEntry {
  date: string;
  productId: string;
  sku?: string; // alias for compatibility
  action: StockAction;
  quantityBoxes?: number;
  quantityPieces?: number;
  quantity: number; // total boxes (e.g. 2.4)
  previousStock: number;
  newStock: number;
  reason?: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface ProductType {
  id: string;
  name: string;
}

export interface ColorVariant {
  id: string;
  name: string;
}

export interface ItemCategory {
  id: string;
  name: string;
}

export type ItemUnit =
  | "Piece"
  | "Bag"
  | "Tube"
  | "Liter"
  | "Roll"
  | "Kg"
  | "Box"
  | "Set"
  | "Meter"
  | "Pair";

export const ITEM_UNITS: ItemUnit[] = [
  "Piece",
  "Bag",
  "Tube",
  "Liter",
  "Roll",
  "Kg",
  "Box",
  "Set",
  "Meter",
  "Pair",
];

export interface Item {
  itemId: string;
  name: string;
  category: string;
  brand: string;
  unit: ItemUnit | string;
  pricePerUnit: number;
  stockQty: number;
  minStock: number;
  stockStatus: StockStatus;
  notes?: string;
}

export interface CreateItemPayload {
  itemId: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  pricePerUnit: number;
  initialStockQty?: number;
  minStock?: number;
  notes?: string;
}

export interface UpdateItemPayload {
  itemId: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  pricePerUnit: number;
  minStock?: number;
  notes?: string;
}

export interface DeleteItemPayload {
  itemId: string;
}

export interface WallInput {
  id: string;
  label: string;
  length: number;
  height: number;
  openings: OpeningInput[];
}

export interface OpeningInput {
  id: string;
  label: string;
  width: number;
  height: number;
}

export interface TileSpec {
  length: number;
  width: number;
  piecesPerBox: number;
  pricePerBox: number;
  tileUnit: LengthUnit;
  productId?: string;
  sku?: string;
  name?: string;
}

export interface CalculatorResult {
  surfaceAreaMm2: number;
  baseTilesNeeded: number;
  baseBoxesNeeded: number;
  extraTiles: number;
  extraBoxes: number;
  totalTiles: number;
  totalBoxes: number;
  totalCoverageAreaMm2: number;
  wastageAreaMm2: number;
  estimatedCost: number;
  hasInputs: boolean;
  warnings: string[];
}

export interface MultiSectionResult {
  sections: Array<{
    label: string;
    result: CalculatorResult;
  }>;
  combined: CalculatorResult;
}

export interface CatalogFilters {
  search: string;
  types: string[];
  brands: string[];
  colorVariants: string[];
  minPrice: number | null;
  maxPrice: number | null;
}

export interface CreateProductPayload {
  productId: string;
  productName: string;
  type: string;
  brand: string;
  length: number;
  width: number;
  sizeUnit: LengthUnit;
  piecesPerBox: number;
  pricePerBox: number;
  colorVariant?: string;
  notes?: string;
  initialStockBoxes?: number;
  minimumBoxes?: number;
}

export interface UpdateProductPayload {
  productId: string;
  productName: string;
  type: string;
  brand: string;
  length: number;
  width: number;
  sizeUnit: LengthUnit;
  piecesPerBox: number;
  pricePerBox: number;
  colorVariant?: string;
  notes?: string;
}

export interface DeleteProductPayload {
  productId: string;
}

export interface StockUpdatePayload {
  productId?: string;
  sku?: string;
  action: StockAction;
  quantityBoxes?: number;
  quantityPieces?: number;
  quantity?: number;
  notes?: string;
}

export interface StockUpdateResponse {
  stock: Stock;
  history: StockHistoryEntry;
}

export type TileSourceModeValue = TileSourceMode;
