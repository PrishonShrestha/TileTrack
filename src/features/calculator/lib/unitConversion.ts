import {
  AREA_UNIT_FACTORS,
  LENGTH_UNIT_FACTORS,
  type AreaUnit,
  type LengthUnit,
} from "@/lib/constants";

export function lengthToMm(value: number, unit: LengthUnit): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value * LENGTH_UNIT_FACTORS[unit];
}

export function mmToLength(value: number, unit: LengthUnit): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value / LENGTH_UNIT_FACTORS[unit];
}

export function areaToMm2(value: number, unit: AreaUnit): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value * AREA_UNIT_FACTORS[unit];
}

export function mm2ToArea(value: number, unit: AreaUnit): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value / AREA_UNIT_FACTORS[unit];
}

export function lengthUnitLabel(unit: LengthUnit): string {
  switch (unit) {
    case "ft":
      return "ft";
    case "m":
      return "m";
    case "inch":
      return "in";
    case "mm":
      return "mm";
    case "cm":
      return "cm";
  }
}

export function areaUnitFor(lengthUnit: LengthUnit): AreaUnit {
  switch (lengthUnit) {
    case "ft":
      return "ft2";
    case "m":
      return "m2";
    case "inch":
      return "inch2";
    case "mm":
      return "mm2";
    case "cm":
      return "cm2";
  }
}

export function areaUnitLabel(unit: AreaUnit): string {
  switch (unit) {
    case "ft2":
      return "ft²";
    case "m2":
      return "m²";
    case "inch2":
      return "in²";
    case "mm2":
      return "mm²";
    case "cm2":
      return "cm²";
  }
}
