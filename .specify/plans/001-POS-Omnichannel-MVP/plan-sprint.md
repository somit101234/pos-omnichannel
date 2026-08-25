# SPRINT PLAN — POS Omnichannel MVP

**Ngày:** 2026-08-25
**Project:** pos-omnichannel
**Branch:** khoala-bot
**Overall Progress:** ~45%

---

## SPRINT 1: Backend Controller Gap (Sprint 0 — 5-7 ngày)

**Goal:** Thêm controller cho 5 backend modules đang thiếu để frontend có thể gọi API

**Tasks:**
- T005: Controller categories (CRUD endpoints)
- T006: Controller inventory (stock management, variance report)
- T013: Controller online-orders (accept/reject, status flow)
- T014: Controller multi-store (store CRUD, warehouse, transfer)
- T010: Controller platform-import + connect 3 adapters

**Dependencies:** Không phụ thuộc task nào trong Sprint 1

**Acceptance Criteria:**
- GET/POST/PUT/DELETE endpoints hoạt động cho 5 modules
- Platform import adapters parse được file Excel thật
- Controller inject đúng PrismaService hoặc service layer

**Verification:**
- `npx tsc --noEmit` exit 0
- Unit test cho controller: `npm run test modules/*`
- Endpoint test với curl: POST/GET/PUT/DELETE

---

## SPRINT 2: Service Layer Migration (Sprint 1 — 7-10 ngày)

**Goal:** Migrate 9 in-memory services → PrismaService thật

**Tasks:**
- T023: Migrate BOM service → Prisma (recursive cost calculation)
- T024: Migrate Inventory service → Prisma (stock management)
- T025: Migrate Multi-store service → Prisma (store/warehouse)
- T026: Migrate Online-orders service → Prisma (order status)
- T027: Migrate Purchase service → Prisma (supplier/PO)
- T028: Migrate Reports service → Prisma (revenue/profit)
- T029: Fix Auth register implementation (bcrypt thật)
- T030: Fix Mobile-sync auth (bcrypt thay vì hashed_${password})
- T031: Fix Invoice controller → kết nối service thật

**Dependencies:** Sprint 1 hoàn thành (controllers phải có trước)

**Acceptance Criteria:**
- Tất cả service inject PrismaService trong constructor
- CRUD operations đọc/ghi từ PostgreSQL thật
- Không còn Map/Array in-memory cho business logic
- Unit test vẫn pass với Prisma

**Verification:**
- `prisma generate` → PrismaClient generated
- Unit test với TestPrismaClient
- `npm run test` → 100% pass

---

## SPRINT 3: Frontend API Integration (Sprint 2 — 7-10 ngày)

**Goal:** Nối 12 route pages với backend API thật

**Tasks:**
- T032: Tạo `services/api.ts` — Axios client + JWT interceptor
- T033: Tạo `stores/` — Zustand stores (auth, cart, products, reports)
- T034: Tạo `utils/currency.ts` — VND formatting
- T035: Update 12 route pages: replace mock → API calls
  - login.tsx → auth API
  - dashboard.tsx → reports API
  - pos.tsx → POS/cart API
  - products.tsx → products CRUD API
  - inventory.tsx → inventory API
  - purchase.tsx → purchase/supplier API
  - staff.tsx → staff API
  - multi-store.tsx → multi-store API
  - platform-import.tsx → import API
  - reports.tsx → reports API
  - online-orders.tsx → online-orders API
  - shift.tsx → shift API

**Dependencies:** Sprint 2 hoàn thành (backend services phải dùng Prisma thật)

**Acceptance Criteria:**
- Tất cả 12 pages gọi API thật, không còn mock data
- JWT token được gửi đúng trong headers
- Loading state, error state, empty state hiển thị đúng
- Currency formatting đúng định dạng VND

**Verification:**
- `npx tsc --noEmit` exit 0
- Lighthouse score > 90 cho performance
- Manual test: đăng nhập → tạo product → POS checkout → xem report

---

## SPRINT 4: Mobile App (Sprint 3 — 10-14 ngày)

**Goal:** React Native app với screens: Login, POS, Reports + WatermelonDB sync

**Tasks:**
- T036: Expo setup + WatermelonDB schema
- T037: Mobile screens (Login, POS, Reports)
- T038: WatermelonDB sync với backend API
- T039: Mobile auth (JWT) + offline support

**Dependencies:** Sprint 2 hoàn thành (mobile-auth API phải có)

**Acceptance Criteria:**
- App install được trên Android/iOS simulator
- Login, POS, Reports screens hiển thị đúng
- Offline mode: dữ liệu lưu local, sync khi có mạng
- WatermelonDB conflict resolution hoạt động

**Verification:**
- `npx expo start` → app chạy trên simulator
- Test offline: disable network → app vẫn render data local
- Test sync: enable network → data sync với server

---

## SPRINT 5: Electron Desktop (Sprint 4 — 5-7 ngày)

**Goal:** Electron app với React renderer + better-sqlite3 + thermal printer

**Tasks:**
- T037: React renderer trong Electron
- T038: better-sqlite3 local DB + sync với PostgreSQL
- T039: Thermal printer integration (node-thermal-printer)

**Dependencies:** Sprint 2 hoàn thành (backend phải có auth + POS API)

**Acceptance Criteria:**
- Electron app chạy được, hiển thị POS UI
- Local SQLite DB lưu data
- Thermal printer in được hóa đơn
- Sync mechanism khi online

**Verification:**
- `npm run electron:dev` → app chạy
- `npx tsc --noEmit` exit 0
- Test in hóa đơn với thermal printer

---

## SPRINT 6: Test + Cleanup (Sprint 5 — 5-7 ngày)

**Goal:** Hoàn tất test, xóa debug files, code review

**Tasks:**
- T038: Xóa 7 debug E2E files
- T039: Hoàn tất unit tests (T033-T037)
- T040: E2E tests (T038-T040)

**Dependencies:** Tất cả sprints trước hoàn thành

**Acceptance Criteria:**
- 0 debug files còn sót
- Unit tests: 100% modules có test
- E2E tests: auth, pos, inventory pass
- Lint: 0 errors
- Typecheck: 0 errors

**Verification:**
- `npm run test` → 100% pass
- `npx playwright test` → 100% pass
- `npx tsc --noEmit` → 0 errors
- `eslint "src/**/*.ts" --fix` → 0 errors

---

## Dependency Map

```
Sprint 1 (Controllers)
  ↓
Sprint 2 (Service Migration)
  ↓
Sprint 3 (Frontend API)
  ↓           ↓
Sprint 4    Sprint 5
(Mobile)    (Electron) — chạy song song
  ↓           ↓
Sprint 6 (Test + Cleanup)
```

## Team Assignment

| Sprint | Lead | Support | Devs |
|---|---|---|---|
| 1 | dev1 | dev2 | 2 devs |
| 2 | dev2 | dev1 | 2 devs |
| 3 | dev1 | dev2 | 2 devs |
| 4 | dev2 | — | 1 dev (React Native) |
| 5 | dev1 | — | 1 dev (Electron) |
| 6 | qa | dev1+dev2 | team |

## Risks

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R01 | Backend API thay đổi trong Sprint 2-3 | Cao | SA review API contract trước khi dev code |
| R02 | WatermelonDB sync conflict phức tạp | TB | SA research pattern trước Sprint 4 |
| R03 | Thermal printer driver incompatibility | TB | Test driver compatibility early trong Sprint 5 |
| R04 | 2 devs có thể conflict khi cùng sửa module | TB | Define file ownership rõ ràng trong mỗi task |
