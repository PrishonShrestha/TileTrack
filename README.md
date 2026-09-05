# TileCalc Pro

A production-ready tile and marble quantity calculator with a live product
catalog synced from Google Sheets. Built with **Next.js 16** (App Router,
TypeScript), **Redux Toolkit + RTK Query**, **shadcn/ui** components on
**Tailwind v4**, and **Vitest** for unit tests.

> The current Next.js version is **16.3.4** with React 19 — the App Router
> APIs, layout/page props, and `LayoutProps<"/">` / `PageProps<"/...">`
> helpers are used as documented in the local `node_modules/next/dist/docs/`.

---

## Features

- **Four dedicated calculator pages** — Floor, Wall (multi-wall with opening
  deductions), Kitchen (countertop + optional backsplash), Bathroom (floor +
  walls with separate tile picks per surface). Each is its own real route
  with an inline `ResultSummary` rendered **directly below the form** — no
  redirect, no modal, no lost context.
- **Live product catalog** — search by name/SKU/color/material, filter by
  Type, Category, Brand, Finish, Color, and Price range. Responsive table on
  desktop, stacked cards on mobile.
- **Stock management** — current inventory, inline "Update" dialog with
  action / quantity / reason / notes, full history with filtering, automatic
  RTK Query cache invalidation.
- **Multi-page persistence** — each calculator's inputs live in Redux, keyed
  per section, so navigating Home → Floor → Home → Floor (or Floor → Wall →
  Floor) keeps your previous values.
- **Global unit toggle (ft / m / inch)** in the navbar, with a single
  canonical **millimetre** base unit internally for accuracy.
- **Wastage slider + synced boxes input** in both directions; uses
  `Math.ceil` everywhere to avoid rounding drift.
- **Mint-green theme** with light/dark variants, `next-themes` for system
  preference, mobile-first layout, bottom tab bar + desktop navbar.
- **Zod validation** in forms, robust Google Sheets parsing that never
  crashes on malformed rows, and **20 unit tests** for the math.

---

## Tech stack (latest stable as of build time)

| Layer            | Package                                | Version    |
| ---------------- | -------------------------------------- | ---------- |
| Framework        | `next`                                 | 16.3.4     |
| Runtime          | `react` / `react-dom`                  | 19.2.8     |
| Styling          | `tailwindcss` (v4) + `@tailwindcss/postcss` | ^4     |
| UI primitives    | Radix UI + `class-variance-authority`  | latest     |
| Toasts           | `sonner` + `next-themes`               | latest     |
| State            | `@reduxjs/toolkit` + `react-redux`     | latest     |
| Forms            | `react-hook-form` + `zod` + `@hookform/resolvers` | latest |
| Icons            | `lucide-react`                         | latest     |
| Data source      | `googleapis` (Sheets v4)               | latest     |
| Tests            | `vitest` + `@testing-library/react`    | latest     |

---

## Getting started

```bash
# Install dependencies
npm install

# Copy env example and fill in your Google Sheet credentials
cp .env.example .env.local

# Start dev server
npm run dev   # http://localhost:3000

# Production build
npm run build && npm start

# Run tests
npm test

# Lint
npm run lint

# Type-check only
npm run typecheck
```

> If the Google service account isn't configured, the app **still runs** — it
> falls back to a built-in mock catalog so you can demo the UI.

---

## Environment variables

Add these to `.env.local` (see `.env.example` for the template).

| Variable                       | Purpose                                                                  |
| ------------------------------ | ------------------------------------------------------------------------ |
| `GOOGLE_SHEET_ID`              | The ID in the URL of your Google Sheet                                   |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email (Editor access required for Stock + History)       |
| `GOOGLE_PRIVATE_KEY`           | Service account private key (escape newlines as `\n` inside the string)  |
| `AUTH_USERNAME`                | Admin username for single-user authentication (default: `admin`)         |
| `AUTH_PASSWORD`                | Admin password for single-user authentication (default: `admin`)         |
| `AUTH_SECRET`                  | Secret key for signing session JWT cookies (min 32 characters)           |

> **Authentication**: All calculator and home pages are public. The `/manage` hub
> (`/manage`, `/manage/catalog`, `/manage/stock`, `/manage/sales`) is protected by
> an `HttpOnly` signed session cookie checked in `middleware.ts`. Accessing any
> `/manage/*` route while logged out automatically redirects to `/login?redirect=...`.

### Sharing the sheet with the service account

1. In Google Cloud Console, create (or reuse) a service account.
2. Generate a JSON key, copy the `client_email` and `private_key` into
   `.env.local`.
3. Open the target Google Sheet → **Share** → add the service account email
   as **Editor** (Viewer is enough if you only ever read).
4. In each tab, ensure the **first row** matches the column names listed
   below.

---

## Google Sheet schema

The first row of each tab is treated as the header row.

### `Products`

```
Product_ID | Product_Name | Type | Brand | Length | Width | Size_Unit | Pieces_Per_Box | Price_Per_Box | Color_Variant | Notes
```

- `Product_ID` is the unique identifier for the product.
- `Length` / `Width` are numbers in the unit specified in `Size_Unit` (`ft | m | inch | mm | cm`).
- `Pieces_Per_Box` is the number of tiles per box.
- `Price_Per_Box` is the price per box.
- `Color_Variant` is the color/finish variant description.

### `Stock`

```
Product_ID | Stock_Boxes | Minimum_Boxes | Stock_Status | Last_Updated
```

- `Stock_Status` is auto-recalculated to `In Stock | Low Stock | Out of Stock`
  when `POST /api/sheets/stock` is called.

### `Stock_History`

```
Date | Product_ID | Action | Quantity_Boxes | Quantity_Pieces | Quantity | Previous_Stock | New_Stock | Reason | Notes
```

- `Action` is one of `Restock | Sale | Adjustment | Return`.
  - `Restock`, `Return`, and `Adjustment` **add** to inventory.
  - `Sale` **subtracts** from inventory.
- **Partial Box Returns / Loose Pieces**: When returning stock, users can specify both boxes and individual loose tiles/pieces. The equivalent box count is computed as `boxes + (pieces / piecesPerBox)` and logged in `Stock_History`.

### `Brands`

```
ID | Name
```

### `Types`

```
ID | Name
```

### `Color_Variants`

```
ID | Name
```

---

## API surface

All routes live under `/api/sheets/*` and are implemented as Next.js Route
Handlers (App Router).

| Method | Path                          | Description                                     |
| ------ | ----------------------------- | ----------------------------------------------- |
| POST   | `/api/auth/login`             | Authenticate admin & issue signed cookie        |
| POST   | `/api/auth/logout`            | Invalidate session cookie                       |
| GET    | `/api/auth/session`           | Check session validity & return auth state      |
| GET    | `/api/sheets/products`        | Parsed product list                             |
| POST   | `/api/sheets/products`        | Create new product with initial stock           |
| PUT    | `/api/sheets/products`        | Update existing product specifications          |
| DELETE | `/api/sheets/products`        | Delete product and its stock record             |
| GET    | `/api/sheets/categories`      | Category list                                   |
| GET    | `/api/sheets/brands`          | Brand list (from Brands sheet)                  |
| GET    | `/api/sheets/types`           | Type list (from Types sheet)                    |
| GET    | `/api/sheets/color-variants`  | Color variant list (from Color_Variants sheet)  |
| GET    | `/api/sheets/stock`           | Current stock per Product ID                    |
| POST   | `/api/sheets/stock`           | Update stock for one Product ID + append history|
| GET    | `/api/sheets/stock/history`   | Stock history (optional `?productId=...` filter)|

---

## Architecture

Feature-first folder layout under `src/`:

```
src/
  app/                       # Next.js App Router routes + API handlers
    calculator/{floor,wall,kitchen,bathroom}/page.tsx
    login/page.tsx           # Admin login gate
    manage/                  # Protected management hub (gated by middleware)
      page.tsx               # Dashboard (KPIs, 7d/30d activity charts)
      catalog/page.tsx       # Live product catalog management (Add/Edit/Delete)
      stock/page.tsx         # Inventory & Stock history
      sales/page.tsx         # Sales & Returns transactions report
    api/auth/...             # Auth login/logout/session endpoints
    api/sheets/...           # Google Sheets API handlers
  features/
    auth/                    # Single-admin auth, JWT session, login form
    calculator/              # Floor/Wall/Kitchen/Bathroom calculators
    catalog/                 # Catalog table, filters, product form dialog
    stock/                   # Stock update form, history table
    manage/                  # Dashboard view, sub-navigation tabs
    sales/                   # Sales report, date range filters, KPI cards
    theme/                   # Theme provider & toggle
  components/
    layout/                  # Navbar, MobileNav, AppShell, HomeDashboard
    ui/                      # Radix UI primitives, Recharts components
  lib/                       # googleSheets, utils, constants, catalog helpers
  store/                     # Root store + typed hooks + provider
  types/                     # global.d.ts, domain.ts
  middleware.ts              # Protects /manage and /manage/*
```

Each feature owns its Redux slice(s), selectors, types, and components.
Shared UI primitives are in `components/ui` and have **no business logic**.

---

## Math, units, and tests

All conversion happens through `features/calculator/lib/unitConversion.ts`,
with constants in `lib/constants.ts`. Internal math is always in
**millimetres** / **square millimetres**, then converted back for display
using `Math.ceil` only at the very end.

Formulas (`features/calculator/lib/formulas.ts`) are pure, side-effect-free
functions covered by **20 Vitest tests**:

- Unit conversion round-trips for ft, m, inch, mm, cm
- Exact-fit, tiny-remainder, zero-area, division-by-zero guards
- Extra% ↔ boxes back-solve consistency
- Multi-wall summation + opening deduction
- `totalBoxes` derived from `totalTiles` (not by adding rounded values)

```bash
npm test
```

---

## Scripts

| Script              | Description                                 |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Start the dev server with Turbopack         |
| `npm run build`     | Production build (Next 16 + Turbopack)      |
| `npm run start`     | Run the production build                    |
| `npm run lint`      | ESLint (Next.js preset)                     |
| `npm run typecheck` | TypeScript only                             |
| `npm test`          | Run the Vitest suite once                   |
| `npm run test:watch`| Vitest in watch mode                        |

---

## Notes

- The Next.js 16 docs that ship in `node_modules/next/dist/docs` are the
  source of truth for App Router conventions; if a code snippet here looks
  unusual, that's why.
- The service account must have **Editor** access for the Stock
  write/update flow. Without it, the API still returns the computed
  result but the Sheet isn't modified.
- The theme is mint-green with both light and dark variants. Tune the OKLCH
  variables in `src/app/globals.css` to re-skin.
