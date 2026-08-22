# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: inventory-e2e.spec.ts >> Inventory variance — deficit case (actual < theoretical)
- Location: tests/inventory-e2e.spec.ts:20:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').filter({ hasText: /Kiểm kho/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h1').filter({ hasText: /Kiểm kho/i })

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * E2E: Inventory check — variance + cost calculation
  5  |  *
  6  |  * Spec: .specify/specs/001-POS-Omnichannel-MVP/spec.md (US6 — Inventory)
  7  |  * Task: T040
  8  |  *
  9  |  * AC: Playwright test: set actual qty different from theoretical → verify variance display
  10 |  * AC: npx playwright test e2e/inventory-e2e.spec.ts → 1/1 PASS
  11 |  *
  12 |  * FR-028: Owner thực hiện inventory check — nhập actual qty cho từng sản phẩm
  13 |  * FR-029: Hệ thống tính variance = theoretical - actual cho từng sản phẩm
  14 |  * FR-030: Tính hao hụt cost = |variance| × unit_cost cho sản phẩm thiếu (deficit)
  15 |  */
  16 | 
  17 | // ──────────────────────────────────────────────
  18 | // AC: Set actual qty different from theoretical → verify variance display
  19 | // ──────────────────────────────────────────────
  20 | test('Inventory variance — deficit case (actual < theoretical)', async ({ page }) => {
  21 |   // 1. Navigate to inventory check page
  22 |   await page.goto('/inventory');
> 23 |   await expect(page.locator('h1', { hasText: /Kiểm kho/i })).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  24 | 
  25 |   // 2. Verify page shows inventory check table with mock products
  26 |   await expect(page.locator('th', { hasText: 'Sản phẩm' })).toBeVisible();
  27 |   await expect(page.locator('th', { hasText: 'Tồn lý thuyết' })).toBeVisible();
  28 |   await expect(page.locator('th', { hasText: 'Tồn thực tế' })).toBeVisible();
  29 | 
  30 |   // 3. Verify mock products are listed with theoretical quantities
  31 |   await expect(page.locator('text=Cháo ếch')).toBeVisible();
  32 |   await expect(page.locator('text=Cơm sườn')).toBeVisible();
  33 |   await expect(page.locator('text=Bánh mì')).toBeVisible();
  34 |   await expect(page.locator('text=Nước ép')).toBeVisible();
  35 |   await expect(page.locator('text=Phở bò')).toBeVisible();
  36 | 
  37 |   // 4. Set actual qty for "Cháo ếch" — 20 (theoretical) → enter 18 (deficit of 2)
  38 |   //    The first input field corresponds to the first product (Cháo ếch)
  39 |   const actualQtyInputs = page.locator('input[type="number"]');
  40 |   await actualQtyInputs.first().fill('18');
  41 | 
  42 |   // 5. Set actual qty for "Cơm sườn" — 15 (theoretical) → enter 12 (deficit of 3)
  43 |   await actualQtyInputs.nth(1).fill('12');
  44 | 
  45 |   // 6. Set actual qty for "Bánh mì" — 30 (theoretical) → enter 30 (balanced)
  46 |   await actualQtyInputs.nth(2).fill('30');
  47 | 
  48 |   // 7. Set actual qty for "Nước ép" — 25 (theoretical) → enter 28 (surplus of 3)
  49 |   await actualQtyInputs.nth(3).fill('28');
  50 | 
  51 |   // 8. Click the check button to calculate variance
  52 |   await page.getByRole('button', { name: /tính biến động/i }).click();
  53 |   await page.waitForTimeout(300); // allow UI to render results
  54 | 
  55 |   // 9. Verify results section appears
  56 |   await expect(page.locator('h2', { hasText: /Kết quả/i })).toBeVisible();
  57 | 
  58 |   // 10. Verify variance display for "Cháo ếch" — theoretical 20, actual 18 → variance = +2 (deficit)
  59 |   const chaoRow = page.locator('td', { hasText: 'Cháo ếch' }).first().locator('tr');
  60 |   // Variance column should show +2 (theoretical - actual = 20 - 18)
  61 |   await expect(page.locator('text=+2')).toBeVisible();
  62 | 
  63 |   // 11. Verify loss cost displayed for deficit — 2 × 8000 = 16,000₫
  64 |   await expect(page.locator('text=16.000₫')).toBeVisible();
  65 | 
  66 |   // 12. Verify "Cơm sườn" — theoretical 15, actual 12 → variance = +3 (deficit), loss = 3 × 10000 = 30,000₫
  67 |   await expect(page.locator('text=+3')).toBeVisible();
  68 |   await expect(page.locator('text=30.000₫')).toBeVisible();
  69 | 
  70 |   // 13. Verify "Bánh mì" — theoretical 30, actual 30 → balanced (variance = 0, no loss)
  71 |   const banhMiRow = page.locator('td', { hasText: 'Bánh mì' }).first();
  72 |   // Check no deficit text appears for this row
  73 |   const banhMiCell = banhMiRow.locator('tr').nth(0);
  74 |   await expect(banhMiCell.locator('text=—')).toBeVisible();
  75 | 
  76 |   // 14. Verify "Nước ép" — theoretical 25, actual 28 → surplus (variance = -3)
  77 |   await expect(page.locator('text=-3')).toBeVisible();
  78 | 
  79 |   // 15. Verify total loss cost display
  80 |   await expect(page.locator('text=Tổng hao hụt')).toBeVisible();
  81 | 
  82 |   // 16. Verify Phở bò — theoretical 10, actual 0 (default) → variance = +10, loss = 10 × 12000 = 120,000₫
  83 |   await expect(page.locator('text=+10')).toBeVisible();
  84 |   await expect(page.locator('text=120.000₫')).toBeVisible();
  85 | 
  86 |   // 17. Verify total loss: 16000 + 30000 + 0 + 0 + 120000 = 166,000₫
  87 |   await expect(page.locator('text=166.000₫')).toBeVisible();
  88 | 
  89 |   // 18. Verify status badges — THIẾU for deficit products
  90 |   await expect(page.locator('text=THIẾU')).toBeVisible();
  91 |   // DƯ for surplus products
  92 |   await expect(page.locator('text=DƯ')).toBeVisible();
  93 |   // ĐỒNG BỘ for balanced products
  94 |   await expect(page.locator('text=ĐỒNG BỘ')).toBeVisible();
  95 | });
  96 | 
```