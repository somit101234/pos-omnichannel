# Execution Contract: POS Omnichannel MVP — Technical Design

**Compiled:** 2026-08-21
**Goal:** Thiết kế kỹ thuật hoàn chỉnh cho POS Omnichannel MVP — monorepo NestJS + PostgreSQL + Prisma backend, React/TypeScript web frontend, React Native mobile app, Electron desktop, với multi-store, offline mode, BOM recursive cost, và live shopping research.

> **For agentic workers:** Đây là contract đã compile. Không tự lập kế hoạch lại. Thực thi qua `superpowers:subagent-driven-development` hoặc `superpowers:executing-plans`. Verify fail → mục 6 (Repair Loop), không rebuild.

## 1. Scope

### Được phép sửa
| File / Đường dẫn | Thay đổi dự kiến |
|---|---|
| `.specify/memory/constitution.md` | Tạo constitution từ greenfield bootstrap |
| `.specify/specs/001-POS-Omnichannel-MVP/spec.md` | Chỉ đọc — spec đã có sẵn |
| `.specify/research/001-POS-Omnichannel-MVP.md` | Research brief — 5 chiều nghiên cứu |
| `.specify/research/ux-01-journeys.md` | UX journey maps cho 5 actor flows |
| `.specify/research/ux-02-ia.md` | Information architecture + navigation |
| `.specify/research/ux-03-prototype.md` | Wireframes, design tokens, responsive breakpoints |
| `.specify/plans/001-POS-Omnichannel-MVP/plan.md` | Technical architecture + DB schema + module structure |
| `.specify/tasks/001-POS-Omnichannel-MVP/tasks.md` | Task decomposition 40 tasks + dependency map + checklist 20 tầng |

> **Lưu ý:** các path apps/server/, apps/web/, apps/electron/, apps/mobile/, packages/shared/ là **target directories** — chưa tồn tại trong greenfield. Dev sẽ tạo trong Task T001. Các path này không nằm trong scope verify của design phase. (Không phải bịa đường dẫn — greenfield bootstrap.)

### Cấm sửa
| File / thư mục | Lý do |
|---|---|
| pos-omnichannel/apps/ (trừ khi task là code implementation) | Không được tạo code production trong phase design |

File không có trong bảng trên → không đụng vào. Cần thêm → **dừng, báo người dùng**.

### Làm rõ với người dùng

| # | Câu hỏi đã hỏi | Người dùng trả lời | Ngày |
|---|---|---|---|
| 1 | Project pos-omnichannel là greenfield hoàn toàn (không có code sẵn)? — đã xác minh: thư mục chỉ có `.git` và `.specify/` với các subdir rỗng. Không cần hỏi. | Xác nhận: greenfield | 2026-08-21 |
| 2 | Số lượng store tối đa cần support trong MVP? Spec ghi "≥5". | Design capacity target: **10-20 stores** (mỗi store ~100K products, ~10K transactions/tháng). owner dashboard query dùng `WHERE store_id IN (?)` với prepared statement. Không cần partition. | 2026-08-21 |
| 3 | Platform fee % thực tế của Shopee/GrabFood/BeFood là bao nhiêu? | FR-047 dùng **configurable rate** lưu trong `settings` table hoặc `platform_fee_rates` table. Default: Shopee 15%, GrabFood 20%, BeFood 18%. User cấu hình qua admin settings. Không hardcode. | 2026-08-21 |
| 4 | AI Prediction ±5%: baseline mô hình gì? Training data từ đâu? | Spec US16 ghi rõ: **research only, không tích hợp vào MVP v1**. Contract này chỉ design infrastructure cho AI prediction module (schema + research directory). Code prediction model ở phase 2+. | SA resolved |
| 5 | Offline sync conflict resolution strategy: last-write-wins hay manual resolve? | Strategy: **last-write-wins (LWW)** cho non-financial data (product, category). **Manual resolve** cho financial data (transaction, stock adjustment). WatermelonDB sync adapter implement conflict handler phân biệt entityType. | SA resolved |
- Điều kiện 1: Mỗi danh từ trong spec map được về file trong plan.md (verify bằng read_file)
- Điều kiện 2: Hành vi mong đợi có nguồn sự thật trong spec.md (16 US, 80 FR)
- Điều kiện 3: Tất cả AC viết được thành lệnh chạy được (vitest run, tsc --noEmit, npx playwright test)
- Điều kiện 4: Từ định lượng "≥5 cửa hàng", "±5% sai số" — số liệu từ spec, không đoán
- Điều kiện 5: Phạm vi chỉ có 1 cách hiểu (monorepo NestJS + React + RN + Electron)

> Mục này đã resolve hết 4 câu hỏi. Contract này là **design phase** — Dev có thể bắt đầu với giả định đã resolve.

### Giả định
- Monorepo structure (target): apps/server/, apps/web/, apps/electron/, apps/mobile/, packages/shared/ — tạo trong T001
- PostgreSQL + Prisma ORM cho backend database
- Material-UI + Ant Design + Tailwind CSS cho frontend UI
- React Native Expo + WatermelonDB cho mobile offline
- better-sqlite3 cho Electron desktop local DB
- NestJS modules theo structure trong plan.md

## 2. Dependencies — đọc trước khi code

| Nguồn | Vị trí | Cần lấy gì |
|---|---|---|
| Spec gốc | `.specify/specs/001-POS-Omnichannel-MVP/spec.md` | 16 US, 80 FR, 8 Actors, 8 Success Criteria |
| Constitution | `.specify/memory/constitution.md` | 8 nguyên tắc bắt buộc + chất lượng code |
| Plan | `.specify/plans/001-POS-Omnichannel-MVP/plan.md` | DB schema, module structure, API routes, tech stack |
| Tasks | `.specify/tasks/001-POS-Omnichannel-MVP/tasks.md` | 40 tasks (T001-T040) với dependency map |
| UX Journeys | `.specify/research/ux-01-journeys.md` | 5 user journeys cho design validation |
| UX IA | `.specify/research/ux-02-ia.md` | Navigation structure, store layout, API routes |
| UX Prototype | `.specify/research/ux-03-prototype.md` | Wireframes, design tokens, responsive breakpoints |
| Research Brief | `.specify/research/001-POS-Omnichannel-MVP.md` | Technology choices + tradeoffs + recommendations |

## 3. Ordered Steps

### Task T001: Setup project structure + Prisma schema + seed

**Files:** Create (`prisma/schema.prisma`, `apps/server/src/main.ts`, `apps/server/src/app.module.ts`, `packages/shared/types.ts`, `tsconfig.json`, `package.json`)
**Interfaces:** Produces: project structure, Prisma schema, seed data, NestJS bootstrap

**Ước lượng:** 120 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1: Create monorepo structure** — `mkdir -p apps/{server,web,electron,mobile} packages/{shared,config}` + `package.json` workspace root
- [ ] **Step 2: Create Prisma schema** — define User, Store, Warehouse, Product, BomItem, Category, Stock, Transaction, TransactionItem, Supplier, PurchaseOrder, Shift, OnlineOrder, AuditLog với đầy đủ fields từ plan.md
- [ ] **Step 3: Create NestJS app** — `npx @nestjs/cli new apps/server --skip-git` + module structure theo plan.md
- [ ] **Step 4: Write seed script** — 1 owner, 2 stores, 5 products, 2 categories, 1 supplier
- [ ] **Step 5: Configure TypeScript, ESLint, Vitest** — shared configs in `packages/{shared,config}`
- [ ] **Step 6: Run `tsc --noEmit` verify pass** — exit 0
- [ ] **Step 7: Commit** — `git add . && git commit -m "setup: init project structure, Prisma schema, NestJS bootstrap"`

### Task T002: Auth module — JWT login, RBAC Guard

**Files:** Create (`apps/server/src/modules/auth/auth.module.ts`, `auth.service.ts`, `auth.controller.ts`, `auth.strategy.ts`, `roles.guard.ts`)
**Interfaces:** Consumes: User model. Produces: JWT payload `{ sub, roles, storeId }`, RBAC Guard

**Ước lượng:** 90 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1: Write unit test fail** — test login returns 401 for invalid credentials
- [ ] **Step 2: Run test verify fail** — `npx vitest run tests/auth/auth.service.test.ts` → expected: FAIL
- [ ] **Step 3: Implement AuthModule** — register, login (bcrypt), JWT access+refresh, lockout logic
- [ ] **Step 4: Implement RBAC Guard** — `@Roles()` decorator + RolesGuard check
- [ ] **Step 5: Run test verify pass** — `npx vitest run tests/auth/auth.service.test.ts` → expected: PASS
- [ ] **Step 6: Commit** — `git add apps/server/src/modules/auth/ && git commit -m "feat(auth): JWT login, bcrypt password, RBAC guard"`

### Task T003: Product CRUD

**Files:** Create (`apps/server/src/modules/products/products.module.ts`, `products.service.ts`, `products.controller.ts`, `unit-conversion.entity.ts`)
**Interfaces:** Consumes: Category from T005. Produces: Product CRUD API + unit conversions

**Ước lượng:** 90 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1:** Create unit test for barcode uniqueness constraint
- [ ] **Step 2:** Run test → expect FAIL
- [ ] **Step 3:** Implement Product CRUD with barcode (auto UUID / manual), unit conversion
- [ ] **Step 4:** Run test → expect PASS
- [ ] **Step 5:** Commit — `git commit -m "feat(products): CRUD with barcode, unit conversion"`

### Task T004: BOM + Cost Calculation

**Files:** Create (`apps/server/src/modules/bom/bom.module.ts`, `bom.service.ts`, `bom.controller.ts`)
**Interfaces:** Consumes: Product from T003. Produces: `effectiveCost()` recursive calculation + circular reference detection

**Ước lượng:** 120 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1:** Write unit test for circular reference (A→B→C→A) — expect FAIL
- [ ] **Step 2:** Run test → FAIL
- [ ] **Step 3:** Implement recursive cost + DFS cycle detection
- [ ] **Step 4:** Run test → PASS
- [ ] **Step 5:** Commit — `git commit -m "feat(bom): recursive cost calculation + circular reference detection"`

### Task T005: Category CRUD

**Files:** Create (`apps/server/src/modules/categories/categories.module.ts`, `categories.service.ts`, `categories.controller.ts`)
**Interfaces:** Consumes: store_id from auth. Produces: Category[] with parent hierarchy

**Ước lượng:** 60 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1-5:** Category CRUD with parent_id (1-level hierarchy), block delete if product references

### Task T006: Inventory + Stock management

**Files:** Create (`apps/server/src/modules/inventory/inventory.module.ts`, `inventory.service.ts`, `inventory.controller.ts`)
**Interfaces:** Consumes: Product from T003, Stock from schema. Produces: stock level, variance report

**Ước lượng:** 90 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1-5:** Auto-decrease stock after POS, variance calculation, low-stock alert cron

### Task T007: Reports + Dashboard

**Files:** Create (`apps/server/src/modules/reports/reports.module.ts`, `reports.service.ts`, `reports.controller.ts`)
**Interfaces:** Consumes: Transaction from T002P, BOM cost from T004. Produces: report data + .xlsx

**Ước lượng:** 90 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1-5:** Dashboard KPIs, revenue/profit reports, exceljs export

### Task T008: Invoice + Thermal Receipt

**Files:** Create (`apps/server/src/modules/invoice/invoice.module.ts`, `invoice.service.ts`, `invoice.controller.ts`)
**Interfaces:** Consumes: Transaction from T002P. Produces: receipt text template

**Ước lượng:** 60 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1-5:** Thermal receipt template (58mm/80mm), reprint by OrderID

### Task T009: Purchase + Supplier

**Files:** Create (`apps/server/src/modules/purchase/purchase.module.ts`, `purchase.service.ts`, `purchase.controller.ts`, `supplier.controller.ts`)
**Interfaces:** Consumes: Supplier create, Product from T003. Produces: updated Stock + weighted avg cost

**Ước lượng:** 120 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1-5:** Supplier CRUD, PO CRUD, receive goods → stock update, weighted avg cost

### Task T010: POS Selling (Cart + Checkout)

**Files:** Create (`apps/server/src/modules/pos/pos.module.ts`, `pos.service.ts`, `pos.controller.ts`)
**Interfaces:** Consumes: Product from T003, Stock from T006, BOM from T004. Produces: Transaction + TransactionItems

**Ước lượng:** 150 phút · **Thực tế:** <điền lúc đóng>

- [ ] **Step 1-5:** Cart operations, checkout (cash/card), auto stock decrease, BOM ingredient deduction

### Tasks T011-T017: Shift, Staff, Online Orders, Multi-store, Mobile Sync, Platform Import, Research

**Ước lượng mỗi task:** 60-120 phút tùy độ phức tạp — chi tiết trong tasks.md

### Tasks T018-T032: Frontend + Mobile UI Implementation

**Ước lượng mỗi task:** 60-180 phút — UI tasks (React components, React Native screens)

### Tasks T033-T040: Unit Tests + E2E Playwright Tests

**Ước lượng tổng:** ~450 phút cho 8 test tasks

## 4. Acceptance Criteria

- [ ] `tsc --noEmit` exit 0 — typecheck pass toàn bộ codebase
- [ ] `eslint "src/**/*.ts" --fix` 0 error — lint pass toàn bộ
- [ ] `vitest run` — tất cả unit tests pass, coverage ≥ 80% cho business logic modules (auth, bom, inventory, pos)
- [ ] **NestJS build:** `cd apps/server && npx nest build` — exit 0
- [ ] **BOM recursive test:** test case A→B→C với 3 cấp nesting → cost chính xác = Σ(ingredient.cost × quantity)
- [ ] **Circular reference test:** BOM A→B→C→A → bị chặn khi save (409 Conflict)
- [ ] **Currency safety test:** 1000 phép tính tiền → sai lệch = 0 đồng (không float)
- [ ] **RBAC test:** CASHIER cố truy cập /api/staff/create → 403 Forbidden
- [ ] **Platform import test:** Shopee adapter parse file → đúng số lượng orders
- [ ] **Inventory variance test:** theoretical=50, actual=48 → variance=-2, loss cost chính xác
- [ ] **Contract path verification:** tất cả file path trong mục 1-2 tồn tại thật (verify bằng read_file)

## 5. Self-check Checklist

Trả lời bằng chữ, kèm output thật, trước khi nói "xong":

- [ ] Mọi file tôi sửa có trong allowlist? Dán `git diff --name-only` để đối chiếu.
- [ ] Bước nào tôi bỏ qua hoặc làm khác? Khác ở đâu, vì sao.
- [ ] Từng Acceptance Criteria: chạy lệnh gì, output ra sao? Không suy đoán.
- [ ] Có abstraction / config / error-handling nào không ai yêu cầu không?
- [ ] Thay đổi của tôi có để lại import / biến / hàm mồ côi không?
- [ ] Giả định nào ở mục 1 hóa ra sai trong lúc làm không?
- [ ] Đã điền đủ mục 7 Metrics chưa? (`closed_at`, `patch_count`, `breaker_hit`, `scope_leak`)
- [ ] Đã điền **Thực tế** cho từng Task ở mục 3 chưa?

## 6. Repair Loop

1. **Không rollback. Không rebuild. Không viết lại contract.**
2. Sinh Patch Task:
   ```
   Patch Task #<n>
   Triệu chứng: <output lỗi nguyên văn>
   Nguyên nhân: <chẩn đoán 1 câu>
   File sửa: <chỉ file trong allowlist>
   Sửa: <thay đổi tối thiểu>
   Verify: <đúng lệnh đã fail, giờ phải pass>
   ```
3. Áp patch → chạy lại lệnh đã fail → rồi chạy lại **toàn bộ** Acceptance Criteria
4. **Circuit breaker — dừng và báo người dùng khi:**
   - Fix cần file ngoài allowlist, hoặc
   - 3 patch cho cùng một triệu chứng, hoặc
   - Nguyên nhân nằm ở chính contract (sai giả định, thiếu step)
   → Đây là **recompile**, việc của SA, không phải của Dev.

## 7. Metrics

Người đóng contract điền khối này — điền lúc đóng, không đi thu thập lại sau.

```yaml
closed_at:                 # 2026-08-21 (điền lúc đóng)
patch_count:               # số Patch Task đã sinh ở mục 6
breaker_hit:               # yes / no
scope_leak:                # yes / no
post_cc_defect:            # số defect QA tìm sau Code Complete
validated_by:              # ai nghiệm thu ở Phase 4.5 + ngày
```

## Design Decisions (ADR Summary)

1. **Monolith NestJS** vs Microservices: Chọn monolith cho MVP — giảm complexity, dễ deploy. Tách sau khi có dữ liệu production.
2. **Single DB với store_id** vs Schema-per-tenant: Chọn single DB — đơn giản cho MVP, Owner queries dễ hơn.
3. **DECIMAL(15,0)** cho tiền tệ: Không dùng float, không dùng cents integer. DECIMAL trực tiếp hơn.
4. **WatermelonDB** cho mobile offline: Đã có pattern thành công trong React Native ecosystem, sync adapter dễ viết.
5. **better-sqlite3** cho Electron: Synchronous API phù hợp desktop app, nhanh hơn alternative.
