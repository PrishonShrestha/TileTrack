import "server-only";
import { google } from "googleapis";
import type {
  Product,
  Stock,
  StockHistoryEntry,
  Category,
  Brand,
  ProductType,
  ColorVariant,
} from "@/types/domain";
import {
  safeNumber,
  safeString,
} from "@/lib/utils";
import {
  SHARED_SHEET_IDS,
  type LengthUnit,
} from "@/lib/constants";

const PRODUCTS_HEADERS = [
  "Product_ID",
  "Product_Name",
  "Type",
  "Brand",
  "Length",
  "Width",
  "Size_Unit",
  "Pieces_Per_Box",
  "Price_Per_Box",
  "Color_Variant",
  "Notes",
] as const;

const STOCK_HEADERS = [
  "Product_ID",
  "Stock_Boxes",
  "Minimum_Boxes",
  "Stock_Status",
  "Last_Updated",
] as const;

const STOCK_HISTORY_HEADERS = [
  "Date",
  "Product_ID",
  "Action",
  "Quantity_Boxes",
  "Quantity_Pieces",
  "Quantity",
  "Previous_Stock",
  "New_Stock",
  "Reason",
  "Notes",
] as const;

const CATEGORIES_HEADERS = ["ID", "Name"] as const;
const BRANDS_HEADERS = ["ID", "Name"] as const;
const TYPES_HEADERS = ["ID", "Name"] as const;
const COLOR_VARIANTS_HEADERS = ["ID", "Name"] as const;

const VALID_SIZE_UNITS: LengthUnit[] = ["ft", "m", "inch", "mm", "cm"];

function parseSizeUnit(raw: unknown): LengthUnit {
  const clean = safeString(raw, "ft").trim().toLowerCase();
  if (clean === "mm" || clean === "millimeter" || clean === "millimeters") return "mm";
  if (clean === "cm" || clean === "centimeter" || clean === "centimeters") return "cm";
  if (clean === "in" || clean === "inch" || clean === "inches" || clean === '"') return "inch";
  if (clean === "ft" || clean === "feet" || clean === "foot" || clean === "'") return "ft";
  if (clean === "m" || clean === "meter" || clean === "meters") return "m";
  return "ft";
}

let cachedClient: InstanceType<typeof google.auth.GoogleAuth> | null = null;

function hasServiceAccount(): boolean {
  const id = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!id || !email || !key) return false;
  // Treat placeholder values as "not configured"
  if (id.includes("your-google-sheet-id") || email.includes("service-account@") || key.includes("YOUR_KEY_HERE")) {
    return false;
  }
  return true;
}

function getAuthClient() {
  if (cachedClient) return cachedClient;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) {
    throw new Error(
      "Missing Google service account credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY."
    );
  }
  cachedClient = new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: privateKey,
    },
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/spreadsheets",
    ],
  });
  return cachedClient;
}

function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: "v4", auth });
}

function getSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) {
    throw new Error(
      "GOOGLE_SHEET_ID is not set. Add it to .env.local. See .env.example for the format."
    );
  }
  return id;
}

interface RawRow {
  [key: string]: string;
}

function parseRowToObject(headerRow: unknown[], rowValues: unknown[]): RawRow {
  const obj: RawRow = {};
  headerRow.forEach((header, idx) => {
    const rawKey = String(header ?? "").trim();
    if (!rawKey) return;
    const cellValue = rowValues[idx] == null ? "" : String(rowValues[idx]).trim();
    
    // 1. Raw exact key
    obj[rawKey] = cellValue;
    
    // 2. Lowercase key
    const lowerKey = rawKey.toLowerCase();
    obj[lowerKey] = cellValue;
    
    // 3. Snake case key (e.g. "Brand Name" -> "brand_name")
    const snakeKey = lowerKey.replace(/[\s-]+/g, "_");
    obj[snakeKey] = cellValue;

    // 4. Clean alphanumeric key (e.g. "Brand_Name" -> "brandname")
    const cleanKey = lowerKey.replace(/[^a-z0-9]/g, "");
    obj[cleanKey] = cellValue;
  });
  return obj;
}

function rowsToObjects(values: unknown[][] | undefined, _headers: readonly string[]): RawRow[] {
  if (!values || values.length === 0) return [];
  const [headerRow, ...dataRows] = values;
  if (!headerRow || dataRows.length === 0) return [];
  
  return dataRows
    .map((row) => parseRowToObject(headerRow, row))
    .filter((obj) => Object.values(obj).some((v) => v.trim() !== ""));
}

function parseProduct(row: RawRow): Product | null {
  const productId =
    safeString(row.Product_ID) ||
    safeString(row.product_id) ||
    safeString(row.ProductID) ||
    safeString(row.SKU) ||
    safeString(row.sku);
  const productName = safeString(row.Product_Name) || safeString(row.product_name) || safeString(row.Name);
  if (!productId || !productName) return null;
  const sizeUnit = parseSizeUnit(row.Size_Unit || row.size_unit);
  const colorVariant =
    safeString(row.Color_Variant) ||
    safeString(row["Color-Variant"]) ||
    safeString(row["Color-varient"]) ||
    safeString(row.color_variant) ||
    safeString(row["color-variant"]) ||
    safeString(row["color_varient"]) ||
    safeString(row.Color) ||
    safeString(row.color);
  return {
    productId,
    sku: productId,
    productName,
    type: safeString(row.Type) || safeString(row.type),
    brand: safeString(row.Brand) || safeString(row.brand),
    length: safeNumber(row.Length ?? row.length),
    width: safeNumber(row.Width ?? row.width),
    sizeUnit,
    colorVariant,
    piecesPerBox: safeNumber(row.Pieces_Per_Box ?? row.pieces_per_box, 1),
    pricePerBox: safeNumber(row.Price_Per_Box ?? row.price_per_box),
    notes: safeString(row.Notes ?? row.notes) || undefined,
  };
}

function parseStock(row: RawRow): Stock | null {
  const productId =
    safeString(row.Product_ID) ||
    safeString(row.product_id) ||
    safeString(row.ProductID) ||
    safeString(row.SKU) ||
    safeString(row.sku);
  if (!productId) return null;
  const stockBoxes = safeNumber(row.Stock_Boxes ?? row.stock_boxes);
  const minimumBoxes = safeNumber(row.Minimum_Boxes ?? row.minimum_boxes);
  const rawStatus = safeString(row.Stock_Status ?? row.stock_status);
  const status: Stock["stockStatus"] = (["In Stock", "Low Stock", "Out of Stock"] as const).includes(
    rawStatus as Stock["stockStatus"]
  )
    ? (rawStatus as Stock["stockStatus"])
    : computeStockStatus(stockBoxes, minimumBoxes);
  return {
    productId,
    sku: productId,
    stockBoxes,
    minimumBoxes,
    stockStatus: status,
    lastUpdated: safeString(row.Last_Updated ?? row.last_updated) || new Date().toISOString(),
  };
}

function parseStockHistory(row: RawRow): StockHistoryEntry | null {
  const productId =
    safeString(row.Product_ID) ||
    safeString(row.product_id) ||
    safeString(row.ProductID) ||
    safeString(row.SKU) ||
    safeString(row.sku);
  if (!productId) return null;
  const action = safeString(row.Action || row.action);
  if (!action) return null;
  const quantityBoxes = safeNumber(row.Quantity_Boxes ?? row.quantity_boxes, safeNumber(row.Quantity ?? row.quantity));
  const quantityPieces = safeNumber(row.Quantity_Pieces ?? row.quantity_pieces, 0);
  const quantity = safeNumber(row.Quantity ?? row.quantity, quantityBoxes);
  return {
    date: safeString(row.Date ?? row.date) || new Date().toISOString(),
    productId,
    sku: productId,
    action: action as StockHistoryEntry["action"],
    quantityBoxes,
    quantityPieces,
    quantity,
    previousStock: safeNumber(row.Previous_Stock ?? row.previous_stock),
    newStock: safeNumber(row.New_Stock ?? row.new_stock),
    reason: safeString(row.Reason ?? row.reason) || undefined,
    notes: safeString(row.Notes ?? row.notes) || undefined,
  };
}

function parseCategory(row: RawRow): Category | null {
  const name =
    safeString(row.Category_Name) ||
    safeString(row.category_name) ||
    safeString(row.Category) ||
    safeString(row.category) ||
    safeString(row.Name) ||
    safeString(row.name) ||
    safeString(row.Title) ||
    safeString(row.title);
  if (!name) {
    const fallback = safeString(row.ID) || safeString(row.id);
    if (!fallback) return null;
    return { id: fallback, name: fallback };
  }
  const id =
    safeString(row.Category_ID) ||
    safeString(row.category_id) ||
    safeString(row.ID) ||
    safeString(row.id) ||
    name;
  return { id, name };
}

function parseBrand(row: RawRow): Brand | null {
  const name =
    safeString(row.Brand_Name) ||
    safeString(row.brand_name) ||
    safeString(row.BrandName) ||
    safeString(row.brandname) ||
    safeString(row.Brand) ||
    safeString(row.brand) ||
    safeString(row.Name) ||
    safeString(row.name) ||
    safeString(row.Title) ||
    safeString(row.title);
  if (!name) {
    const fallback = safeString(row.ID) || safeString(row.id);
    if (!fallback) return null;
    return { id: fallback, name: fallback };
  }
  const id =
    safeString(row.Brand_ID) ||
    safeString(row.brand_id) ||
    safeString(row.ID) ||
    safeString(row.id) ||
    name;
  return { id, name };
}

function parseType(row: RawRow): ProductType | null {
  const name =
    safeString(row.Type_Name) ||
    safeString(row.type_name) ||
    safeString(row.TypeName) ||
    safeString(row.typename) ||
    safeString(row.Type) ||
    safeString(row.type) ||
    safeString(row.Name) ||
    safeString(row.name) ||
    safeString(row.Title) ||
    safeString(row.title);
  if (!name) {
    const fallback = safeString(row.ID) || safeString(row.id);
    if (!fallback) return null;
    return { id: fallback, name: fallback };
  }
  const id =
    safeString(row.Type_ID) ||
    safeString(row.type_id) ||
    safeString(row.ID) ||
    safeString(row.id) ||
    name;
  return { id, name };
}

function parseColorVariant(row: RawRow): ColorVariant | null {
  const name =
    safeString(row.Color_Variant) ||
    safeString(row.color_variant) ||
    safeString(row["Color-Variant"]) ||
    safeString(row["color-variant"]) ||
    safeString(row["Color-varient"]) ||
    safeString(row["color-varient"]) ||
    safeString(row.Color_Name) ||
    safeString(row.color_name) ||
    safeString(row.ColorName) ||
    safeString(row.colorname) ||
    safeString(row.Color) ||
    safeString(row.color) ||
    safeString(row.Variant) ||
    safeString(row.variant) ||
    safeString(row.Name) ||
    safeString(row.name) ||
    safeString(row.Title) ||
    safeString(row.title);
  if (!name) {
    const fallback = safeString(row.ID) || safeString(row.id);
    if (!fallback) return null;
    return { id: fallback, name: fallback };
  }
  const id =
    safeString(row.Color_ID) ||
    safeString(row.color_id) ||
    safeString(row.ID) ||
    safeString(row.id) ||
    name;
  return { id, name };
}

function computeStockStatus(stock: number, minimum: number): Stock["stockStatus"] {
  if (stock <= 0) return "Out of Stock";
  if (stock <= minimum) return "Low Stock";
  return "In Stock";
}

interface FetchOptions {
  range?: string;
}

async function readSheet(sheetName: string, headers: readonly string[], options: FetchOptions = {}) {
  if (!hasServiceAccount()) {
    return readPublicSheet(sheetName, headers);
  }
  try {
    const sheets = getSheetsClient();
    const range = options.range ?? `${sheetName}!A1:Z`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getSheetId(),
      range,
    });
    const values = response.data.values ?? [];
    if (values.length <= 1) return [];
    return rowsToObjects(values, headers);
  } catch (error) {
    console.error(`[googleSheets] Failed to read sheet ${sheetName}`, error);
    return [];
  }
}

async function readPublicSheet(
  sheetName: string,
  headers: readonly string[]
) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    return generateMockRows(sheetName, headers);
  }
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      console.error(
        `[googleSheets] Public CSV export failed for ${sheetName}: ${response.status}`
      );
      return generateMockRows(sheetName, headers);
    }
    const csv = await response.text();
    const parsed = parseCsv(csv);
    if (parsed.length <= 1) return [];
    return rowsToObjects(parsed, headers);
  } catch (error) {
    console.error(`[googleSheets] Public CSV fetch error for ${sheetName}`, error);
    return generateMockRows(sheetName, headers);
  }
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          value += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        value += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      current.push(value);
      value = "";
    } else if (char === "\n" || char === "\r") {
      if (value !== "" || current.length > 0) {
        current.push(value);
        rows.push(current);
        current = [];
        value = "";
      }
      if (char === "\r" && input[i + 1] === "\n") {
        i += 1;
      }
    } else {
      value += char;
    }
  }
  if (value !== "" || current.length > 0) {
    current.push(value);
    rows.push(current);
  }
  return rows;
}

function generateMockRows(_sheetName: string, _headers: readonly string[]): RawRow[] {
  return [];
}

export async function fetchProducts(): Promise<Product[]> {
  const rows = await readSheet(SHARED_SHEET_IDS.products, PRODUCTS_HEADERS);
  const products: Product[] = [];
  for (const row of rows) {
    const product = parseProduct(row);
    if (product) products.push(product);
  }
  return products;
}

export async function fetchStock(): Promise<Stock[]> {
  const rows = await readSheet(SHARED_SHEET_IDS.stock, STOCK_HEADERS);
  const stock: Stock[] = [];
  for (const row of rows) {
    const item = parseStock(row);
    if (item) stock.push(item);
  }
  return stock;
}

export async function fetchStockHistory(): Promise<StockHistoryEntry[]> {
  const rows = await readSheet(
    SHARED_SHEET_IDS.stockHistory,
    STOCK_HISTORY_HEADERS
  );
  const history: StockHistoryEntry[] = [];
  for (const row of rows) {
    const entry = parseStockHistory(row);
    if (entry) history.push(entry);
  }
  return history;
}

export async function fetchCategories(): Promise<Category[]> {
  const rows = await readSheet(SHARED_SHEET_IDS.categories, CATEGORIES_HEADERS);
  return rows
    .map(parseCategory)
    .filter((c): c is Category => Boolean(c))
    .map((c) => ({ ...c }));
}

export async function fetchBrands(): Promise<Brand[]> {
  const rows = await readSheet(SHARED_SHEET_IDS.brands, BRANDS_HEADERS);
  return rows
    .map(parseBrand)
    .filter((b): b is Brand => Boolean(b))
    .map((b) => ({ ...b }));
}

export async function fetchTypes(): Promise<ProductType[]> {
  const rows = await readSheet(SHARED_SHEET_IDS.types, TYPES_HEADERS);
  return rows
    .map(parseType)
    .filter((t): t is ProductType => Boolean(t))
    .map((t) => ({ ...t }));
}

export async function fetchColorVariants(): Promise<ColorVariant[]> {
  const rows = await readSheet(SHARED_SHEET_IDS.colorVariants, COLOR_VARIANTS_HEADERS);
  return rows
    .map(parseColorVariant)
    .filter((c): c is ColorVariant => Boolean(c))
    .map((c) => ({ ...c }));
}

export function recalcStockStatus(stock: number, minimum: number): Stock["stockStatus"] {
  return computeStockStatus(stock, minimum);
}

async function writeSheet(
  sheetName: string,
  range: string,
  values: unknown[][]
): Promise<void> {
  if (!hasServiceAccount()) {
    console.warn(
      `[googleSheets] Skipping write to ${sheetName} — service account credentials are not configured.`
    );
    return;
  }
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: getSheetId(),
    range: `${sheetName}!${range}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function appendSheet(
  sheetName: string,
  values: unknown[][]
): Promise<void> {
  if (!hasServiceAccount()) {
    console.warn(
      `[googleSheets] Skipping append to ${sheetName} — service account credentials are not configured.`
    );
    return;
  }
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: getSheetId(),
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

async function clearSheet(
  sheetName: string,
  range: string
): Promise<void> {
  if (!hasServiceAccount()) {
    console.warn(
      `[googleSheets] Skipping clear on ${sheetName} — service account credentials are not configured.`
    );
    return;
  }
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: getSheetId(),
    range: `${sheetName}!${range}`,
  });
}

async function getSheetHeaderRow(sheetName: string, fallbackHeaders: readonly string[]): Promise<string[]> {
  if (!hasServiceAccount()) {
    return [...fallbackHeaders];
  }
  try {
    const sheets = getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getSheetId(),
      range: `${sheetName}!1:1`,
    });
    const [firstRow] = response.data.values ?? [];
    if (firstRow && firstRow.length > 0) {
      const headers = firstRow.map((cell) => String(cell ?? "").trim()).filter(Boolean);
      if (headers.length > 0) return headers;
    }
    return [...fallbackHeaders];
  } catch (error) {
    console.error(`[googleSheets] Failed to get header row for ${sheetName}`, error);
    return [...fallbackHeaders];
  }
}

function mapProductToHeaders(product: Product, headerRow: readonly string[]): unknown[] {
  return headerRow.map((rawHeader) => {
    const key = String(rawHeader ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    const stripped = key.replace(/[^a-z0-9]/g, "");

    // 1. Color Variant / Finish
    if (
      key === "color_variant" ||
      key === "colorvariant" ||
      key === "color_varient" ||
      key === "colorvarient" ||
      key === "color" ||
      key === "colour" ||
      key === "shade" ||
      key === "variant" ||
      key === "finish" ||
      stripped === "colorvariant" ||
      stripped === "colorvarient"
    ) {
      return product.colorVariant || "";
    }

    // 2. Pieces Per Box
    if (
      key === "pieces_per_box" ||
      key === "piecesperbox" ||
      key === "piece_per_box" ||
      key === "pieceperbox" ||
      key === "pieces_box" ||
      key === "piecesbox" ||
      key === "pcs_per_box" ||
      key === "pcsperbox" ||
      key === "pcs_box" ||
      key === "pcsbox" ||
      key === "pieces" ||
      key === "piece" ||
      key === "pcs" ||
      stripped === "piecesperbox" ||
      stripped === "pieceperbox" ||
      stripped === "pcsperbox"
    ) {
      return product.piecesPerBox;
    }

    // 3. Price Per Box
    if (
      key === "price_per_box" ||
      key === "priceperbox" ||
      key === "price_box" ||
      key === "pricebox" ||
      key === "rate_per_box" ||
      key === "rateperbox" ||
      key === "cost_per_box" ||
      key === "costperbox" ||
      key === "box_price" ||
      key === "boxprice" ||
      key === "price" ||
      key === "rate" ||
      key === "cost" ||
      stripped === "priceperbox" ||
      stripped === "rateperbox" ||
      stripped === "costperbox"
    ) {
      return product.pricePerBox;
    }

    // 4. Product ID
    if (
      key === "product_id" ||
      key === "productid" ||
      key === "product_code" ||
      key === "sku" ||
      key === "id" ||
      stripped === "productid" ||
      stripped === "productcode"
    ) {
      return product.productId;
    }

    // 5. Product Name
    if (
      key === "product_name" ||
      key === "productname" ||
      key === "item_name" ||
      key === "tile_name" ||
      key === "name" ||
      key === "title" ||
      stripped === "productname" ||
      stripped === "itemname" ||
      stripped === "tilename"
    ) {
      return product.productName;
    }

    // 6. Type
    if (
      key === "type" ||
      key === "product_type" ||
      key === "tile_type" ||
      key === "type_name" ||
      key === "category" ||
      stripped === "producttype" ||
      stripped === "tiletype" ||
      stripped === "typename"
    ) {
      return product.type;
    }

    // 7. Brand
    if (
      key === "brand" ||
      key === "brand_name" ||
      key === "manufacturer" ||
      key === "make" ||
      stripped === "brandname"
    ) {
      return product.brand;
    }

    // 8. Length
    if (key === "length" || key === "len" || key === "l") {
      return product.length;
    }

    // 9. Width
    if (key === "width" || key === "wid" || key === "w" || key === "breadth" || key === "b") {
      return product.width;
    }

    // 10. Size Unit
    if (
      key === "size_unit" ||
      key === "sizeunit" ||
      key === "dimension_unit" ||
      key === "unit" ||
      key === "units" ||
      stripped === "sizeunit" ||
      stripped === "dimensionunit"
    ) {
      return product.sizeUnit;
    }

    // 11. Notes
    if (
      key === "notes" ||
      key === "note" ||
      key === "remark" ||
      key === "remarks" ||
      key === "description" ||
      key === "details" ||
      key === "comment" ||
      key === "comments"
    ) {
      return product.notes ?? "";
    }

    return "";
  });
}

function mapStockToHeaders(stock: Stock, headerRow: readonly string[]): unknown[] {
  return headerRow.map((rawHeader) => {
    const key = String(rawHeader ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    const stripped = key.replace(/[^a-z0-9]/g, "");

    if (
      key === "product_id" ||
      key === "productid" ||
      key === "sku" ||
      key === "id" ||
      stripped === "productid"
    ) {
      return stock.productId;
    }
    if (
      key === "stock_boxes" ||
      key === "stockboxes" ||
      key === "stock" ||
      key === "quantity" ||
      stripped === "stockboxes"
    ) {
      return stock.stockBoxes;
    }
    if (
      key === "minimum_boxes" ||
      key === "minimumboxes" ||
      key === "minimum" ||
      key === "min_boxes" ||
      key === "minboxes" ||
      stripped === "minimumboxes"
    ) {
      return stock.minimumBoxes;
    }
    if (
      key === "stock_status" ||
      key === "stockstatus" ||
      key === "status" ||
      stripped === "stockstatus"
    ) {
      return stock.stockStatus;
    }
    if (
      key === "last_updated" ||
      key === "lastupdated" ||
      key === "date" ||
      key === "updated_at" ||
      stripped === "lastupdated"
    ) {
      return stock.lastUpdated;
    }
    return "";
  });
}

function mapStockHistoryToHeaders(entry: StockHistoryEntry, headerRow: readonly string[]): unknown[] {
  return headerRow.map((rawHeader) => {
    const key = String(rawHeader ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    const stripped = key.replace(/[^a-z0-9]/g, "");

    if (key === "date" || key === "timestamp" || key === "created_at") {
      return entry.date;
    }
    if (
      key === "product_id" ||
      key === "productid" ||
      key === "sku" ||
      key === "id" ||
      stripped === "productid"
    ) {
      return entry.productId;
    }
    if (key === "action" || key === "type") {
      return entry.action;
    }
    if (
      key === "quantity_boxes" ||
      key === "quantityboxes" ||
      key === "boxes" ||
      stripped === "quantityboxes"
    ) {
      return entry.quantityBoxes ?? entry.quantity;
    }
    if (
      key === "quantity_pieces" ||
      key === "quantitypieces" ||
      key === "pieces" ||
      stripped === "quantitypieces"
    ) {
      return entry.quantityPieces ?? 0;
    }
    if (key === "quantity" || key === "total_quantity" || stripped === "totalquantity") {
      return entry.quantity;
    }
    if (
      key === "previous_stock" ||
      key === "previousstock" ||
      key === "prev_stock" ||
      stripped === "previousstock"
    ) {
      return entry.previousStock;
    }
    if (
      key === "new_stock" ||
      key === "newstock" ||
      key === "current_stock" ||
      stripped === "newstock"
    ) {
      return entry.newStock;
    }
    if (key === "reason") {
      return entry.reason ?? "";
    }
    if (
      key === "notes" ||
      key === "note" ||
      key === "description" ||
      key === "remark" ||
      key === "remarks"
    ) {
      return entry.notes ?? "";
    }
    return "";
  });
}

export async function createProduct(payload: import("@/types/domain").CreateProductPayload): Promise<Product> {
  const existing = await fetchProducts();
  const duplicate = existing.find(
    (p) => p.productId.toLowerCase() === payload.productId.trim().toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Product ID "${payload.productId}" already exists. Please choose a different ID.`);
  }

  const initialStock = Math.max(0, payload.initialStockBoxes ?? 0);
  const minBoxes = Math.max(0, payload.minimumBoxes ?? 10);

  const product: Product = {
    productId: payload.productId.trim(),
    sku: payload.productId.trim(),
    productName: payload.productName.trim(),
    type: payload.type.trim(),
    brand: payload.brand.trim(),
    length: payload.length,
    width: payload.width,
    sizeUnit: payload.sizeUnit,
    colorVariant: (payload.colorVariant ?? "").trim(),
    piecesPerBox: payload.piecesPerBox,
    pricePerBox: payload.pricePerBox,
    notes: payload.notes?.trim() || undefined,
  };

  if (!hasServiceAccount()) {
    return product;
  }

  try {
    const prodHeaders = await getSheetHeaderRow(SHARED_SHEET_IDS.products, PRODUCTS_HEADERS);
    const productRow = mapProductToHeaders(product, prodHeaders);
    await appendSheet(SHARED_SHEET_IDS.products, [productRow]);

    const stockStatus = computeStockStatus(initialStock, minBoxes);
    const stockRecord: Stock = {
      productId: product.productId,
      sku: product.productId,
      stockBoxes: initialStock,
      minimumBoxes: minBoxes,
      stockStatus,
      lastUpdated: new Date().toISOString(),
    };
    const stockHeaders = await getSheetHeaderRow(SHARED_SHEET_IDS.stock, STOCK_HEADERS);
    const stockRow = mapStockToHeaders(stockRecord, stockHeaders);
    await appendSheet(SHARED_SHEET_IDS.stock, [stockRow]);

    if (initialStock > 0) {
      const historyEntry: StockHistoryEntry = {
        date: new Date().toISOString(),
        productId: product.productId,
        sku: product.productId,
        action: "Restock",
        quantityBoxes: initialStock,
        quantityPieces: 0,
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        notes: "Initial stock upon product creation",
      };
      const historyHeaders = await getSheetHeaderRow(SHARED_SHEET_IDS.stockHistory, STOCK_HISTORY_HEADERS);
      const historyRow = mapStockHistoryToHeaders(historyEntry, historyHeaders);
      await appendSheet(SHARED_SHEET_IDS.stockHistory, [historyRow]);
    }

    return product;
  } catch (error) {
    console.error("[googleSheets] Failed to create product", error);
    throw error;
  }
}

export async function updateProduct(payload: import("@/types/domain").UpdateProductPayload): Promise<Product> {
  const existing = await fetchProducts();
  const match = existing.find(
    (p) => p.productId.toLowerCase() === payload.productId.trim().toLowerCase()
  );
  if (!match) {
    throw new Error(`Product "${payload.productId}" not found.`);
  }

  const updated: Product = {
    ...match,
    productName: payload.productName.trim(),
    type: payload.type.trim(),
    brand: payload.brand.trim(),
    length: payload.length,
    width: payload.width,
    sizeUnit: payload.sizeUnit,
    piecesPerBox: payload.piecesPerBox,
    pricePerBox: payload.pricePerBox,
    colorVariant: (payload.colorVariant ?? "").trim(),
    notes: payload.notes?.trim() || undefined,
  };

  if (!hasServiceAccount()) {
    return updated;
  }

  try {
    const headers = await getSheetHeaderRow(SHARED_SHEET_IDS.products, PRODUCTS_HEADERS);
    const allRows = await readSheet(SHARED_SHEET_IDS.products, headers, {});
    const matchIndex = allRows.findIndex(
      (row) =>
        row.Product_ID?.toLowerCase() === payload.productId.trim().toLowerCase() ||
        row.product_id?.toLowerCase() === payload.productId.trim().toLowerCase() ||
        row.SKU?.toLowerCase() === payload.productId.trim().toLowerCase()
    );
    if (matchIndex === -1) {
      throw new Error(`Product "${payload.productId}" not found in sheet.`);
    }

    const sheetRow = matchIndex + 2;
    const endCol = String.fromCharCode(64 + Math.max(headers.length, 1));
    const productRow = mapProductToHeaders(updated, headers);
    await writeSheet(SHARED_SHEET_IDS.products, `A${sheetRow}:${endCol}${sheetRow}`, [productRow]);

    return updated;
  } catch (error) {
    console.error("[googleSheets] Failed to update product", error);
    throw error;
  }
}

export async function deleteProduct(productId: string): Promise<{ success: boolean; productId: string }> {
  const targetId = productId.trim();
  if (!targetId) {
    throw new Error("Product ID is required for deletion.");
  }

  if (!hasServiceAccount()) {
    return { success: true, productId: targetId };
  }

  try {
    // 1. Delete from Products sheet
    const prodHeaders = await getSheetHeaderRow(SHARED_SHEET_IDS.products, PRODUCTS_HEADERS);
    const allProdRows = await readSheet(SHARED_SHEET_IDS.products, prodHeaders, {});
    const remainingProdRows = allProdRows.filter(
      (row) =>
        row.Product_ID?.toLowerCase() !== targetId.toLowerCase() &&
        row.product_id?.toLowerCase() !== targetId.toLowerCase() &&
        row.SKU?.toLowerCase() !== targetId.toLowerCase()
    );

    const prodEndCol = String.fromCharCode(64 + Math.max(prodHeaders.length, 1));
    // Clear old range
    await clearSheet(SHARED_SHEET_IDS.products, `A2:${prodEndCol}${Math.max(allProdRows.length + 5, 2)}`);
    if (remainingProdRows.length > 0) {
      const values = remainingProdRows.map((r) => {
        const prod = parseProduct(r);
        return prod ? mapProductToHeaders(prod, prodHeaders) : prodHeaders.map((h) => r[h] || "");
      });
      await writeSheet(SHARED_SHEET_IDS.products, `A2:${prodEndCol}${values.length + 1}`, values);
    }

    // 2. Delete from Stock sheet
    const stockHeaders = await getSheetHeaderRow(SHARED_SHEET_IDS.stock, STOCK_HEADERS);
    const allStockRows = await readSheet(SHARED_SHEET_IDS.stock, stockHeaders, {});
    const remainingStockRows = allStockRows.filter(
      (row) =>
        row.Product_ID?.toLowerCase() !== targetId.toLowerCase() &&
        row.product_id?.toLowerCase() !== targetId.toLowerCase() &&
        row.SKU?.toLowerCase() !== targetId.toLowerCase()
    );

    const stockEndCol = String.fromCharCode(64 + Math.max(stockHeaders.length, 1));
    await clearSheet(SHARED_SHEET_IDS.stock, `A2:${stockEndCol}${Math.max(allStockRows.length + 5, 2)}`);
    if (remainingStockRows.length > 0) {
      const stockValues = remainingStockRows.map((r) => {
        const s = parseStock(r);
        return s ? mapStockToHeaders(s, stockHeaders) : stockHeaders.map((h) => r[h] || "");
      });
      await writeSheet(SHARED_SHEET_IDS.stock, `A2:${stockEndCol}${stockValues.length + 1}`, stockValues);
    }

    return { success: true, productId: targetId };
  } catch (error) {
    console.error("[googleSheets] Failed to delete product", error);
    throw error;
  }
}

export interface UpdateStockArgs {
  productId?: string;
  sku?: string;
  action: StockHistoryEntry["action"];
  quantityBoxes?: number;
  quantityPieces?: number;
  quantity?: number;
  reason?: string;
  notes?: string;
}

export interface StockMutationResult {
  stock: Stock;
  history: StockHistoryEntry;
}

export async function updateStock(args: UpdateStockArgs): Promise<StockMutationResult | null> {
  const targetId = args.productId?.trim() || args.sku?.trim();
  if (!targetId) return null;

  const [stock, products] = await Promise.all([fetchStock(), fetchProducts()]);
  const current = stock.find((s) => s.productId === targetId || s.sku === targetId);
  if (!current) return null;

  const product = products.find((p) => p.productId === targetId || p.sku === targetId);
  const piecesPerBox = Math.max(1, product?.piecesPerBox ?? 1);

  const boxes = args.quantityBoxes ?? (args.quantityPieces !== undefined ? 0 : (args.quantity ?? 0));
  const pieces = args.quantityPieces ?? 0;
  const totalQuantity = pieces > 0 ? Number((boxes + pieces / piecesPerBox).toFixed(4)) : (args.quantity ?? boxes);

  const isPositive = args.action === "Restock" || args.action === "Return" || args.action === "Adjustment";
  if (args.action === "Sale" && totalQuantity > current.stockBoxes) {
    throw new Error(
      `Insufficient stock for ${targetId}. Cannot sell ${totalQuantity} boxes when only ${current.stockBoxes} boxes are available.`
    );
  }
  const delta = isPositive ? totalQuantity : -totalQuantity;
  const newStockValue = Math.max(0, Number((current.stockBoxes + delta).toFixed(4)));
  const newStatus = computeStockStatus(newStockValue, current.minimumBoxes);

  const updatedStock: Stock = {
    ...current,
    productId: current.productId,
    sku: current.productId,
    stockBoxes: newStockValue,
    stockStatus: newStatus,
    lastUpdated: new Date().toISOString(),
  };

  const historyEntry: StockHistoryEntry = {
    date: updatedStock.lastUpdated,
    productId: current.productId,
    sku: current.productId,
    action: args.action,
    quantityBoxes: boxes,
    quantityPieces: pieces,
    quantity: totalQuantity,
    previousStock: current.stockBoxes,
    newStock: newStockValue,
    reason: args.reason,
    notes: args.notes,
  };

  if (!hasServiceAccount()) {
    return { stock: updatedStock, history: historyEntry };
  }

  try {
    const stockHeaders = await getSheetHeaderRow(SHARED_SHEET_IDS.stock, STOCK_HEADERS);
    const allRows = await readSheet(SHARED_SHEET_IDS.stock, stockHeaders, {});
    const matchIndex = allRows.findIndex(
      (row) =>
        row.Product_ID === targetId ||
        row.product_id === targetId ||
        row.ProductID === targetId ||
        row.SKU === targetId ||
        row.sku === targetId
    );
    if (matchIndex === -1) return null;
    const sheetRow = matchIndex + 2;
    const stockRow = mapStockToHeaders(updatedStock, stockHeaders);
    const stockEndCol = String.fromCharCode(64 + Math.max(stockHeaders.length, 1));
    await writeSheet(SHARED_SHEET_IDS.stock, `A${sheetRow}:${stockEndCol}${sheetRow}`, [stockRow]);

    const historyHeaders = await getSheetHeaderRow(SHARED_SHEET_IDS.stockHistory, STOCK_HISTORY_HEADERS);
    const historyRow = mapStockHistoryToHeaders(historyEntry, historyHeaders);
    await appendSheet(SHARED_SHEET_IDS.stockHistory, [historyRow]);

    return { stock: updatedStock, history: historyEntry };
  } catch (error) {
    console.error("[googleSheets] Failed to write stock update", error);
    return { stock: updatedStock, history: historyEntry };
  }
}
