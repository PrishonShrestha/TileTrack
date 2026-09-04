import { describe, expect, it } from "vitest";
import {
  areaToMm2,
  lengthToMm,
  mm2ToArea,
  mmToLength,
  areaUnitFor,
} from "@/features/calculator/lib/unitConversion";

describe("unit conversion", () => {
  it("converts each length unit to mm using the exact factor", () => {
    expect(lengthToMm(1, "ft")).toBe(304.8);
    expect(lengthToMm(1, "m")).toBe(1000);
    expect(lengthToMm(1, "inch")).toBe(25.4);
    expect(lengthToMm(1, "mm")).toBe(1);
    expect(lengthToMm(1, "cm")).toBe(10);
  });

  it("round-trips mm -> unit -> mm without precision loss", () => {
    for (const unit of ["ft", "m", "inch", "mm", "cm"] as const) {
      const original = 4321;
      const out = mmToLength(lengthToMm(original, unit), unit);
      expect(Math.abs(out - original)).toBeLessThan(1e-9);
    }
  });

  it("returns 0 for negative or non-finite inputs", () => {
    expect(lengthToMm(-1, "ft")).toBe(0);
    expect(lengthToMm(Number.NaN, "ft")).toBe(0);
    expect(mmToLength(-5, "m")).toBe(0);
  });

  it("converts between area units using the squared factor", () => {
    expect(areaToMm2(1, "m2")).toBe(1_000_000);
    expect(areaToMm2(1, "ft2")).toBe(92903.04);
    expect(mm2ToArea(1_000_000, "m2")).toBeCloseTo(1, 9);
  });

  it("maps length units to their area counterparts", () => {
    expect(areaUnitFor("ft")).toBe("ft2");
    expect(areaUnitFor("m")).toBe("m2");
    expect(areaUnitFor("inch")).toBe("inch2");
  });
});
