import type { Product } from "@/types/domain";

export function uniqueProductTypes(products: Product[]): string[] {
  return uniqueBy(products, (p) => p.type.toLowerCase())
    .map((p) => p.type)
    .filter(Boolean)
    .sort();
}

export function uniqueProductBrands(products: Product[]): string[] {
  return uniqueBy(products, (p) => p.brand.toLowerCase())
    .map((p) => p.brand)
    .filter(Boolean)
    .sort();
}

export function uniqueProductColorVariants(products: Product[]): string[] {
  return uniqueBy(products, (p) => (p.colorVariant || "").toLowerCase())
    .map((p) => p.colorVariant)
    .filter(Boolean)
    .sort();
}

function uniqueBy<T, K>(arr: T[], getKey: (item: T) => K): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of arr) {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
