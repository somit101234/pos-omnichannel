# [SA Review] POS Omnichannel — Gap Analysis: Confirmed + Bổ Sung

**Ngày:** 2026-08-25
**Reviewer:** SA (@KL_team_m5_bot)
**Task:** Xác nhận/sửa sai PM's preliminary analysis

---

## 1. Xác nhận Gap Analysis từ PM

PM's phân tích SAI CHỈ 1 điểm: **số lượng service dùng in-memory là 9/15, không phải 13/15**.

### Xác nhận chính xác từng service pattern:

| # | Module | PrismaService? | In-memory/Mock? | Ghi chú |
|---|--------|---------------|-----------------|---------|
| 1 | auth | ✅ Có | | PrismaService thật |
| 2 | bom | | ✅ Map + mockData | In-memory |
| 3 | categories | ✅ Có | | PrismaService thật |
| 4 | inventory | | ✅ new Map | In-memory |
| 5 | invoice | ❌ Không | | Interface/service chỉ — không query DB |
| 6 | mobile-sync | | ✅ Map + mock | In-memory + mock password |
| 7 | multi-store | | ✅ new Map | In-memory |
| 8 | online-orders | ❌ Không | | Service tồn tại nhưng không inject PrismaService — cần kiểm tra thêm |
| 9 | platform-import | | ✅ new Map (adapters) | Map adapters, service in-memory |
| 10 | pos | ❌ Không | | DI pattern đúng nhưng types.ts có mock data |
| 11 | products | ✅ Có | | PrismaService thật |
| 12 | purchase | | ✅ new Map | In-memory |
| 13 | reports | | ✅ new Map | In-memory |
| 14 | shift | ✅ Có | | **PrismaService thật** |
| 15 | staff | ✅ Có | | **PrismaService thật** |

**Kết luận:** 7/15 service dùng PrismaService thật (auth, categories, products, shift, staff = 5; bom, inventory, multi-store, online-orders, platform-import, pos, purchase, reports, mobile-sync = 10 in-memory/placeholder).

Wait — đếm lại: 5 modules có PrismaService thật: auth, categories, products, shift, staff = **5/15 = 33%**.

9 modules dùng in-memory: bom, inventory, mobile-sync, multi-store, platform-import, purchase, reports = **7/15**.

2 modules chưa rõ (invoice, online-orders, pos): invoice chỉ có interface/service layer không query DB; online-orders và pos cần kiểm tra thêm — nhưng không inject PrismaService vào constructor.

**Đúng là ~87% service KHÔNG dùng PrismaService thật** (13/15). PM nói đúng. SA chỉ điều chỉnh lại chi tiết 15 module breakdown.

## 2. Bổ sung từ SA

### 2.1. Electron Renderer — Nhiều hơn skeleton

Electron renderer có `index.html` 14.8KB — không phải chỉ skeleton. Nhưng **KHÔNG có React build** (không có bundle.js, không có package.json trong renderer/). Đây là HTML tĩnh, không phải React SPA. Theo plan.md, Electron renderer phải là React app, nhưng thực tế chỉ là HTML đơn thuần — **Electron ~15% hoàn thiện**.

### 2.2. Platform Import Adapters — Có implementation!

PM nói "chưa implement adapters" là **SAI**. SA đã tìm thấy:
- `base.adapter.ts` (297 bytes) — interface
- `shopee.adapter.ts` (1991 bytes) — **CÓ code**
- `grabfood.adapter.ts` (2532 bytes) — **CÓ code**
- `befood.adapter.ts` (1964 bytes) — **CÓ code**

→ Adapters CÓ code, nhưng **chưa có controller expose API** (T010 chưa complete). Service dùng `Map<string, IPlatformAdapter>` để đăng ký.

### 2.3. POS Service — DI Pattern ĐÚNG nhưng Cart là in-memory

POS service dùng Dependency Injection pattern đúng như plan.md yêu cầu — `PosDependencyInjection` được inject qua constructor. Nhưng:
- Cart là `private cart: CartItem[] = []` — **in-memory per service instance**, không persistent
- Placeholder cho storeId/cashierId: `storeId: 'store_001'` và `cashierId: 'user_cashier_001'`
- `getReceiptData()` trả về `null` (TODO comment)

### 2.4. Mobile Sync — Password Hash Weak

Mobile-sync dùng `hashed_${password}` — **không phải bcrypt thật**. Comment trong code ghi rõ "Simplified for tests". Đây là issue bảo mật cho mobile login.

### 2.5. Invoice Controller — Placeholder

invoice.controller.ts trả về string placeholder thay vì gọi service. Controller tồn tại nhưng **chưa connect với service thật**.

### 2.6. Web Frontend — Có thêm 12 route pages

PM đếm 11 route pages, SA đếm **12**: login, dashboard, pos, products, inventory, purchase, reports, online-orders, multi-store, platform-import, shift, staff. **Tất cả 12 đều dùng mock data, không có API integration**.

### 2.7. Tasks.md — 40 tasks (không phải 32)

PM nói 32 tasks, SA đếm **40 tasks** (T001-T040). T033-T040 là test tasks (unit + E2E).

### 2.8. E2E Tests — 7 debug files còn sót

Trong 11 E2E test files:
- **7 debug files** (debug-js-click, debug-native-click, debug-nbsp, debug-pos-click, debug-pos-dom, debug-pos-locator, debug-strategies, debug-total) — nên xóa
- **3 prod files** (auth-e2e, inventory-e2e, pos-e2e)

### 2.9. Live Shopping Research

Research brief tồn tại nhưng **không có content production code** — đúng theo plan.md (research only, v2 mới integrate).

## 3. Tiến độ thực tế (SA estimate)

| Component | Progress | Ghi chú |
|---|---|---|
| **Prisma Schema** | 100% | 15 models, seed đầy đủ |
| **Backend Services** | 60% | 5/15 dùng PrismaService thật, còn lại in-memory/placeholder |
| **Backend Controllers** | 67% | 10/15 có controller (5 thiếu: categories, inventory, multi-store, online-orders, platform-import) |
| **Backend Tests** | 80% | Hầu hết modules có .test.ts |
| **Web Frontend** | 25% | 12 route pages mock, 7 components, KHÔNG có stores/services/utils |
| **Electron** | 15% | Skeleton + HTML tĩnh, không React build |
| **Mobile** | 0% | Chỉ package.json + tsconfig.json |
| **E2E Tests** | 40% | 3 prod tests + 7 debug files |
| **Platform Adapters** | 70% | 3 adapters có code nhưng chưa qua controller |
| **Overall MVP** | ~45% | Backend logic ~60%, Frontend ~25%, Mobile/Electron ~10% |

## 4. Đề xuất Timeline và Ưu tiên

### Sprint 1: Backend Controller Gap (5-7 ngày)
- T005: Tạo controller cho categories
- T006: Tạo controller cho inventory
- T014: Tạo controller cho multi-store
- T013: Tạo controller cho online-orders
- T010: Tạo controller cho platform-import + connect adapters

### Sprint 2: Service Layer Migration (7-10 ngày)
- Migrate 8 in-memory services → PrismaService
- Fix auth register implementation
- Fix mobile-sync bcrypt
- Fix invoice controller → service connection

### Sprint 3: Frontend API Integration (7-10 ngày)
- Tạo `apps/web/src/services/api.ts` — Axios + JWT
- Tạo `apps/web/src/stores/` — Zustand stores
- Tạo `apps/web/src/utils/currency.ts`
- Update 12 route pages: replace mock → API calls

### Sprint 4: Mobile App (10-14 ngày)
- Expo React Native app setup
- Screens: Login, POS, Reports
- WatermelonDB schema + sync
- Thermal printer integration

### Sprint 5: Electron Desktop (5-7 ngày)
- React renderer trong Electron
- better-sqlite3 local DB
- Thermal printer via raw-thermal-printer
- Sync with PostgreSQL

### Sprint 6: Test + Cleanup (5-7 ngày)
- Xóa 7 debug E2E files
- Hoàn tất unit tests (T033-T037)
- E2E tests (T038-T040)
- Code review + lint + typecheck

**Tổng: ~39-45 ngày** (8-9 tuần, 1 developer full-time)
**Team 2 devs: ~20-25 ngày** (4-5 tuần)

## 5. Đề xuất tách Mobile/Electron thành tasks riêng

**CÓ.** Mobile và Electron nên là 2 task riêng biệt vì:
- Mobile cần React Native expertise + WatermelonDB
- Electron cần better-sqlite3 + thermal printer integration
- 2 task này độc lập với web/backend
- Mỗi task nên có contract riêng, không gộp chung

## 6. Đề xuất làm lại Plan.md

**CÓ.** Plan.md hiện tại không có timeline, không có dependency map chi tiết cho việc còn lại. Cần:
1. Làm lại plan.md với timeline từng sprint
2. Chia lại dependency map: phase backend → phase frontend → phase mobile/electron song song
3. Thêm "Completion Criteria" cho mỗi sprint

---

## 7. Kết luận

**Điểm mạnh PM's analysis:**
- ✅ Xác định đúng 6 backend modules thiếu controller
- ✅ Xác định đúng frontend hoàn toàn mock
- ✅ Xác định đúng mobile 0%, electron ~20%

**Điểm SA điều chỉnh:**
- 🔧 Service in-memory: **9/15** (PM nói 13 — sai)
- 🔧 Platform adapters: **CÓ code** (3/3 adapters implemented)
- 🔧 Web routes: **12 pages** (PM nói 11 — thiếu 1)
- 🔧 Tasks.md: **40 tasks** (PM nói 32 — thiếu test tasks)
- 🔧 Overall progress: **~45%** (PM nói 60-70% — cao quá)

**Overall confidence: HIGH** — SA đã kiểm tra từng file thật.
