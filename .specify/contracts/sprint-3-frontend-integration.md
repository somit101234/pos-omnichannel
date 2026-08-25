# Execution Contract: Sprint 3 — Frontend API Integration

**Compiled:** 2026-08-25
**Task Set:** Sprint 3 (7-10 ngày)
**Project:** pos-omnichannel

## 1. Scope

### Cho phép sửa
- `apps/web/src/services/api.ts` — tạo mới (Axios + JWT)
- `apps/web/src/stores/` — tạo mới (Zustand stores)
- `apps/web/src/utils/currency.ts` — tạo mới (VND formatting)
- `apps/web/src/routes/login.tsx` — update → API call
- `apps/web/src/routes/dashboard.tsx` — update → API call
- `apps/web/src/routes/pos.tsx` — update → API call
- `apps/web/src/routes/products.tsx` — update → API call
- `apps/web/src/routes/inventory.tsx` — update → API call
- `apps/web/src/routes/purchase.tsx` — update → API call
- `apps/web/src/routes/reports.tsx` — update → API call
- `apps/web/src/routes/online-orders.tsx` — update → API call
- `apps/web/src/routes/multi-store.tsx` — update → API call
- `apps/web/src/routes/platform-import.tsx` — update → API call
- `apps/web/src/routes/shift.tsx` — update → API call
- `apps/web/src/routes/staff.tsx` — update → API call

### Cấm sửa
- Không sửa backend code
- Không sửa electron/mobile code
- Không thay đổi routing structure (BrowserRouter + Routes đã đúng)

## 2. Dependencies
- Sprint 2 hoàn thành (backend services dùng Prisma thật)
- Backend API endpoints hoạt động (Sprint 1 controllers)

## 3. Ordered Steps

### Step 1: API Client (1 ngày)
- Tạo `services/api.ts`:
  - Axios instance base URL: `http://localhost:3000`
  - JWT interceptor: attach `Authorization: Bearer <token>`
  - Refresh token logic: tự động refresh khi 401
  - Error handling: translate 4xx/5xx → user-friendly messages
  - Types: define all DTOs (CreateProductDto, CreateOrderDto, etc.)

### Step 2: Zustand Stores (1.5 ngày)
- Tạo `stores/authStore.ts`:
  - state: user, token, isAuthenticated
  - actions: login, logout, refresh, hasRole
- Tạo `stores/cartStore.ts`:
  - state: items[], total
  - actions: addItem, removeItem, updateQty, clear
- Tạo `stores/productStore.ts`:
  - state: products[], selected
  - actions: fetchProducts, create, update, delete
- Tạo `stores/reportStore.ts`:
  - state: dashboard, revenue, profit
  - actions: fetchDashboard, fetchRevenue, fetchProfit

### Step 3: Currency Utils (0.5 ngày)
- Tạo `utils/currency.ts`:
  - `formatVND(amount: bigint | number): string` — "100.000 ₫"
  - `parseVND(str: string): bigint` — "100.000 ₫" → 100000n
  - `formatDecimal(value: string): string` — DECIMAL → human readable

### Step 4: Update 12 Route Pages (4-5 ngày)

#### Login (0.5 ngày)
- Replace mock auth → call `api.post('/auth/login', { username, password })`
- Show loading/error states
- Redirect to /dashboard on success

#### Dashboard (0.5 ngày)
- Replace mock data → call `api.get('/reports/dashboard/:storeId')`
- Show top 5 products from API

#### POS (1 ngày)
- Replace mock cart → use cartStore
- Add product: call `api.get('/products/:id')` or search by barcode
- Checkout: call `api.post('/pos/checkout', { items, paymentMethod })`
- Auto stock deduction handled by backend

#### Products (0.5 ngày)
- Replace mock → CRUD calls to `/products`
- Filter by category from API

#### Inventory (0.5 ngày)
- Replace mock → call `/inventory/stock`
- Show variance report from API

#### Purchase (0.5 ngày)
- Replace mock → CRUD calls to `/purchase/orders`
- Supplier list from API

#### Reports (0.5 ngày)
- Replace mock → call `/reports/revenue/:storeId` + `/reports/profit/:storeId`
- Filter by date range

#### Online Orders (0.5 ngày)
- Replace mock → call `/online-orders`
- Accept/reject from API

#### Multi-store (0.5 ngày)
- Replace mock → CRUD stores/warehouses from API
- Dashboard from API

#### Platform Import (0.5 ngày)
- Replace mock → file upload to `/import/preview` + `/import/commit`

#### Shift (0.5 ngày)
- Replace mock → call `/shift/start`, `/shift/:id/end`, `/shift/store/:storeId`

## 4. Acceptance Criteria

- [ ] **AC-1:** API client có JWT interceptor, refresh token logic
- [ ] **AC-2:** 4 Zustand stores hoạt động (auth, cart, product, report)
- [ ] **AC-3:** Currency formatting đúng VND (bigint → string)
- [ ] **AC-4:** Tất cả 12 route pages gọi API thật, không còn mock data
- [ ] **AC-5:** Loading state hiển thị đúng khi fetching
- [ ] **AC-6:** Error state hiển thị user-friendly messages
- [ ] **AC-7:** Empty state hiển thị đúng khi không có data
- [ ] **AC-8:** `npx tsc --noEmit` exit 0 cho web
- [ ] **AC-9:** Manual test: login → tạo product → POS checkout → xem report hoạt động

## 5. Self-check

```bash
# Type check web
cd apps/web && npx tsc --noEmit

# Verify no mock data remaining
grep -r "mockData\|mockProducts\|Mock.*:" apps/web/src/routes

# Manual test
npm run dev
# Visit /login, login, navigate all pages, verify API calls in Network tab
```

## 6. Repair Loop

Nếu AC fail sau 3 lần → `kanban_block` với error log
