# DECISIONS

This document records the assumptions and design decisions made while
building **TileTrack** that aren't fully spelled out in the original
spec. Each section explains the choice, the alternatives considered, and
the trade-off.

## 1. Pricing unit: per box

The Google Sheet stores `Price_Per_Box` directly for each product. The calculator computes total cost as:

```
estimatedCost = totalBoxes × Price_Per_Box
```

The `Price_Per_Box` is displayed throughout the catalog and calculator as the cost unit.

## 2. Global unit toggle (not per-section)

A single `unit` lives in the Redux store. Switching from `ft` to `m`
re-runs every selector in `features/calculator/store/selectors.ts` against
the new unit; nothing else changes. This is consistent with the prompt's
"global is recommended" guidance. Internal math is always in millimetres
so there's no precision loss when the user changes units.

## 3. `Math.ceil` everywhere — recompute, never add

The spec is explicit: `totalBoxes = ceil(totalTiles / piecesPerBox)`. We
do **not** compute `baseBoxes + extraBoxes` and add them; that introduces
double-rounding drift. The selector chain in `formulas.ts` always builds
the total from the (already-ceiled) `totalTiles` count. There is a Vitest
case that pins this behaviour.

## 4. Opening deduction: per-wall, optional

Door / window openings are entered as a sub-row under each wall. We chose
this over a global "deduct total" because the failure mode of
double-counting or forgetting to associate an opening with a wall is much
harder to hit when openings are scoped to a wall. Each opening has its own
label, width and height in the active unit.

The UI labels openings as "(optional)" with a "+ Add opening" button so
the common case of a featureless wall is one click.

## 5. `extraBoxes` is derived, not stored

The `extraBoxes` field in the Redux state is kept in sync with the slider
value but is **never the source of truth** for the math — the slider value
is. The "Edit boxes" path back-solves `percent` from `boxes` using
`percentFromBoxes`, and the slider/input stay mathematically consistent in
both directions.

## 6. Stock write semantics

`POST /api/sheets/stock` validates with Zod, looks up the existing row,
computes the new value (`Restock`/`Adjustment` add, `Sale`/`Reserved`
subtract), clamps to zero, recalculates `Stock_Status`, writes the row
back, and appends a `Stock_History` row in a single call. RTK Query
invalidates the `Stock` and `StockHistory` tags so the UI refreshes
in-place without a page reload.

If the service account isn't configured we still return the computed
result with a console warning — the in-memory state in the API would be
the same, but no Sheet mutation happens.

## 7. Fallback mock data

When neither the service account nor the public CSV export is reachable,
the API serves a small built-in catalog (5 SKUs across Marble, Porcelain,
Granite, Mosaic) so the UI is fully demoable without any setup. This is
documented in the README and is also what `npm run dev` shows on a fresh
clone.

## 8. Calculator pages are real routes

`/calculator/floor`, `/calculator/wall`, `/calculator/kitchen`,
`/calculator/bathroom` are App Router pages. Inputs and results live on
the same page — no redirect, no modal. Redux persists inputs across
client-side navigations because the `<Provider>` lives in the root
layout. Browser back / forward works as expected and each route is
bookmarkable.

The "no redirect" rule applies **only** to inputs ↔ results within a
calculator. Navigating between Home and a calculator is still a real route
change (and is the right behaviour there).

## 9. Formulas are pure and unit-tested

`features/calculator/lib/formulas.ts` is the only place that does math.
Components consume memoized `createSelector` outputs from
`features/calculator/store/selectors.ts`. There are no inline `Math.ceil`
calls or magic numbers in components. Twenty Vitest cases cover
round-trips, exact fit, tiny remainder, zero area, division-by-zero,
opening deduction, and `Math.ceil` consistency.

## 10. Shadcn-style UI without the CLI

The shadcn CLI wasn't run (it tries to write Tailwind config files that
conflict with the existing Tailwind v4 setup). Instead, each shadcn-style
primitive (`button`, `card`, `slider`, `tabs`, `dialog`, `select`,
`popover`, `checkbox`, `scroll-area`, `dropdown-menu`, `tooltip`,
`toggle-group`, `switch`, `skeleton`, `badge`, `input`, `label`, `textarea`,
`numeric-input`, `toaster`) lives in `src/components/ui` and follows the
shadcn API conventions (CVA variants, `asChild` via Radix Slot, etc.).
The look-and-feel is identical to a CLI-generated project but the project
isn't dependent on a one-shot init.

## 11. Tailwind v4 OKLCH theme

Tailwind v4 doesn't use the v3 `tailwind.config.js` shape. We define the
mint palette as OKLCH CSS variables in `globals.css` and consume them
through `@theme inline`. The variables are the same name as shadcn's
expectations (`--background`, `--primary`, etc.) so any future shadcn
component copy-pasted in will work without changes.

## 12. ESLint rules for hooks

The default Next.js ESLint preset enables `react-hooks/set-state-in-effect`
and `react-hooks/refs` in Next 16. Both have legitimate uses (mount-time
state for `next-themes` and the official Redux store ref pattern); we
disable them in `eslint.config.mjs` rather than scatter `eslint-disable`
comments through the codebase. The runtime behaviour is unchanged.

## 13. Stock write requires Editor access

A Viewer-only service account can read products/stock/categories/brands
through the public CSV export, but **stock updates require Editor access**
because we call `values.update` and `values.append` on the Sheet. The
README spells this out under "Sharing the sheet with the service account".
