# Execution Contract: Sprint 6 — Test + Cleanup

**Compiled:** 2026-08-25
**Task Set:** Sprint 6 (5-7 ngày)
**Project:** pos-omnichannel

## 1. Scope

### Cho phép sửa
- `e2e/tests/` — xóa debug files, hoàn tất production tests
- `apps/server/src/modules/*/` — bổ sung unit tests
- `apps/web/src/` — bổ sung test utilities
- `apps/mobile/` — bổ sung test utilities
- `apps/electron/` — bổ sung test utilities

### Cấm sửa
- Không thay đổi business logic (trừ khi fix bug tìm thấy trong test)
- Không thêm dependency mới (trừ khi SA approve)

## 2. Dependencies
- Sprint 1-5 hoàn thành (tất cả features đã code)

## 3. Ordered Steps

### Step 1: Xóa Debug E2E Files (0.5 ngày)
- Xóa 7 debug files:
  - debug-js-click.spec.ts
  - debug-native-click.spec.ts
  - debug-nbsp.spec.ts
  - debug-pos-click.spec.ts
  - debug-pos-dom.spec.ts
  - debug-pos-locator.spec.ts
  - debug-strategies.spec.ts
  - debug-total.spec.ts
- Giữ lại 3 production files:
  - auth-e2e.spec.ts
  - pos-e2e.spec.ts
  - inventory-e2e.spec.ts

### Step 2: Hoàn tất Unit Tests (2 ngày)
- Đảm bảo mỗi module có .test.ts file:
  - auth.test.ts
  - bom.test.ts
  - categories.test.ts
  - inventory.test.ts
  - invoice.test.ts
  - mobile-sync.test.ts
  - multi-store.test.ts
  - online-orders.test.ts
  - platform-import.test.ts
  - pos.test.ts
  - products.test.ts
  - purchase.test.ts
  - reports.test.ts
  - shift.test.ts
  - staff.test.ts
- Test coverage: mỗi service có ≥5 test cases
- Use TestPrismaClient cho unit tests (mock Prisma)

### Step 3: Hoàn tất E2E Tests (2 ngày)
- Hoàn tất auth-e2e.spec.ts:
  - Test: đăng nhập với user hợp lệ → success
  - Test: đăng nhập với user không tồn tại → error
  - Test: đăng nhập sai password 5 lần → lockout 30 phút
  - Test: JWT refresh khi expired
- Hoàn tất pos-e2e.spec.ts:
  - Test: thêm product vào cart → cart cập nhật
  - Test: checkout → transaction created, stock decreased
  - Test: thanh toán cash → tính tiền thừa đúng
  - Test: thanh toán card → không cần tiền thừa
- Hoàn tất inventory-e2e.spec.ts:
  - Test: inventory check → variance calculated
  - Test: low stock alert → notification shown

### Step 4: Code Review + Lint + Typecheck (1.5 ngày)
- Chạy `npx tsc --noEmit` → 0 errors
- Chạy `eslint "src/**/*.ts" --fix` → 0 errors
- Chạy `npm run test` → 100% pass
- Chạy `npx playwright test` → 100% pass
- Fix tất cả errors tìm thấy

## 4. Acceptance Criteria

- [ ] **AC-1:** 0 debug E2E files còn sót
- [ ] **AC-2:** 15 modules có unit test file
- [ ] **AC-3:** Unit test coverage ≥80% cho mỗi module
- [ ] **AC-4:** 3 E2E tests (auth, pos, inventory) pass 100%
- [ ] **AC-5:** `npx tsc --noEmit` → 0 errors
- [ ] **AC-6:** `eslint "src/**/*.ts" --fix` → 0 errors
- [ ] **AC-7:** `npm run test` → 100% pass
- [ ] **AC-8:** `npx playwright test` → 100% pass

## 5. Self-check

```bash
# Full test suite
npm run test
npx playwright test
npx tsc --noEmit
eslint "src/**/*.ts" --fix

# Verify coverage
npm run test -- --coverage
# Check: each module has ≥5 tests, coverage ≥80%
```

## 6. Repair Loop

Nếu test fail → fix code, chạy lại test. Nếu vẫn fail sau 3 lần → `kanban_block`
