import { test, expect } from '@playwright/test';

/**
 * E2E: Inventory check — variance + cost calculation
 *
 * Spec: .specify/specs/001-POS-Omnichannel-MVP/spec.md (US6 — Inventory)
 * Task: T040
 *
 * AC: Playwright test: set actual qty different from theoretical → verify variance display
 * AC: npx playwright test e2e/inventory-e2e.spec.ts → 1/1 PASS
 *
 * FR-028: Owner thực hiện inventory check — nhập actual qty cho từng sản phẩm
 * FR-029: Hệ thống tính variance = theoretical - actual cho từng sản phẩm
 * FR-030: Tính hao hụt cost = |variance| × unit_cost cho sản phẩm thiếu (deficit)
 */

// ──────────────────────────────────────────────
// AC: Set actual qty different from theoretical → verify variance display
// ──────────────────────────────────────────────
test('Inventory variance — deficit case (actual < theoretical)', async ({ page }) => {
  // 1. Navigate to inventory check page
  await page.goto('/inventory');
  await expect(page.locator('h1', { hasText: /Kiểm kho/i })).toBeVisible();

  // 2. Verify page shows inventory check table with mock products
  await expect(page.locator('th', { hasText: 'Sản phẩm' })).toBeVisible();
  await expect(page.locator('th', { hasText: 'Tồn lý thuyết' })).toBeVisible();
  await expect(page.locator('th', { hasText: 'Tồn thực tế' })).toBeVisible();

  // 3. Verify mock products are listed with theoretical quantities
  await expect(page.locator('text=Cháo ếch')).toBeVisible();
  await expect(page.locator('text=Cơm sườn')).toBeVisible();
  await expect(page.locator('text=Bánh mì')).toBeVisible();
  await expect(page.locator('text=Nước ép')).toBeVisible();
  await expect(page.locator('text=Phở bò')).toBeVisible();

  // 4. Set actual qty for "Cháo ếch" — 20 (theoretical) → enter 18 (deficit of 2)
  //    The first input field corresponds to the first product (Cháo ếch)
  const actualQtyInputs = page.locator('input[type="number"]');
  await actualQtyInputs.first().fill('18');

  // 5. Set actual qty for "Cơm sườn" — 15 (theoretical) → enter 12 (deficit of 3)
  await actualQtyInputs.nth(1).fill('12');

  // 6. Set actual qty for "Bánh mì" — 30 (theoretical) → enter 30 (balanced)
  await actualQtyInputs.nth(2).fill('30');

  // 7. Set actual qty for "Nước ép" — 25 (theoretical) → enter 28 (surplus of 3)
  await actualQtyInputs.nth(3).fill('28');

  // 8. Click the check button to calculate variance
  await page.getByRole('button', { name: /tính biến động/i }).click();
  await page.waitForTimeout(300); // allow UI to render results

  // 9. Verify results section appears
  await expect(page.locator('h2', { hasText: /Kết quả/i })).toBeVisible();

  // 10. Verify variance display for "Cháo ếch" — theoretical 20, actual 18 → variance = +2 (deficit)
  const chaoRow = page.locator('td', { hasText: 'Cháo ếch' }).first().locator('tr');
  // Variance column should show +2 (theoretical - actual = 20 - 18)
  await expect(page.locator('text=+2')).toBeVisible();

  // 11. Verify loss cost displayed for deficit — 2 × 8000 = 16,000₫
  await expect(page.locator('text=16.000₫')).toBeVisible();

  // 12. Verify "Cơm sườn" — theoretical 15, actual 12 → variance = +3 (deficit), loss = 3 × 10000 = 30,000₫
  await expect(page.locator('text=+3')).toBeVisible();
  await expect(page.locator('text=30.000₫')).toBeVisible();

  // 13. Verify "Bánh mì" — theoretical 30, actual 30 → balanced (variance = 0, no loss)
  const banhMiRow = page.locator('td', { hasText: 'Bánh mì' }).first();
  // Check no deficit text appears for this row
  const banhMiCell = banhMiRow.locator('tr').nth(0);
  await expect(banhMiCell.locator('text=—')).toBeVisible();

  // 14. Verify "Nước ép" — theoretical 25, actual 28 → surplus (variance = -3)
  await expect(page.locator('text=-3')).toBeVisible();

  // 15. Verify total loss cost display
  await expect(page.locator('text=Tổng hao hụt')).toBeVisible();

  // 16. Verify Phở bò — theoretical 10, actual 0 (default) → variance = +10, loss = 10 × 12000 = 120,000₫
  await expect(page.locator('text=+10')).toBeVisible();
  await expect(page.locator('text=120.000₫')).toBeVisible();

  // 17. Verify total loss: 16000 + 30000 + 0 + 0 + 120000 = 166,000₫
  await expect(page.locator('text=166.000₫')).toBeVisible();

  // 18. Verify status badges — THIẾU for deficit products
  await expect(page.locator('text=THIẾU')).toBeVisible();
  // DƯ for surplus products
  await expect(page.locator('text=DƯ')).toBeVisible();
  // ĐỒNG BỘ for balanced products
  await expect(page.locator('text=ĐỒNG BỘ')).toBeVisible();
});
