# Moustachir BI & Performance Platform — Frontend App

A high-fidelity, offline-first Business Intelligence and Performance Platform designed for Moustachir. Built with **Vite**, **React 18**, **TypeScript**, **Dexie (IndexedDB)** for local transactional and analytical persistence, **Zustand** for UI state, and **Chart.js** for high-performance visual analytics.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v20 or later
- **npm** v10 or later

### Installation
From the `/app` directory, install all required dependencies:
```bash
cd app
npm install
```

### Development Server
Run the local hot-reloading development server:
```bash
npm run dev
# The app will open at http://localhost:5173 (or next available port, e.g. 5174)
```

---

## 🛠️ Build & Production Deployment

Verify TypeScript compilation, linting, and compile the optimized production bundle:
```bash
# Build the production bundle into app/dist
npm run build

# Serve the static production bundle locally for previewing
npm run preview
```

The app bundles into:
1. `index.html`: Entry structure.
2. `index-[hash].css`: Unified design system styling, containing MoustachirSpace custom design tokens.
3. `index-[hash].js`: Compiled application, including the embedded seed data (`seed.json` + `data_quality.json`) and core libraries.

---

## 💾 Seeding & Database Operations

The platform operates on a locally persisted IndexedDB store (`MoustachirDB`) containing **15 tables** matching the canonical data contracts defined in the `/spec` directory.

### Initial Seeding
When the application first boots in the browser, it checks for an existing database. If empty, it automatically bulk-imports `seed.json` (6,339 rows across all tables) containing a mix of real warehouse data (clients, leads, transactions, feedback) and synthetically generated consistent records (interactions, opportunities, proposals, sales, payments, projects, tasks).

### Resetting Data
To return the local database to its pristine state (reconciling exactly to the real KPI anchors, e.g., 10,729,000 DA Revenue, 1,451 leads):
1. Locate the floating **Data Status Indicator** in the bottom-right corner of the window (available in development mode or via global reset functions).
2. Click **Reset / Réinitialiser**.
3. The database will wipe all manual edits, re-import the default seeds, and immediately recalculate and refresh all analytics dashboards without requiring a page reload.

---

## 🧪 Testing

The frontend persistence, repository layer, KPI aggregation, data quality validations, and lead-conversion workflow are covered by a comprehensive Vitest suite.

Run the unit tests:
```bash
# Run tests once
npm test

# Run tests in watch mode for development
npm run test:watch
```

---

## 📂 Project Architecture

```
/app/src
  ├── seed/             # seed.json + data_quality.json (Python ETL foundry outputs)
  ├── design-system/    # MoustachirSpace custom design tokens, fonts, and 17 reusable UI components
  ├── config/           # Navigation structure, paths, and branch definitions
  ├── i18n/             # Type-safe French and English dictionary translations (FR default)
  ├── store/            # Dexie DB instance, repository factory patterns, and Zustand filter state
  ├── lib/              # Core business logic (kpis.ts, alerts.ts, deck.ts, pricing.ts, actions.ts)
  ├── shell/            # App shell wrappers: Sidebar, TopBar, FilterBar, and AppShell
  ├── components/       # Shared dashboard analytics tiles and branch explorer DataTables
  └── screens/          # Dashboard, Financial, Marketing, Commercial, Client, Operational, DataManager, and Branch Workspaces
```
