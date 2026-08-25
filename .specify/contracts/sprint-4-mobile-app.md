# Execution Contract: Sprint 4 — Mobile App (React Native)

**Compiled:** 2026-08-25
**Task Set:** Sprint 4 (10-14 ngày)
**Project:** pos-omnichannel

## 1. Scope

### Cho phép sửa
- `apps/mobile/` — toàn bộ mobile app code
- `apps/mobile/package.json` — add expo, react-native, watermelondb
- `apps/mobile/tsconfig.json` — configure
- `apps/mobile/app.tsx` — main entry
- `apps/mobile/src/screens/` — Login, POS, Reports screens
- `apps/mobile/src/services/` — API client
- `apps/mobile/src/database/` — WatermelonDB schema + sync
- `apps/mobile/src/stores/` — Zustand stores cho mobile

### Cấm sửa
- Không sửa backend code (trừ khi fix bug)
- Không sửa web/electron code
- Không thay đổi mobile auth API (đã có trong mobile-sync module)

## 2. Dependencies
- Sprint 2 hoàn thành (mobile-auth API dùng bcrypt thật)
- Backend POS API hoạt động

## 3. Ordered Steps

### Step 1: Expo Setup + WatermelonDB (2 ngày)
- `npx create-expo-app` hoặc setup từ template
- Install dependencies:
  - `expo` + `react-native`
  - `@nozbe/watermelondb` (offline DB)
  - `@nozbe/watermelondb/SQLite` (SQLite adapter)
  - `@react-navigation/native` + `@react-navigation/native-stack`
  - `@react-native-async-storage/async-storage`
- Configure tsconfig.json for React Native
- Setup navigation: LoginStack, MainTab (POS + Reports)

### Step 2: Database Schema (2 ngày)
- WatermelonDB schema:
  - Table: `users` (id, username, token, store_id)
  - Table: `products` (id, name, price, stock, store_id, updated_at)
  - Table: `transactions` (id, store_id, total, items_json, created_at)
  - Table: `sync_queue` (id, entity_type, entity_id, data, status, created_at)
- Migration: if table exists → skip, else create
- Sync strategy: WatermelonDB observer → push changes to server when online

### Step 3: Mobile Screens (4-5 ngày)

#### Login Screen (1 ngày)
- Form: username + password
- Call mobile-sync API: `POST /mobile/login`
- Store JWT token + user info
- Navigate to MainTab on success

#### POS Screen (2 ngày)
- Product grid (fetch from local DB or server)
- Cart: add/remove products, update qty
- Checkout: call `POST /mobile/carts/:cartId/checkout`
- Print receipt: trigger thermal printer (nếu có printer)
- Offline mode: data từ WatermelonDB local

#### Reports Screen (1.5 ngày)
- Dashboard KPIs: revenue, orders, top products
- Revenue/Profit report with date filter
- Fetch from `/mobile/dashboard/:storeId`, `/mobile/reports/revenue/:storeId`
- Export: share .xlsx hoặc generate local

### Step 4: Sync + Offline (2 ngày)
- Implement WatermelonDB sync:
  - Observer: when data changes → push to `sync_queue`
  - When online → send `sync_queue` entries to server
  - Conflict resolution: server wins (or last-write-wins)
- Background sync: khi app resume from background
- Network status indicator trong UI

### Step 5: Polish (1 ngày)
- Loading states, error states
- Touch feedback (Pressable)
- SafeAreaView cho all screens
- Test trên Android + iOS simulator

## 4. Acceptance Criteria

- [ ] **AC-1:** Expo app chạy được trên Android + iOS simulator
- [ ] **AC-2:** Login screen call API thật, store JWT token
- [ ] **AC-3:** POS screen: add products to cart, checkout, calculate total
- [ ] **AC-4:** Reports screen: display dashboard + revenue/profit
- [ ] **AC-5:** WatermelonDB: data persists after app restart
- [ ] **AC-6:** Offline mode: app vẫn render data từ local DB
- [ ] **AC-7:** Sync: khi online, data sync với server
- [ ] **AC-8:** `npx tsc --noEmit` exit 0 cho mobile

## 5. Self-check

```bash
# Type check mobile
cd apps/mobile && npx tsc --noEmit

# Test Expo
cd apps/mobile && npx expo start
# Mở trên Android/iOS simulator

# Test offline:
# 1. Disable network trong simulator
# 2. Add product to cart → app vẫn hoạt động
# 3. Re-enable network → sync queue gửi lên server
```

## 6. Repair Loop

Nếu AC fail → debug WatermelonDB sync issue, hoặc API connection issue → `kanban_block`
