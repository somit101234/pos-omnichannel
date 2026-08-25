# Plan: POS Omnichannel MVP — Official Sprint Execution Plan

**Project:** pos-omnichannel
**Spec:** `.specify/specs/001-POS-Omnichannel-MVP/spec.md`
**Branch:** `khoala-bot`
**SA:** @KL_team_m5_bot
**SA Review:** `.specify/research/sa-review-final-2026-08-25.md`
**Ngày soạn:** 2026-08-25
**Số sprint:** 6
**Tổng số task:** 40 (T001–T040)
**Tổng độ dài ước tính:** 39–45 ngày (1 dev) / **20–25 ngày (2 devs song song)**
**Tuần dự kiến:** 4–5 tuần với team 2 devs

---

## 0. Executive Summary

MVP POS Omnichannel đang ở **~45% hoàn thiện**:
- ✅ Prisma Schema 100% (15 models, seed đầy đủ)
- ✅ Backend Services 60% (5/15 module dùng PrismaService thật)
- ✅ Backend Controllers 67% (10/15 có controller)
- ✅ Backend Tests 80%
- ⚠️ Web Frontend 25% (12 route pages mock, không có API integration)
- ⚠️ Electron 15% (skeleton + HTML tĩnh, không React build)
- ❌ Mobile 0% (chỉ package.json + tsconfig.json)
- ⚠️ E2E Tests 40% (3 prod tests + 7 debug files)
- ✅ Platform Adapters 70% (3/3 adapters có code nhưng chưa qua controller)

**6 sprint** được thiết kế để hoàn thiện MVP trong **4–5 tuần** với 2 Dev full-time.

---

## 1. Dependency Map

```
                    ┌─────────────────────────┐
                    │  Prisma Schema (100%)    │
                    │  Platform Adapters (70%) │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   SPRINT 1               │
                    │   Controller Gap         │
                    │   (5-7 ngày)             │
                    │   Lead: dev1             │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   SPRINT 2               │
                    │   Service Migration      │
                    │   (7-10 ngày)            │
                    │   Lead: dev2             │
                    └───────────┬─────────────┘
                        ┌───────┴───────┐
                        │               │
              ┌─────────▼────┐  ┌───────▼──────────┐
              │ SPRINT 3     │  │ SPRINT 4          │
              │ Frontend API │  │ Mobile App        │
              │ (7-10 ngày)  │  │ (10-14 ngày)      │
              │ Lead: dev1   │  │ Lead: dev2        │
              └─────────┬────┘  └───────┬──────────┘
                        │               │
              ┌─────────▼──────┐  ┌─────▼──────────┐
              │ SPRINT 5       │  │                 │
              │ Electron       │  │                 │
              │ (5-7 ngày)     │  │                 │
              │ Lead: dev1     │  │                 │
              └─────────┬──────┘  │                 │
                        │         │                 │
              ┌─────────▼─────────▼──────────────┐
              │   SPRINT 6                        │
              │   Test + Cleanup                  │
              │   (5-7 ngày)                      │
              │   Lead: qa, Support: dev1+dev2   │
              └──────────────────────────────────┘
```

### Dependency breakdown:
- **Sprint 1** → Không phụ thuộc sprint nào khác (dùng Prisma schema và services hiện có)
- **Sprint 2** → Phụ thuộc Sprint 1 (controllers phải có trước để service connect được)
- **Sprint 3** → Phụ thuộc Sprint 2 (backend services dùng Prisma thật)
- **Sprint 4 (Mobile)** → Phụ thuộc Sprint 2 (mobile-auth API dùng bcrypt thật)
- **Sprint 5 (Electron)** → Phụ thuộc Sprint 2 (backend auth + POS API)
- **Sprint 6** → Phụ thuộc TẤT CẢ sprints trước (test + cleanup toàn bộ)

### Song song hóa:
- **Sprint 3 (Web) và Sprint 4 (Mobile) có thể chạy SONG SONG** vì mỗi cái phụ thuộc Sprint 2 — không phụ thuộc nhau.
- **Sprint 5 (Electron)** chạy sau Sprint 4, sau đó tất cả đổ về Sprint 6.
- Với 2 devs: dev1 làm Web/Electron, dev2 làm Mobile.

---

## 2. Timeline Chi Tiết

> **Giả định:** Start date = 2026-08-26 (Thứ 2), 2 devs full-time, 5 ngày làm việc/tuần

### Sprint 1: Backend Controller Gap
| Ngày | Thời gian | Task |
|------|-----------|------|
| 26/08 (T2) | Ngày 1 | T005 Controller categories (dev1) + T006 Controller inventory (dev2) |
| 27/08 (T3) | Ngày 2 | T013 Controller online-orders (dev1) + T014 Controller multi-store (dev2) |
| 28/08 (T4) | Ngày 3 | T010 Controller platform-import (dev1) + review code (dev2) |
| 29/08 (T5) | Ngày 4 | Unit tests cho controllers + typecheck + merge |
| 30/08 (T6) | Ngày 5 | Buffer / contingency |

**Kết thúc:** 02/09 (đếm buffer)
**Ước tính:** 5–7 ngày làm việc (1 tuần)

---

### Sprint 2: Service Layer Migration
| Ngày | Thời gian | Task |
|------|-----------|------|
| 03/09 (T2) | Ngày 1 | T023 BOM migration (dev2) + T024 Inventory migration (dev1) |
| 04/09 (T3) | Ngày 2 | T025 Multi-store migration (dev2) + T026 Online-orders migration (dev1) |
| 05/09 (T4) | Ngày 3 | T027 Purchase migration (dev2) + T028 Reports migration (dev1) |
| 06/09 (T5) | Ngày 4 | T029 Auth fix (dev1) + T030 Mobile-sync fix (dev2) + T031 Invoice fix (dev1) |
| 07/09 (T6) | Ngày 5 | Unit tests toàn bộ + typecheck + merge |
| 08/09 (T7) | Ngày 6 | Buffer / contingency |

**Kết thúc:** 09/09 (đếm buffer)
**Ước tính:** 7–10 ngày làm việc (1.5 tuần)

---

### Sprint 3: Frontend API Integration (dev1)
| Ngày | Thời gian | Task |
|------|-----------|------|
| 10/09 (T2) | Ngày 1 | T032 Tạo api.ts + T033 Zustand stores |
| 11/09 (T3) | Ngày 2 | T034 Currency utils + T035 Login + Dashboard + POS |
| 12/09 (T4) | Ngày 3 | T035 Products + Inventory + Purchase |
| 13/09 (T5) | Ngày 4 | T035 Reports + Online-orders + Multi-store |
| 14/09 (T6) | Ngày 5 | T035 Platform-import + Shift + Staff + review |
| 15/09 (T7) | Ngày 6 | Manual test toàn bộ flow + buffer |

**Kết thúc:** 16/09
**Ước tính:** 7–10 ngày làm việc (1.5 tuần)

**→ Song song với Sprint 4 từ ngày 10/09**

---

### Sprint 4: Mobile App (dev2)
| Ngày | Thời gian | Task |
|------|-----------|------|
| 10/09 (T2) | Ngày 1 | T036 Expo setup + WatermelonDB schema |
| 11/09 (T3) | Ngày 2 | T036 Database schema + navigation |
| 12/09 (T4) | Ngày 3 | T037 Login screen + Mobile auth |
| 13/09 (T5) | Ngày 4 | T037 POS screen |
| 14/09 (T6) | Ngày 5 | T037 Reports screen |
| 16/09 (T2) | Ngày 6 | T038 WatermelonDB sync |
| 17/09 (T3) | Ngày 7 | T038 Offline support |
| 18/09 (T4) | Ngày 8 | T039 Mobile polish + simulator test |
| 19/09 (T5) | Ngày 9 | Buffer / contingency |

**Kết thúc:** 19/09
**Ước tính:** 10–14 ngày làm việc (2 tuần)

---

### Sprint 5: Electron Desktop (dev1) — chạy sau Sprint 3
| Ngày | Thời gian | Task |
|------|-----------|------|
| 17/09 (T3) | Ngày 1 | T037 React renderer setup trong electron |
| 18/09 (T4) | Ngày 2 | T038 better-sqlite3 local DB |
| 19/09 (T5) | Ngày 3 | T039 Thermal printer + IPC |
| 20/09 (T6) | Ngày 4 | Sync với backend + polish |
| 21/09 (T7) | Ngày 5 | Buffer / contingency |

**Kết thúc:** 21/09
**Ước tính:** 5–7 ngày làm việc (1 tuần)

---

### Sprint 6: Test + Cleanup (qa lead, dev1+dev2 support)
| Ngày | Thời gian | Task |
|------|-----------|------|
| 22/09 (T2) | Ngày 1 | T038 Xóa 7 debug E2E files |
| 23/09 (T3) | Ngày 2 | T039 Hoàn tất unit tests |
| 24/09 (T4) | Ngày 3 | T040 E2E tests + CI |
| 25/09 (T5) | Ngày 4 | Code review + lint + typecheck |
| 26/09 (T6) | Ngày 5 | Buffer / contingency |

**Kết thúc:** 26/09
**Ước tính:** 5–7 ngày làm việc (1 tuần)

---

## 3. Completion Criteria — Từng Sprint

### Sprint 1: Controller Gap
| Criteria | Chi tiết | Verify |
|----------|----------|--------|
| SC-101 | 5 controller files được tạo trong đúng modules | File exists check |
| SC-102 | Mỗi controller inject đúng service layer | Constructor injection verify |
| SC-103 | DTO validation hoạt động (input sai → 400) | curl test POST với data sai |
| SC-104 | DELETE category block khi product references | curl test DELETE với product ref |
| SC-105 | Inventory check tính đúng variance | curl test inventory/check |
| SC-106 | Online orders status flow đúng | curl test status transitions |
| SC-107 | Platform import parse được file Excel thật | Upload test file .xlsx |
| SC-108 | `npx tsc --noEmit` exit 0 | Typecheck pass |

### Sprint 2: Service Migration
| Criteria | Chi tiết | Verify |
|----------|----------|--------|
| SC-201 | 7+ service modules inject PrismaService | grep constructor inject |
| SC-202 | CRUD operations đọc/ghi từ PostgreSQL thật | curl CRUD + kiểm tra DB |
| SC-203 | Không còn Map/Array in-memory cho business logic | grep không tìm thấy `new Map`/`new Array` |
| SC-204 | Auth register create user với bcrypt hash | curl POST /auth/register + kiểm tra DB |
| SC-205 | Mobile sync auth dùng bcrypt.compare | grep mobile-sync.service.ts |
| SC-206 | Invoice controller fetch transaction thật từ DB | curl test |
| SC-207 | Unit tests pass với TestPrismaClient | npm run test |

### Sprint 3: Frontend API Integration
| Criteria | Chi tiết | Verify |
|----------|----------|--------|
| SC-301 | API client có JWT interceptor, refresh token | Code review api.ts |
| SC-302 | 4 Zustand stores hoạt động | Code review stores/ |
| SC-303 | Currency formatting đúng VND | Unit test currency.ts |
| SC-304 | Tất cả 12 route pages gọi API thật | grep không tìm thấy mockData |
| SC-305 | Loading/error/empty states hiển thị đúng | Manual test trên browser |
| SC-306 | `npx tsc --noEmit` exit 0 cho web | Typecheck pass |

### Sprint 4: Mobile App
| Criteria | Chi tiết | Verify |
|----------|----------|--------|
| SC-401 | Expo app chạy trên Android + iOS simulator | npx expo start + simulator |
| SC-402 | Login screen call API thật, store JWT | Mobile test login |
| SC-403 | POS screen: add products, checkout, calculate total | Mobile test flow |
| SC-404 | Reports screen: display dashboard + revenue | Mobile test report |
| SC-405 | WatermelonDB: data persists after restart | Mobile restart app |
| SC-406 | Offline mode: app render data từ local DB | Mobile test offline |
| SC-407 | Sync: online → sync với server | Mobile test online sync |

### Sprint 5: Electron Desktop
| Criteria | Chi tiết | Verify |
|----------|----------|--------|
| SC-501 | Electron app start được, hiển thị React | npm run electron:dev |
| SC-502 | Local SQLite DB created + schema đúng | Kiểm tra file .db |
| SC-503 | IPC: renderer ↔ main communication hoạt động | Electron devtools test |
| SC-504 | Thermal printer: in được hóa đơn | Print test |
| SC-505 | Sync: online → sync backend, offline → local | Toggle network test |

### Sprint 6: Test + Cleanup
| Criteria | Chi tiết | Verify |
|----------|----------|--------|
| SC-601 | 0 debug E2E files còn sót | ls e2e/tests/ |
| SC-602 | 15 modules có unit test file | ls modules/*/\*.test.ts |
| SC-603 | Unit test coverage ≥80% mỗi module | npm run test -- --coverage |
| SC-604 | 3 E2E tests pass 100% | npx playwright test |
| SC-605 | `npx tsc --noEmit` → 0 errors | Typecheck toàn monorepo |
| SC-606 | eslint → 0 errors | eslint "src/**/*.ts" --fix |
| SC-607 | npm run test → 100% pass | Full test suite |
| SC-608 | npm run build → success | Build pass |

---

## 4. Team Assignment & Resource Allocation

| Sprint | Lead | Support | Tasks | Thời gian |
|--------|------|---------|-------|-----------|
| **Sprint 1** | dev1 | dev2 | T005, T006, T010, T013, T014 | 5-7 ngày |
| **Sprint 2** | dev2 | dev1 | T023–T031 | 7-10 ngày |
| **Sprint 3** (Web) | dev1 | dev2 | T032–T035 | 7-10 ngày |
| **Sprint 4** (Mobile) | dev2 | — | T036–T039 | 10-14 ngày |
| **Sprint 5** (Electron) | dev1 | — | T037–T039 (electron) | 5-7 ngày |
| **Sprint 6** | qa | dev1 + dev2 | T038–T040 (test) | 5-7 ngày |

### Parallel execution:
- **dev1:** Sprint 1 (T005,T013,T010) → Sprint 2 (T024,T026,T028,T029,T031) → Sprint 3 (tất cả) → Sprint 5 (tất cả)
- **dev2:** Sprint 1 (T006,T014) → Sprint 2 (T023,T025,T027) → Sprint 4 (tất cả)
- **QA:** Sprint 6 (lead) — nhưng có thể review code mỗi sprint sớm

---

## 5. Risk Register

| ID | Risk | Impact | Probability | Mitigation |
|----|------|--------|-------------|------------|
| R01 | Backend API thay đổi giữa Sprint 2-3 | Cao | TB | SA review API contract trước khi dev code |
| R02 | WatermelonDB sync conflict phức tạp | Cao | TB | SA research pattern trước Sprint 4, có fallback last-write-wins |
| R03 | Thermal printer driver incompatibility | Trung bình | TB | Test driver compatibility early trong Sprint 5, có fallback print to file |
| R04 | 2 devs conflict khi cùng sửa module | Thấp | TB | Define file ownership rõ ràng trong mỗi task (allowlist/denylist) |
| R05 | Platform Excel format thay đổi | Trung bình | Thấp | Adapters đã có code, test với file thật mỗi sprint |
| R06 | Mobile Expo SDK version conflict | Thấp | Thấp | Lock version trong package.json, dùng npx expo install |
| R07 | Electron renderer React build chậm | Thấp | Thấp | Dùng Vite thay vì Webpack cho faster rebuild |

---

## 6. Technical Architecture Validation

### Architecture vẫn phù hợp — SA xác nhận:

#### ✅ Backend: NestJS + Prisma + PostgreSQL
- **Vẫn đúng:** Prisma schema 100% hoàn thiện, 15 models bao phủ đầy đủ spec.
- **Seed data đầy đủ:** Test data đã sẵn sàng cho development.
- **NestJS module structure:** 15 modules đúng theo spec user stories.

#### ✅ Frontend Web: React + TypeScript + Zustand
- **Vẫn đúng:** 12 route pages cần migration từ mock → API.
- **Zustand choice:** Phù hợp cho state management nhỏ, nhẹ hơn Redux.
- **Vite build:** Đã có trong repo, phù hợp cho dev tốc độ.

#### ✅ Mobile: React Native + Expo + WatermelonDB
- **Vẫn đúng:** Expo là choice tốt cho rapid development, WatermelonDB phù hợp offline-first.
- **Lưu ý:** Cần lock WatermelonDB version để tránh breaking change.

#### ✅ Electron Desktop: better-sqlite3 + React renderer
- **Vẫn đúng:** better-sqlite3 nhanh hơn sqlite3 async, phù hợp cho local DB.
- **Lưu ý:** Renderer cần React build (hiện chỉ là HTML tĩnh) — task chính trong Sprint 5.

#### ⚠️ Socket.io real-time
- **Không cần trong MVP:** Spec không yêu cầu real-time trong user stories P1/P2.
- **Giai đoạn sau:** Có thể thêm Socket.io trong version 2 nếu cần.

### Kiến trúc KHÔNG thay đổi — chỉ cần hoàn thiện code theo plan.

---

## 7. Milestones & Key Dates

| Milestone | Date | Deliverable |
|-----------|------|-------------|
| **Sprint 1 Complete** | 02/09 | 5 controllers hoạt động, API endpoints pass |
| **Sprint 2 Complete** | 09/09 | Tất cả services dùng Prisma, unit tests pass |
| **Sprint 3 Complete** | 16/09 | 12 pages gọi API thật, không còn mock data |
| **Sprint 4 Complete** | 19/09 | Mobile app chạy trên simulator, offline support |
| **Sprint 5 Complete** | 21/09 | Electron app chạy, React + SQLite + printer |
| **Sprint 6 Complete** | 26/09 | 100% test pass, 0 debug files, MVP ready |
| **🎉 MVP Launch** | **26/09** | **POS Omnichannel MVP hoàn thiện** |

---

## 8. Assumptions & Constraints

### Assumptions:
1. 2 devs full-time (dev1, dev2) trong toàn bộ 6 sprints
2. QA (profile `qa`) có thể review code sớm thay vì chờ Sprint 6
3. PostgreSQL server sẵn sàng cho development
4. Docker compose cho PostgreSQL có sẵn (nếu cần)
5. Không có thay đổi spec trong quá trình thực hiện

### Constraints:
1. **Không thêm dependency mới** (constitutional rule #6)
2. **Không dùng float cho tiền tệ** — toàn bộ dùng DECIMAL/BigInt
3. **BOM circular detection** — max 3 cấp nesting
4. **Multi-store isolation** — mọi query filter theo store_id
5. **RBAC middleware** — Guard + Decorator cho mọi protected route

---

## 9. Files Affected by This Plan

### Sprint 1 — Backend Controllers
- `apps/server/src/modules/categories/categories.controller.ts` — CREATE
- `apps/server/src/modules/inventory/inventory.controller.ts` — CREATE
- `apps/server/src/modules/online-orders/online-orders.controller.ts` — CREATE
- `apps/server/src/modules/multi-store/multi-store.controller.ts` — CREATE
- `apps/server/src/modules/platform-import/platform-import.controller.ts` — CREATE

### Sprint 2 — Service Migration
- `apps/server/src/modules/bom/bom.service.ts` — MODIFY
- `apps/server/src/modules/inventory/inventory.service.ts` — MODIFY
- `apps/server/src/modules/multi-store/multi-store.service.ts` — MODIFY
- `apps/server/src/modules/online-orders/online-orders.service.ts` — MODIFY
- `apps/server/src/modules/purchase/purchase.service.ts` — MODIFY
- `apps/server/src/modules/reports/reports.service.ts` — MODIFY
- `apps/server/src/modules/mobile-sync/mobile-sync.service.ts` — MODIFY
- `apps/server/src/modules/auth/auth.service.ts` — MODIFY
- `apps/server/src/modules/invoice/invoice.controller.ts` — MODIFY
- `apps/server/src/modules/invoice/invoice.service.ts` — MODIFY

### Sprint 3 — Frontend Integration
- `apps/web/src/services/api.ts` — CREATE
- `apps/web/src/stores/` — CREATE (auth, cart, product, report stores)
- `apps/web/src/utils/currency.ts` — CREATE
- `apps/web/src/routes/` — MODIFY (12 route files)

### Sprint 4 — Mobile App
- `apps/mobile/app.tsx` — CREATE
- `apps/mobile/src/screens/` — CREATE (Login, POS, Reports)
- `apps/mobile/src/database/` — CREATE (WatermelonDB schema)
- `apps/mobile/src/services/` — CREATE (API client, sync)

### Sprint 5 — Electron Desktop
- `apps/electron/main.js` — MODIFY
- `apps/electron/preload.js` — MODIFY
- `apps/electron/renderer/` — CREATE (React app)
- `apps/electron/db/` — CREATE (SQLite init)

### Sprint 6 — Test + Cleanup
- `e2e/tests/` — MODIFY (xóa debug files, hoàn tất prod tests)
- `apps/server/src/modules/*/` — MODIFY (unit tests)

---

## 10. Execution Notes

- **Branch strategy:** Tất cả task chạy trên nhánh `khoala-bot`
- **Commit convention:** Theo `Commit.md` trong project (type/scope/subject format)
- **Push policy:** Push lên remote ngay sau khi commit (đã được ủy quyền)
- **Contract references:** Mỗi sprint có Execution Contract riêng trong `.specify/contracts/`
- **SA Review:** `.specify/research/sa-review-final-2026-08-25.md` — xác nhận architecture và progress

---

*Plan generated by SA (@KL_team_m5_bot) on 2026-08-25*
*Based on: spec.md, sprint contracts, SA review, current codebase analysis*
