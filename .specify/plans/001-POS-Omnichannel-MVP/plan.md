# Plan: POS Omnichannel MVP

**Spec:** .specify/specs/001-POS-Omnichannel-MVP/spec.md

## Technical Context

- **Ngôn ngữ/framework:** TypeScript + NestJS (backend), React + TypeScript (frontend), React Native Expo (mobile), Electron (desktop)
- **Database:** PostgreSQL (backend), better-sqlite3 (desktop local), WatermelonDB (mobile local)
- **Test framework:** Vitest (unit), Playwright (E2E), Supertest (API)
- **Build tool:** npm workspaces (monorepo) hoặc separate repos — recommendation: monorepo với TurboRepo cho dev tốc độ
- **Ràng buộc hiệu năng:** API < 300ms p95, BOM < 100ms, sync < 5s cho <1000 record

## Constitution Check

1. **Nguyên tắc 1 (không dùng float cho tiền tệ):** Đúng — schema dùng DECIMAL(15,0) cho tất cả price fields.
2. **Nguyên tắc 2 (không circular reference BOM):** Đúng — Prisma constraint + service layer kiểm tra.
3. **Nguyên tắc 3 (mobile offline):** Đúng — WatermelonDB local-first, sync adapter.
4. **Nguyên tắc 4 (multi-store store isolation):** Đúng — mọi query filter theo store_id.
5. **Nguyên tắc 5 (RBAC middleware):** Đúng — NestJS Guard + Decorator cho mọi protected route.
6. **Nguyên tắc 6 (không thêm dependency):** Đúng — dùng stack đã định trong manifest.
7. **Nguyên tắc 7 (live shopping research only):** Đúng — module `live-shopping-research` chỉ chứa docs/research, không code production.
8. **Nguyên tắc 8 (Electron direct SQLite):** Đúng — `better-sqlite3` trong Electron main process.

## Kiến trúc / cách tiếp cận

### 1. Monorepo structure

```
pos-omnichannel/
├── apps/
│   ├── server/           # NestJS backend
│   ├── web/              # React + TypeScript (POS Desktop Web)
│   └── electron/         # Electron desktop app
├── packages/
│   ├── shared/           # Shared types, utils, constants
│   └── config/           # ESLint, TypeScript configs
├── prisma/
│   └── schema.prisma     # Database schema
└── e2e/
    └── tests/            # Playwright E2E tests
```

### 2. Database Schema — PostgreSQL + Prisma

**Core entities (table):**
- `User` — id, username, passwordHash, email, phone, role, isActive, loginAttempts, lockedUntil, storeId (FK)
- `Store` — id, name, address, phone, taxCode, settings, ownerId (FK)
- `Warehouse` — id, storeId (FK), name, address
- `Product` — id, storeId (FK), name, barcode, categoryId (FK), unit, costPrice (DECIMAL), salePrice (DECIMAL), minStock, isBom, bomLevel, bomParentId (FK→Product)
- `BomItem` — id, bomProductId (FK), ingredientProductId (FK), quantity, bomLevel
- `Category` — id, storeId (FK), name, parentId (FK→Category)
- `Stock` — id, productId (FK), warehouseId (FK), quantity, lastUpdated
- `Transaction` — id, storeId (FK), cashierId (FK), type (SALE/PURCHASE/TRANSFER), status, total, paymentMethod, createdAt
- `TransactionItem` — id, transactionId (FK), productId (FK), quantity, price, total
- `Supplier` — id, name, phone, address
- `PurchaseOrder` — id, supplierId (FK), storeId (FK), status, createdAt
- `Shift` — id, storeId (FK), cashierId (FK), startTime, endTime, status, totalSales
- `OnlineOrder` — id, storeId (FK), platform (SHOPEE/GRABFOOD/BEOFORD), orderNo, status, platformFee, createdAt
- `AuditLog` — id, storeId (FK), userId, action, entityType, entityId, createdAt

**Indexes:**
- `Product.barcode` UNIQUE
- `User.username` UNIQUE
- `Transaction.storeId + createdAt` (composite)
- `Stock.productId + warehouseId` UNIQUE

### 3. NestJS Backend Structure

```
apps/server/src/
├── main.ts               # Bootstrap
├── app.module.ts
├── common/
│   ├── guards/           # RBAC Guard
│   ├── interceptors/     # Logging, Error handling
│   ├── middleware/        # Auth middleware
│   └── decorators/       # Roles decorator
├── modules/
│   ├── auth/             # US1 — JWT, login, lock, RBAC
│   ├── pos/              # US2 — Cart, checkout, inventory deduction
│   ├── products/         # US3 — CRUD, barcode, unit conversion
│   ├── bom/              # US4 — BOM creation, recursive cost calculation
│   ├── purchase/         # US5 — Supplier, PO, receiving
│   ├── inventory/        # US6 — Stock check, variance, low-stock alert
│   ├── reports/          # US7 — Dashboard, revenue, profit, Excel export
│   ├── invoice/          # US8 — Thermal receipt template, reprint
│   ├── platform-import/  # US9 — Shopee/GrabFood/BeFood adapter
│   ├── categories/       # US10 — Category CRUD, hierarchy
│   ├── staff/            # US11 — Staff management
│   ├── shift/            # US12 — Shift management
│   ├── online-orders/    # US13 — Online order management
│   ├── multi-store/      # US14 — Store CRUD, transfer, summary
│   └── mobile-sync/      # US15 — REST API for mobile app
```

### 4. Frontend (Web/POS)

```
apps/web/src/
├── main.tsx
├── routes/               # React Router
│   ├── login.tsx
│   ├── dashboard.tsx
│   ├── pos/              # POS grid, cart
│   ├── products/         # Product CRUD
│   ├── reports/          # Revenue charts, export
│   ├── inventory/        # Stock check
│   ├── online-orders/    # Online order management
│   ├── multi-store/      # Store management
│   └── settings/         # System settings
├── components/           # Reusable MUI/AntD components
├── stores/               # Zustand stores
├── services/             # API client (Axios + Socket.io)
├── types/                # TypeScript interfaces
└── utils/
    └── currency.ts       # DECIMAL formatting
```

### 5. Mobile App (React Native)

```
apps/mobile/
├── App.tsx
├── screens/
│   ├── LoginScreen.tsx
│   ├── PosScreen.tsx     # Mobile POS
│   ├── ReportScreen.tsx
│   └── RefundScreen.tsx
├── stores/               # Zustand stores
├── services/
│   ├── api.ts            # REST API client
│   └── sync.ts           # WatermelonDB sync adapter
├── database/
│   └── schema.ts         # WatermelonDB schema
└── utils/
    └── printer.ts        # Thermal printer integration
```

### 6. Real-time Communication

- **Socket.io namespace:** `/stores/{storeId}` — mỗi store namespace cách ly events.
- **Events:**
  - `order:new` → khi có đơn online mới
  - `stock:low` → cảnh báo tồn thấp
  - `order:status` → thay đổi trạng thái đơn hàng
  - `shift:alert` → cảnh báo ca > 8h

### 7. Offline Mode Architecture

- **Mobile:** WatermelonDB local-first. Mỗi mutation ghi local → background sync queue → khi online đẩy lên server qua REST API.
- **Conflict resolution:** last-write-wins dựa trên `updatedAt` timestamp + manual resolve nếu cần.
- **Desktop Electron:** better-sqlite3 local DB. Sync với backend PostgreSQL khi online (background job).

### 8. AI Prediction (Research only in v1)

- Module `research/` chỉ chứa:
  - `tiktok-shop-api-notes.md` — research notes về TikTok Shop API
  - `youtube-shopping-api-notes.md` — research notes về Youtube Shopping
  - `live-selling-trends.md` — AI-driven live selling trends analysis
- **Không có code production** cho AI prediction trong v1.
- **Recommendation cho v2:** Python microservice với `scikit-learn` (LinearRegression + ARIMA) + `xgboost` cho non-linear patterns. Input: historical sales data từ PostgreSQL. Output: daily revenue forecast ±5%.

## Complexity Tracking

| Vi phạm constitution | Lý do bắt buộc | Không làm thì sao |
|---|---|---|
| US16 Live Shopping API không code trong v1 | Spec明确要求 research only, không tích hợp | Nếu code sẽ tăng scope, chậm MVP |
