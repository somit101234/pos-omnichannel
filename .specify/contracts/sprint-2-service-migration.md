# Execution Contract: Sprint 2 — Service Layer Migration

**Compiled:** 2026-08-25
**Task Set:** Sprint 2 (7-10 ngày)
**Project:** pos-omnichannel

## 1. Scope

### Cho phép sửa
- `apps/server/src/modules/bom/bom.service.ts` — migrate → PrismaService
- `apps/server/src/modules/inventory/inventory.service.ts` — migrate → PrismaService
- `apps/server/src/modules/multi-store/multi-store.service.ts` — migrate → PrismaService
- `apps/server/src/modules/online-orders/online-orders.service.ts` — migrate → PrismaService
- `apps/server/src/modules/purchase/purchase.service.ts` — migrate → PrismaService
- `apps/server/src/modules/reports/reports.service.ts` — migrate → PrismaService
- `apps/server/src/modules/mobile-sync/mobile-sync.service.ts` — fix bcrypt
- `apps/server/src/modules/auth/auth.service.ts` — fix register
- `apps/server/src/modules/invoice/invoice.controller.ts` → connect service thật
- `apps/server/src/modules/invoice/invoice.service.ts` — remove placeholder

### Cấm sửa
- Không thay đổi Prisma schema (trừ khi SA approve)
- Không sửa controller files (Sprint 1 đã hoàn thành)
- Không sửa frontend/web code

## 2. Dependencies
- Sprint 1 hoàn thành (tất cả controller đã tạo)
- PrismaClient đã generated

## 3. Ordered Steps

### Step 1: Migrate BOM Service (1.5 ngày)
- Inject PrismaService vào constructor
- Thay Map/Array bằng Prisma queries:
  - `registerProduct` → `prisma.product.create`
  - `createBomItem` → `prisma.bomItem.create` với circular detection
  - `calculateCost` → recursive query với Prisma
- Keep unit test compatibility: inject mock PrismaClient cho tests

### Step 2: Migrate Inventory Service (1.5 ngày)
- Inject PrismaService
- Thay Map/Array bằng Prisma:
  - `registerStock` → `prisma.stock.upsert`
  - `autoDecreaseStock` → `prisma.stock.update`
  - `calculateVariance` → query từ Transaction + Stock
- Keep variance calculation logic (FR-029, FR-030)

### Step 3: Migrate Multi-Store Service (1 ngày)
- Inject PrismaService
- Thay Map/Array bằng Prisma:
  - `createStore` → `prisma.store.create`
  - `createWarehouse` → `prisma.warehouse.create`
  - `createStockTransfer` → transaction: update source - decrease, target + increase
- Keep stock transfer logic: auto-update both warehouses

### Step 4: Migrate Online-Orders Service (1 ngày)
- Inject PrismaService
- Thay Map/Array bằng Prisma:
  - `createOrder` → `prisma.onlineOrder.create`
  - `acceptOrder/rejectOrder/prepareOrder/deliverOrder` → status updates
  - `isOrderOverdue` → query với `where: { status: 'PENDING', createdAt: { lt: new Date(Date.now() - 15*60*1000) } }`

### Step 5: Migrate Purchase Service (1.5 ngày)
- Inject PrismaService
- Thay Map/Array bằng Prisma:
  - `createSupplier` → `prisma.supplier.create`
  - `createPurchaseOrder` → `prisma.purchaseOrder.create`
  - `receiveGoods` → update stock + weighted average cost
- Keep weighted average cost logic: `(oldQty × oldCost + newQty × newCost) / (oldQty + newQty)`

### Step 6: Migrate Reports Service (1 ngày)
- Inject PrismaService
- Thay Map/Array bằng Prisma:
  - `getDashboardKpis` → query Transaction + join Product
  - `getRevenueReport` → query với date range filter
  - `getProfitReport` → join Transaction + BOM cost

### Step 7: Fix Auth Register (0.5 ngày)
- Implement register endpoint trong auth.service.ts
- Use bcrypt: `await bcrypt.hash(password, 12)`
- Create user + set roles

### Step 8: Fix Mobile Sync Auth (0.5 ngày)
- Replace `hashed_${password}` với `bcrypt.hash(password, 12)`
- Add `import * as bcrypt from 'bcrypt'`
- Update login: `bcrypt.compare(password, user.passwordHash)`

### Step 9: Fix Invoice (0.5 ngày)
- Update invoice.controller.ts: fetch transaction by orderId from DB
- Connect to invoice.service.ts generateReceipt
- Remove placeholder return string

## 4. Acceptance Criteria

- [ ] **AC-1:** 7 service modules inject PrismaService trong constructor
- [ ] **AC-2:** CRUD operations read/write from PostgreSQL thật (không còn Map/Array)
- [ ] **AC-3:** Auth register create user với bcrypt hash (không còn mock)
- [ ] **AC-4:** Mobile sync auth dùng bcrypt.compare (không còn hashed_${password})
- [ ] **AC-5:** Invoice controller fetch transaction thật từ DB
- [ ] **AC-6:** Weighted average cost calculation đúng khi receive goods
- [ ] **AC-7:** Stock transfer auto-update source và target warehouse
- [ ] **AC-8:** BOM circular detection vẫn hoạt động với Prisma
- [ ] **AC-9:** `npx tsc --noEmit` exit 0
- [ ] **AC-10:** Unit tests pass với TestPrismaClient

## 5. Self-check

```bash
# Type check
npx tsc --noEmit

# Unit tests
npm run test

# Verify no Map/Array in-memory
grep -r "new Map\|new Array\|private.*: Map" apps/server/src/modules/bom apps/server/src/modules/inventory apps/server/src/modules/multi-store apps/server/src/modules/online-orders apps/server/src/modules/purchase apps/server/src/modules/reports
# Should only find in test files or interface definitions
```

## 6. Repair Loop

Nếu AC fail sau 3 lần thử → `kanban_block` với lý do cụ thể (error log + expected/actual)
