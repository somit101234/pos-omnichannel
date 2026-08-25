# Execution Contract: Sprint 5 — Electron Desktop

**Compiled:** 2026-08-25
**Task Set:** Sprint 5 (5-7 ngày)
**Project:** pos-omnichannel

## 1. Scope

### Cho phép sửa
- `apps/electron/main.js` — update: better-sqlite3, thermal printer
- `apps/electron/preload.js` — IPC handlers
- `apps/electron/renderer/` — React app structure
- `apps/electron/renderer/index.html` → React entry
- `apps/electron/package.json` — dependencies
- `apps/electron/tsconfig.json` — type checking

### Cấm sửa
- Không sửa backend code
- Không sửa web/mobile code
- Không thay đổi electron framework version (đã có electron ^28.0.0)

## 2. Dependencies
- Sprint 2 hoàn thành (backend auth + POS API)
- Electron framework đã install

## 3. Ordered Steps

### Step 1: React Renderer Setup (1.5 ngày)
- Tạo React app trong `apps/electron/renderer/`:
  - `package.json` (react, react-dom, react-router-dom)
  - `src/main.tsx` (React root)
  - `src/routes/login.tsx` (tái sử dụng từ web)
  - `src/routes/pos.tsx` (tái sử dụng từ web, đơn giản hóa)
  - `src/stores/authStore.ts` (tái sử dụng từ web)
  - `src/stores/cartStore.ts` (tái sử dụng từ web)
  - `src/services/electron-api.ts` (IPC wrapper)
- Configure Vite/esbuild cho electron renderer
- Update `renderer/index.html` → React entry point

### Step 2: better-sqlite3 Local DB (1.5 ngày)
- Install `better-sqlite3` trong electron package.json
- Tạo `apps/electron/db/init.js`:
  - Create SQLite DB file: `data/pos.db`
  - Create tables: users, products, stocks, transactions, transactions_items
  - Schema giống PostgreSQL (Prisma schema)
- IPC handlers:
  - `db:query` — execute SQL query
  - `db:migrate` — run migration if schema changed

### Step 3: IPC Communication (1 ngày)
- `preload.js` expose:
  - `window.electronAPI.db.query(sql, params)`
  - `window.electronAPI.db.migrate()`
  - `window.electronAPI.printer.printReceipt(text)`
  - `window.electronAPI.sync.status()` → online/offline
- Renderer call: `window.electronAPI.db.query('SELECT * FROM products')`

### Step 4: Thermal Printer (1 ngày)
- Install `node-thermal-printer` trong electron package.json
- `apps/electron/printer/index.js`:
  - `printReceipt(transactionData)` → text → thermal printer
  - Support 58mm + 80mm (configurable)
  - Fallback: print to file if no printer
- IPC: `window.electronAPI.printer.printReceipt(receiptText)`

### Step 5: Sync with Backend (1 ngày)
- When online: push local changes to backend API
- When offline: store changes in `sync_queue` table
- Sync strategy:
  - On app start: check network status
  - If online: sync local DB → PostgreSQL
  - If offline: use local DB only
- `apps/electron/sync/index.js`:
  - `syncToServer()` → POST local data to `/api/sync`
  - `syncFromServer()` → GET latest data from server

### Step 6: Polish (0.5 ngày)
- Auto-start at login (configurable)
- System tray icon (optional)
- Error handling: DB connection fail → show message

## 4. Acceptance Criteria

- [ ] **AC-1:** Electron app start được, hiển thị React renderer
- [ ] **AC-2:** Local SQLite DB được create + schema đúng
- [ ] **AC-3:** IPC: renderer ↔ main communication hoạt động
- [ ] **AC-4:** Thermal printer: in được hóa đơn (nếu có printer)
- [ ] **AC-5:** Sync: online → sync with backend, offline → local only
- [ ] **AC-6:** `tsc --noEmit` exit 0 cho electron code

## 5. Self-check

```bash
# Type check
cd apps/electron && npx tsc --noEmit

# Start electron
cd apps/electron && npm run dev
# App mở lên, hiển thị POS UI
# Test: add product, checkout, print receipt
```

## 6. Repair Loop

Nếu AC fail → debug IPC issue hoặc SQLite issue → `kanban_block`
