# Execution Contract: Sprint 1 — Backend Controller Gap

**Compiled:** 2026-08-25
**Task Set:** Sprint 1 (5-7 ngày)
**Project:** pos-omnichannel

## 1. Scope

### Cho phép sửa
- `apps/server/src/modules/categories/categories.controller.ts` — tạo mới
- `apps/server/src/modules/inventory/inventory.controller.ts` — tạo mới
- `apps/server/src/modules/online-orders/online-orders.controller.ts` — tạo mới
- `apps/server/src/modules/multi-store/multi-store.controller.ts` — tạo mới
- `apps/server/src/modules/platform-import/platform-import.controller.ts` — tạo mới
- `apps/server/src/modules/platform-import/adapters/shopee.adapter.ts` — kiểm tra
- `apps/server/src/modules/platform-import/adapters/grabfood.adapter.ts` — kiểm tra
- `apps/server/src/modules/platform-import/adapters/befood.adapter.ts` — kiểm tra

### Cấm sửa
- Không sửa Prisma schema
- Không sửa frontend/web code
- Không sửa electron/mobile code
- Không thêm dependency mới

## 2. Dependencies
- PrismaClient đã generated (`npx prisma generate` phải pass)
- 5 service modules đã tồn tại (categories, inventory, online-orders, multi-store, platform-import)
- Platform adapters đã có code (Shopee/GrabFood/BeFood)

## 3. Ordered Steps

### Step 1: Controller Categories
- Tạo `categories.controller.ts` với endpoints:
  - POST /categories — create
  - GET /categories — list (filter by storeId)
  - GET /categories/:id — detail
  - PUT /categories/:id — update
  - DELETE /categories/:id — delete (block nếu product references)
- Inject CategoriesService (đã tồn tại)
- DTO validation: name required, max 100 chars, parent self-reference blocked

### Step 2: Controller Inventory
- Tạo `inventory.controller.ts` với endpoints:
  - GET /inventory/stock — list stock levels
  - GET /inventory/stock/:productId — single stock
  - POST /inventory/check — inventory check (theoretical vs actual)
  - GET /inventory/variance — variance report
  - GET /inventory/alerts — low stock alerts
- Inject InventoryService (đã tồn tại)
- DTO validation

### Step 3: Controller Online Orders
- Tạo `online-orders.controller.ts` với endpoints:
  - GET /online-orders — list (filter by status)
  - POST /online-orders/:id/accept — accept order
  - POST /online-orders/:id/reject — reject order
  - POST /online-orders/:id/prepare — prepare order
  - POST /online-orders/:id/deliver — deliver order
  - GET /online-orders/:id/overdue — check if overdue (>15min)
- Inject OnlineOrdersService (đã tồn tại)
- Status flow: PENDING → PROCESSING → READY → DELIVERED (or REJECTED)

### Step 4: Controller Multi-Store
- Tạo `multi-store.controller.ts` với endpoints:
  - POST /stores — create store
  - GET /stores — list stores
  - GET /stores/:id — store detail
  - PUT /stores/:id — update store
  - POST /stores/:id/warehouses — create warehouse
  - GET /stores/:id/warehouses — list warehouses
  - POST /stores/:id/transfers — create stock transfer
  - GET /stores/dashboard — revenue by store
- Inject MultiStoreService (đã tồn tại)
- DTO validation

### Step 5: Controller Platform Import
- Tạo `platform-import.controller.ts` với endpoints:
  - POST /import/preview — preview parsed Excel file
  - POST /import/commit — commit parsed orders to DB
  - GET /import/status/:orderId — check import status
- Inject PlatformImportService (đã tồn tại)
- Register 3 adapters: Shopee, GrabFood, BeFood
- File validation: chỉ accept .xlsx

## 4. Acceptance Criteria

- [ ] **AC-1:** Tất cả 5 controller files được tạo trong đúng modules
- [ ] **AC-2:** Mỗi controller inject đúng service layer tương ứng
- [ ] **AC-3:** DTO validation hoạt động (input sai → 400 Bad Request)
- [ ] **AC-4:** DELETE category block khi product references
- [ ] **AC-5:** Inventory check tính đúng variance = theoretical - actual
- [ ] **AC-6:** Online orders status flow đúng (PENDING→PROCESSING→READY→DELIVERED)
- [ ] **AC-7:** Multi-store stock transfer auto-update cả source và target warehouse
- [ ] **AC-8:** Platform import parse được file Excel thật của Shopee/GrabFood/BeFood
- [ ] **AC-9:** `npx tsc --noEmit` exit 0 cho toàn bộ server
- [ ] **AC-10:** Unit tests pass cho từng controller endpoint

## 5. Self-check

Trước khi提交, developer phải tự chạy:
```bash
# Type check
npx tsc --noEmit

# Unit tests
npm run test modules/categories modules/inventory modules/online-orders modules/multi-store modules/platform-import

# Manual API test
curl -X POST http://localhost:3000/categories -H "Content-Type: application/json" -d '{"name":"Test","storeId":"store_001"}'
```

## 6. Repair Loop

Nếu AC fail:
1. Đọc lỗi test → sửa code
2. Chạy lại test
3. Nếu vẫn fail sau 3 lần → `kanban_block` với lý do cụ thể
