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

test('Inventory variance — deficit case (actual < theoretical)', async ({ page }) => {
  // 1. Navigate to inventory check page
  await page.goto('/inventory');
  await expect(page.locator('h1', { hasText: /Kiểm kho/i })).toBeVisible();

  // 2. Verify page has 2 tables initially (stock list + input)
  const tables = page.locator('table');
  await expect(tables).toHaveCount(2);

  // 3. Verify mock products in stock list table
  const stockTable = tables.nth(0);
  await expect(stockTable.locator('text=Cháo ếch')).toBeVisible();
  await expect(stockTable.locator('text=Cơm sườn')).toBeVisible();
  await expect(stockTable.locator('text=Bánh mì')).toBeVisible();
  await expect(stockTable.locator('text=Nước ép')).toBeVisible();
  await expect(stockTable.locator('text=Phở bò')).toBeVisible();

  // 4. Fill actual qty values BEFORE clicking check button
  const inputTable = tables.nth(1);
  const inputs = inputTable.locator('input[type="number"]');
  await expect(inputs).toHaveCount(5);
  await inputs.nth(0).fill('18');   // Cháo ếch: 20 → 18 (deficit 2)
  await inputs.nth(1).fill('12');   // Cơm sườn: 15 → 12 (deficit 3)
  await inputs.nth(2).fill('30');   // Bánh mì: 30 → 30 (balanced)
  await inputs.nth(3).fill('28');   // Nước ép: 25 → 28 (surplus 3)
  // Phở bò: 10 → 0 (default, deficit 10)

  // 5. Click check button
  await page.getByRole('button', { name: /tính biến động/i }).click();
  await page.waitForTimeout(300);

  // 6. Verify results table appeared
  await expect(tables).toHaveCount(3);

  // 7. Verify results section
  await expect(page.locator('h2', { hasText: /Kết quả/i })).toBeVisible();

  // 8. Verify variance values
  await expect(page.locator('text=+2')).toBeVisible();
  await expect(page.locator('text=+3')).toBeVisible();
  await expect(page.locator('text=-3')).toBeVisible();
  await expect(page.locator('text=+10')).toBeVisible();

  // 9. Verify loss cost — use regex filter to handle VND NBSP formatting
  await expect(page.locator('td').filter({ hasText: /16\.000[\s\u00a0]₫/ })).toBeVisible();
  await expect(page.locator('td').filter({ hasText: /30\.000[\s\u00a0]₫/ })).toBeVisible();
  await expect(page.locator('td').filter({ hasText: /120\.000[\s\u00a0]₫/ })).toBeVisible();

  // 10. Verify balanced product shows "—"
  await expect(page.locator('text=—')).toBeVisible();

  // 11. Verify total loss
  await expect(page.locator('text=Tổng hao hụt')).toBeVisible();
  await expect(page.locator('td').filter({ hasText: /166\.000[\s\u00a0]₫/ })).toBeVisible();

  // 12. Verify status badges
  await expect(page.locator('text=THIẾU')).toBeVisible();
  await expect(page.locator('text=DƯ')).toBeVisible();
  await expect(page.locator('text=ĐỒNG BỘ')).toBeVisible();
});
