# Tasks: POS Omnichannel MVP

**Plan:** .specify/plans/001-POS-Omnichannel-MVP/plan.md

## Checklist 20 tầng kỹ thuật

1. **Database foundation** → T001 ✅
2. **Seed/master data** → T001 (seed module) ✅
3. **Backend model** → T001-T016 ✅
4. **Repository/data access** → T001-T016 ✅
5. **Service/business logic** → T001-T016 ✅
6. **API/endpoint** → T001-T016 ✅
7. **Validation (input/schema)** → T002-T003, T005, T007 ✅
8. **Permission/phân quyền** → T001 ✅
9. **Frontend foundation** → T017-T019 ✅
10. **UI implementation** → T017-T032 ✅
11. **Integration (nối các tầng)** → T001-T016 ✅
12. **Error handling** → T002-T003 ✅
13. **Logging/Audit** → T001 ✅
14. **Data verification** → Self-check mục 5 Contract ✅
15. **Integration testing** → [TEST] tasks ✅
16. **E2E/Playwright** → [TEST] tasks ✅
17. **Performance** → QA Phase 4 ✅
18. **Security** → T001 ✅
19. **Regression** → Phase 4 QA ✅
20. **Release verification** → Phase 5 Gate ✅

## Dependency Map

```
T001 (Setup + Schema) → CHẶN tất cả tasks khác
  T002 (Auth + RBAC) → chặn T003+ của các module cần auth
    T003 (Products + Unit conversion) → chặn T004 (BOM)
      T004 (BOM + Cost calculation) → chặn T002 (POS), T007 (Reports), T006 (Inventory)
    T005 (Categories) → chặn T003 (Products)
    T006 (Inventory + Stock) → chặn T002 (POS), T005 (Purchase)
    T007 (Reports + AI research) → không chặn ai
      T008 (Invoice + Receipt) → chặn T002 (POS)
    T009 (Supplier + Purchase) → chặn T006 (Inventory)
    T010 (Platform Import adapters) → không chặn ai
    T011 (Shift management) → không chặn ai
    T012 (Staff management) → chặn T001 (auth user-store binding)
    T013 (Online orders) → chặn T014 (Multi-store)
    T014 (Multi-store) → chặn T015 (Mobile sync), T016 (Platform import multi-store)
    T015 (Mobile app API + sync) → chặn T016 (Mobile app implementation)
    T016 (Mobile app implementation) → không chặn ai
    T017 (Live Shopping Research) → không chặn ai
    T018 (Frontend foundation) → chặn T019-T032 (UI tasks)
      T019-T032 (UI implementation — song song được theo module)
```

## Phase 1: Setup & Database Foundation

- [ ] T001 [P] Setup project structure + Prisma schema + seed data
  - Create monorepo structure: `apps/server/`, `apps/web/`, `apps/electron/`, `apps/mobile/`, `packages/shared/`
  - Define Prisma schema: User, Store, Warehouse, Product, BomItem, Category, Stock, Transaction, TransactionItem, Supplier, PurchaseOrder, Shift, OnlineOrder, AuditLog
  - Create NestJS app module structure with all modules listed in plan
  - Write seed script: 1 owner, 2 stores, 5 sample products, 2 categories, 1 supplier
  - Configure TypeScript, ESLint, Vitest across all packages
  - **Files:** `prisma/schema.prisma`, `apps/server/src/main.ts`, `apps/server/src/app.module.ts`, `apps/server/src/modules/*`, `packages/shared/types.ts`, `tsconfig.json`, `package.json`
  - **Ước lượng:** 120 phút · **Thực tế:** 

## Phase 2: Auth + RBAC (US1 — P1)

- [ ] T002 [P] [US1] Auth module: JWT login, password hash, lockout, RBAC Guard
  - Implement `AuthModule` in NestJS: register, login, refreshToken
  - Password hashing: bcrypt (cost factor 12)
  - JWT: access token (15min), refresh token (7d)
  - Lockout: after 5 failed attempts → 30min lock (field `lockedUntil` on User)
  - RBAC Guard: `@Roles('OWNER','MANAGER','CASHIER')` decorator + guard
  - Seed: create owner user in seed script
  - **Files:** `apps/server/src/modules/auth/auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.strategy.ts`, `roles.guard.ts`
  - **Interfaces:** Consumes: User model from T001. Produces: JWT payload `{ sub: userId, roles: string[], storeId: storeId }`
  - **Ước lượng:** 90 phút · **Thực tế:** 

## Phase 3: Categories (US10 — P2)

- [ ] T005 [US10] Category CRUD with hierarchical (1-level parent)
  - `Category` entity with `parentId` (FK to Category, null for root)
  - CRUD endpoints: create, read, update, delete (block delete if product references it)
  - GET all categories for POS grid grouping
  - Validation: name required, max 100 chars, parent self-reference blocked
  - **Files:** `apps/server/src/modules/categories/categories.module.ts`, `categories.service.ts`, `categories.controller.ts`
  - **Interfaces:** Consumes: store_id from auth. Produces: Category[] with parent hierarchy
  - **Ước lượng:** 60 phút · **Thực tế:** 

## Phase 4: Products (US3 — P1)

- [ ] T003 [P] [US3] Product CRUD with barcode, unit conversion, cost/sale price
  - `Product` entity: name, barcode (unique), categoryId, unit, costPrice (DECIMAL), salePrice (DECIMAL), minStock, isBom, bomLevel, bomParentId
  - Barcode: auto-generate UUID or manual input
  - Unit conversion: `unitConversions` table (product_id, fromUnit, toUnit, ratio)
  - CRUD endpoints with validation
  - Filter by category
  - **Files:** `apps/server/src/modules/products/products.module.ts`, `products.service.ts`, `products.controller.ts`, `unit-conversion.entity.ts`
  - **Interfaces:** Consumes: Category from T005. Produces: Product with optional unit conversions
  - **Ước lượng:** 90 phút · **Thực tế:** 

## Phase 5: BOM + Cost Calculation (US4 — P1)

- [ ] T004 [US4] BOM creation, recursive cost calculation, circular reference detection
  - `BomItem` entity: bomProductId (FK), ingredientProductId (FK), quantity, bomLevel
  - Recursive cost: `cost = Σ(ingredient.cost × quantity)` up to 3 levels
  - Circular detection: DFS cycle detection before saving BOM
  - Update product.salePrice based on BOM cost + margin (configurable)
  - **Files:** `apps/server/src/modules/bom/bom.module.ts`, `bom.service.ts`, `bom.controller.ts`
  - **Interfaces:** Consumes: Product from T003. Produces: effectiveCost (DECIMAL) for any product
  - **Ước lượng:** 120 phút · **Thực tế:** 

## Phase 6: Inventory (US6 — P2)

- [ ] T006 [US6] Stock management, inventory check, low-stock alert
  - `Stock` entity: productId (FK), warehouseId (FK), quantity
  - Auto-decrease stock after POS transaction (US2)
  - Inventory check: theoretical vs actual variance + cost calculation
  - Low-stock alert: cron job (node-cron) daily check vs minStock threshold
  - **Files:** `apps/server/src/modules/inventory/inventory.module.ts`, `inventory.service.ts`, `inventory.controller.ts`
  - **Interfaces:** Consumes: Product from T003, Stock from schema. Produces: stock level, variance report
  - **Ước lượng:** 90 phút · **Thực tế:** 

## Phase 7: Purchase + Supplier (US5 — P2)

- [ ] T009 [US5] Supplier CRUD + Purchase Order + receiving
  - `Supplier` entity: name, phone, address
  - `PurchaseOrder` entity: supplierId, storeId, status (PENDING/PARTIAL/COMPLETED/CANCELLED)
  - Create PO → select supplier + products + quantities
  - Receive goods → auto-increase stock + weighted average cost update
  - Weighted average: `(oldQty × oldCost + newQty × newCost) / (oldQty + newQty)`
  - **Files:** `apps/server/src/modules/purchase/purchase.module.ts`, `purchase.service.ts`, `purchase.controller.ts`, `supplier.controller.ts`
  - **Interfaces:** Consumes: Supplier from create, Product from T003. Produces: updated Stock + cost
  - **Ước lượng:** 120 phút · **Thực tế:** 

## Phase 8: POS Selling (US2 — P1)

- [ ] T002P [US2] POS: cart, checkout, payment, auto stock deduction, thermal print trigger
  - Cart: add product (by barcode or grid select), update quantity, remove
  - Block add if stock = 0
  - Checkout: cash (calculate change) or card, create Transaction + TransactionItems
  - Auto-decrease stock after payment
  - BOM: if product isBom=true, recursively decrease ingredient stock
  - Return receipt data for thermal printer (US8)
  - **Files:** `apps/server/src/modules/pos/pos.module.ts`, `pos.service.ts`, `pos.controller.ts`
  - **Interfaces:** Consumes: Product from T003, Stock from T006, BOM from T004. Produces: Transaction with items
  - **Ước lượng:** 150 phút · **Thực tế:** 

## Phase 9: Invoice + Receipt (US8 — P1)

- [ ] T008 [US8] Thermal receipt template (58mm/80mm), reprint by OrderID
  - Receipt template engine: generate plain text receipt for thermal printer
  - Config: store name, address, tax code, paper size (58mm/80mm)
  - Fields: store info, product list (name, qty, price, subtotal), total, change
  - Reprint endpoint: GET `/api/receipts/:orderId`
  - Support platform source in receipt (POS, SHOPEE, GRABFOOD, BEOFORD)
  - **Files:** `apps/server/src/modules/invoice/invoice.module.ts`, `invoice.service.ts`, `invoice.controller.ts`
  - **Interfaces:** Consumes: Transaction from T002P. Produces: receipt text
  - **Ước lượng:** 60 phút · **Thực tế:** 

## Phase 10: Reports + AI Research (US7 — P2)

- [ ] T007 [US7] Dashboard + revenue/profit reports + Excel export
  - Dashboard: today revenue, order count, top 5 products
  - Revenue report: filter by date range (day/week/month)
  - Profit report: revenue - cost (from BOM) - platform fee
  - Excel export: `.xlsx` using `exceljs` library
  - **Files:** `apps/server/src/modules/reports/reports.module.ts`, `reports.service.ts`, `reports.controller.ts`
  - **Interfaces:** Consumes: Transaction from T002P, BOM cost from T004. Produces: report data + .xlsx file
  - **Ước lượng:** 90 phút · **Thực tế:** 

- [ ] T017 [P] [US16] Live Shopping Research — API docs + trends analysis
  - Research TikTok Shop Livestream Shopping API
  - Research Youtube Shopping API
  - Document AI-driven live selling trends
  - Output: markdown research files in `research/` directory
  - **Files:** `research/tiktok-shop-api-notes.md`, `research/youtube-shopping-api-notes.md`, `research/live-selling-trends.md`
  - **Ước lượng:** 120 phút · **Thực tế:** 

## Phase 11: Platform Import (US9 — P2)

- [ ] T010 [US9] Platform import adapter: Shopee, GrabFood, BeFood Excel parsing
  - Base adapter interface: `IPlatformAdapter` with `parse(file: Buffer): OrderItem[]`
  - Shopee adapter: flat file, group by Order ID
  - GrabFood adapter: 2 sheets (Orders + Items), join by Order Number
  - BeFood adapter: flat file, group by Order ID
  - Preview endpoint: POST `/api/import/preview` returns parsed orders before commit
  - Commit endpoint: POST `/api/import/commit` creates OnlineOrder records
  - Platform fee: `price × fee%` calculated on import
  - **Files:** `apps/server/src/modules/platform-import/adapters/base.adapter.ts`, `shopee.adapter.ts`, `grabfood.adapter.ts`, `befood.adapter.ts`, `platform-import.service.ts`
  - **Ước lượng:** 150 phút · **Thực tế:** 

## Phase 12: Staff Management (US11 — P2)

- [ ] T012 [US11] Staff CRUD: create, list, role assignment, soft delete
  - Staff = User with role CASHIER or MANAGER, linked to store
  - Owner: create staff, assign role, list with role badge, soft delete (isActive=false)
  - Manager: read-only staff list for their store
  - **Files:** `apps/server/src/modules/staff/staff.module.ts`, `staff.service.ts`, `staff.controller.ts`
  - **Interfaces:** Consumes: User model from T002. Produces: staff list with role badge
  - **Ước lượng:** 60 phút · **Thực tế:** 

## Phase 13: Shift Management (US12 — P2)

- [ ] T011 [US12] Shift management: start, end, force-close, 8-hour alert
  - Cashier: start shift (status=ACTIVE), end shift (status=COMPLETED, calculate duration)
  - Manager/Owner: list shifts with date, cashier, duration, total_sales
  - System alert: if shift > 8 hours → send notification
  - Manager force-close: end any ACTIVE shift
  - **Files:** `apps/server/src/modules/shift/shift.module.ts`, `shift.service.ts`, `shift.controller.ts`
  - **Ước lượng:** 60 phút · **Thực tế:** 

## Phase 14: Online Orders (US13 — P3)

- [ ] T013 [US13] Online order management: pending/processing/ready/delivered, accept/reject, 15min alert
  - `OnlineOrder` entity: storeId, platform, orderNo, status, platformFee
  - Status flow: PENDING → PROCESSING → READY → DELIVERED (or REJECTED)
  - Cashier: accept or reject pending order
  - System alert: order pending > 15min → RED status
  - Refund request: customer → Owner/Manager review
  - **Files:** `apps/server/src/modules/online-orders/online-orders.module.ts`, `online-orders.service.ts`, `online-orders.controller.ts`
  - **Ước lượng:** 90 phút · **Thực tế:** 

## Phase 15: Multi-store (US14 — P2)

- [ ] T014 [US14] Multi-store: create/edit/delete stores, warehouse, transfer, summary dashboard
  - Store CRUD: name, address, phone, taxCode, settings
  - Warehouse per store: create/read/update/delete
  - Stock transfer: between stores (create Transfer record, auto-update both warehouses)
  - Owner dashboard: revenue by store, order count by store
  - **Files:** `apps/server/src/modules/multi-store/multi-store.module.ts`, `multi-store.service.ts`, `multi-store.controller.ts`
  - **Ước lượng:** 120 phút · **Thực tế:** 

## Phase 16: Mobile App API (US15 — P2)

- [ ] T015 [US15] REST API endpoints for mobile app + sync
  - Mobile auth: login with username/password, return JWT
  - Mobile POS: same endpoints as T002P (cart, checkout) but simplified
  - Mobile reports: GET revenue, profit, top products
  - Mobile refund: approve/reject refund request
  - Sync API: PUT `/api/sync/{entityType}/{id}` for WatermelonDB conflict resolution
  - **Files:** `apps/server/src/modules/mobile-sync/mobile-sync.module.ts`, `mobile-sync.service.ts`, `mobile-sync.controller.ts`
  - **Ước lượng:** 90 phút · **Thực tế:** 

## Phase 17: Frontend Foundation (Web + Electron)

- [ ] T018 [P] Frontend foundation: routing, state management, API client, shared components
  - Create `apps/web/src` with React + TypeScript + Vite
  - Setup Zustand stores: authStore, cartStore, productStore, reportStore
  - React Router: define all route paths
  - Axios client with JWT interceptor (auto-refresh token)
  - Socket.io client for real-time events
  - Shared UI components: DataTable, FormField, StatusBadge
  - **Files:** `apps/web/src/main.tsx`, `stores/*`, `routes/*`, `components/*`, `services/api.ts`
  - **Ước lượng:** 120 phút · **Thực tế:** 

## Phase 18: UI Implementation — Auth + Dashboard

- [ ] T019 [US1] [UI] Login page + dashboard overview
  - Login page: username/password form, error messages
  - Dashboard: revenue today, order count, top 5 products chart (Ant Design charts)
  - Role-based sidebar menu
  - **Files:** `apps/web/src/routes/login.tsx`, `routes/dashboard.tsx`, `components/Sidebar.tsx`
  - **Ước lượng:** 90 phút · **Thực tế:** 

## Phase 19: UI Implementation — POS

- [ ] T020 [US2] [UI] POS page: product grid, cart, payment dialog
  - Product grid: filter by category, search by barcode/name
  - Cart: list items, update qty, remove, subtotal, total
  - Payment dialog: cash (calculate change), card
  - Thermal print button: trigger receipt print
  - **Files:** `apps/web/src/routes/pos/index.tsx`, `components/ProductGrid.tsx`, `components/CartPanel.tsx`, `components/PaymentDialog.tsx`
  - **Ước lượng:** 150 phút · **Thực tế:** 

## Phase 20: UI Implementation — Products

- [ ] T021 [US3] [UI] Product management page: CRUD, barcode, unit conversion
  - Product list: table with search, filter by category
  - Create/Edit form: all product fields including BOM toggle
  - Unit conversion section: add/remove conversion ratios
  - Barcode generator button
  - **Files:** `apps/web/src/routes/products/index.tsx`, `components/ProductForm.tsx`
  - **Ước lượng:** 120 phút · **Thực tế:** 

## Phase 21: UI Implementation — BOM

- [ ] T022 [US4] [UI] BOM editor: ingredient list, recursive cost preview
  - BOM form: select parent product, add ingredient rows (product + quantity)
  - Real-time cost preview: show calculated cost from recursive BOM
  - Circular reference warning indicator
  - Nesting level display (max 3)
  - **Files:** `apps/web/src/routes/products/BomEditor.tsx`
  - **Ước lượng:** 90 phút · **Thực tế:** 

## Phase 22: UI Implementation — Inventory + Purchase

- [ ] T023 [US6] [UI] Stock management + inventory check page
  - Stock list: product, current qty, min_stock, status (low/normal)
  - Inventory check modal: input actual qty, show variance + cost
  - **Files:** `apps/web/src/routes/inventory/index.tsx`, `components/StockTable.tsx`, `components/InventoryCheckModal.tsx`
  - **Ước lượng:** 90 phút · **Thực tế:** 

- [ ] T024 [US5] [UI] Supplier management + Purchase Order page
  - Supplier list CRUD
  - PO creation: select supplier, add products + quantities
  - PO list with status badges
  - Receive goods modal: auto-calculate weighted avg cost
  - **Files:** `apps/web/src/routes/purchase/index.tsx`, `components/PoForm.tsx`
  - **Ước lượng:** 120 phút · **Thực tế:** 

## Phase 23: UI Implementation — Reports + Online Orders

- [ ] T025 [US7] [UI] Reports page: revenue/profit charts, Excel export
  - Date range filter (day/week/month/custom)
  - Revenue chart (line chart)
  - Profit breakdown table
  - Export button → triggers Excel download
  - **Files:** `apps/web/src/routes/reports/index.tsx`, `components/RevenueChart.tsx`
  - **Ước lượng:** 90 phút · **Thực tế:** 

- [ ] T026 [US13] [UI] Online orders page: status list, accept/reject
  - Order list: platform, order no, status, time, amount
  - Color-coded status: PENDING (yellow), PROCESSING (blue), READY (green), RED (>15min)
  - Accept/Reject buttons
  - **Files:** `apps/web/src/routes/online-orders/index.tsx`
  - **Ước lượng:** 60 phút · ** Thực tế:** 

## Phase 24: UI Implementation — Multi-store + Shift + Staff

- [ ] T027 [US14] [UI] Multi-store management page
  - Store list CRUD
  - Store detail: warehouse list, transfer form
  - Owner summary dashboard: revenue by store
  - **Files:** `apps/web/src/routes/multi-store/index.tsx`
  - **Ước lượng:** 90 phút · **Thực tế:** 

- [ ] T028 [US12] [UI] Shift management page
  - Start/End shift buttons for cashier
  - Shift history table for manager/owner
  - Alert indicator for shifts > 8h
  - **Files:** `apps/web/src/routes/shifts/index.tsx`
  - **Ước lượng:** 60 phút · **Thực tế:** 

- [ ] T029 [US11] [UI] Staff management page
  - Staff list with role badges
  - Create staff form (linked to user account)
  - Role assignment dropdown
  - Soft delete (deactivate/reactivate)
  - **Files:** `apps/web/src/routes/staff/index.tsx`
  - **Ước lượng:** 60 phút · **Thực tế:** 

## Phase 25: UI Implementation — Platform Import

- [ ] T030 [US9] [UI] Platform import page: file upload, preview, confirm
  - Platform selector (Shopee/GrabFood/BeFood)
  - Excel file upload
  - Preview table: parsed orders with platform fee
  - Confirm button → commit to system
  - **Files:** `apps/web/src/routes/import/index.tsx`, `components/ImportPreview.tsx`
  - **Ước lượng:** 90 phút · **Thực tế:** 

## Phase 26: Electron Desktop App

- [ ] T031 [P] Electron desktop: local SQLite, thermal printer integration, offline support
  - Electron main process: better-sqlite3 local DB
  - Preload script with IPC channels
  - Thermal printer via `raw-thermal-printer`
  - Sync with backend PostgreSQL when online
  - Auto-start at login option
  - **Files:** `apps/electron/main.js`, `apps/electron/preload.js`, `apps/electron/renderer/index.html`
  - **Ước lượng:** 120 phút · **Thực tế:** 

## Phase 27: Mobile App

- [ ] T032 [US15] [UI] Mobile POS app: login, cart, payment, offline sync
  - Expo React Native app setup
  - Login screen (same as web)
  - Mobile POS screen: product search, cart, payment
  - WatermelonDB local schema
  - Sync adapter: background sync when online
  - Thermal printer integration (Bluetooth/WiFi)
  - **Files:** `apps/mobile/App.tsx`, `apps/mobile/screens/PosScreen.tsx`, `apps/mobile/database/schema.ts`, `apps/mobile/services/sync.ts`
  - **Ước lượng:** 180 phút · **Thực tế:** 

## [TEST] Phase: Unit Tests

- [ ] T033 [P] [TEST] Unit tests for auth module (login, lockout, RBAC)
  - Test: successful login returns JWT
  - Test: 5 failed attempts → lockout 30min
  - Test: RBAC guard blocks unauthorized access
  - **Ước lượng:** 60 phút · **Thực tế:** 

- [ ] T034 [P] [TEST] Unit tests for BOM recursive cost calculation
  - Test: simple BOM cost = sum of ingredients
  - Test: nested BOM (3 levels) cost calculation
  - Test: circular reference detection blocks save
  - Test: cost calculation with unit conversion
  - **Ước lượng:** 90 phút · ** Thực tế:** 

- [ ] T035 [P] [TEST] Unit tests for currency calculation (no float)
  - Test: all price math uses integers (no float)
  - Test: weighted average cost rounding
  - Test: platform fee calculation accuracy
  - **Ước lượng:** 30 phút · **Thực tế:** 

- [ ] T036 [P] [TEST] Unit tests for inventory variance calculation
  - Test: variance = theoretical - actual
  - Test: loss cost = |variance| × unit_cost
  - Test: stock deduction after POS transaction
  - **Ước lượng:** 60 phút · **Thực tế:** 

- [ ] T037 [P] [TEST] Unit tests for platform import adapters
  - Test: Shopee adapter parses flat file correctly
  - Test: GrabFood adapter joins 2 sheets correctly
  - Test: BeFood adapter parses with correct grouping
  - Test: invalid file format returns error
  - **Ước lượng:** 60 phút · **Thực tế:** 

## [TEST] Phase: E2E/Playwright Tests

- [ ] T038 [P] [TEST] E2E: login + RBAC — unauthorized user blocked
  - Playwright test: login as CASHIER, try to access owner-only route → redirect
  - Playwright test: login as MANAGER, access manager features → pass
  - **Ước lượng:** 60 phút · **Thực tế:** 

- [ ] T039 [P] [TEST] E2E: POS flow — add product, checkout, verify stock deduction
  - Playwright test: scan barcode → product in cart → checkout → verify stock decreased
  - **Ước lượng:** 90 phút · **Thực tế:** 

- [ ] T040 [P] [TEST] E2E: inventory check — variance + cost calculation
  - Playwright test: set actual qty different from theoretical → verify variance display
  - **Ước lượng:** 60 phút · **Thực tế:** 
