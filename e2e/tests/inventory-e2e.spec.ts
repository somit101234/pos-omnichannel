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

  // 2. Verify page has 2 tables initially (stock list + input); results table renders after click
  const tables = page.locator('table');
  await expect(tables).toHaveCount(2);

  // 3. Verify mock products in stock list table (table[0])
  const stockTable = tables.nth(0);
  await expect(stockTable.locator('text=Cháo ếch')).toBeVisible();
  await expect(stockTable.locator('text=Cơm sườn')).toBeVisible();
  await expect(stockTable.locator('text=Bánh mì')).toBeVisible();
  await expect(stockTable.locator('text=Nước ép')).toBeVisible();
  await expect(stockTable.locator('text=Phở bò')).toBeVisible();

  // 4. Verify input table has actual qty input fields
  const inputTable = tables.nth(1);
  await expect(inputTable.locator('th', { hasText: 'Tồn thực tế (actual)' })).toBeVisible();
  const actualQtyInputs = inputTable.locator('input[type="number"]');
  await expect(actualQtyInputs).toHaveCount(5);

  // 5. Set actual qty for each product BEFORE clicking check
  //    Cháo ếch: theoretical 20 → actual 18 (deficit of 2)
  await actualQtyInputs.nth(0).fill('18');
  //    Cơm sườn: theoretical 15 → actual 12 (deficit of 3)
  await actualQtyInputs.nth(1).fill('12');
  //    Bánh mì: theoretical 30 → actual 30 (balanced)
  await actualQtyInputs.nth(2).fill('30');
  //    Nước ép: theoretical 25 → actual 28 (surplus of 3)
  await actualQtyInputs.nth(3).fill('28');
  //    Phở bò: theoretical 10 → actual 0 (default, deficit of 10)

  // 6. Click the check button to calculate variance
  await page.getByRole('button', { name: /tính biến động/i }).click();
  await page.waitForTimeout(300);

  // 7. Verify results table appears (now 3 tables)
  await expect(tables).toHaveCount(3);
  const resultsTable = tables.nth(2);
  await expect(resultsTable.locator('th', { hasText: 'Biến động (variance)' })).toBeVisible();
  await expect(resultsTable.locator('th', { hasText: 'Hao hụt (loss cost)' })).toBeVisible();

  // 8. Verify results section title
  await expect(page.locator('h2', { hasText: /Kết quả/i })).toBeVisible();

  // 9. Verify variance for each product in results table
  //    Cháo ếch: variance = 20 - 18 = +2
  await expect(resultsTable.locator('text=+2')).toBeVisible();
  //    Cơm sườn: variance = 15 - 12 = +3
  await expect(resultsTable.locator('text=+3')).toBeVisible();
  //    Nước ép: variance = 25 - 28 = -3
  await expect(resultsTable.locator('text=-3')).toBeVisible();
  //    Phở bò: variance = 10 - 0 = +10
  await expect(resultsTable.locator('text=+10')).toBeVisible();

  // 10. Verify loss cost for deficit products using row-scoped locators
  //    Cháo ếch: loss = 2 × 8000 = 16,000₫
  const chaoRow = resultsTable.locator('tr', { has: resultsTable.locator('td', { hasText: 'Cháo ếch' }) });
  await expect(chaoRow.locator('td').nth(5)).toHaveText(/16\.000₫/);

  //    Cơm sườn: loss = 3 × 10000 = 30,000₫
  const comSulRow = resultsTable.locator('tr', { has: resultsTable.locator('td', { hasText: 'Cơm sườn' }) });
  await expect(comSulRow.locator('td').nth(5)).toHaveText(/30\.000₫/);

  //    Phở bò: loss = 10 × 12000 = 120,000₫
  const phoBoRow = resultsTable.locator('tr', { has: resultsTable.locator('td', { hasText: 'Phở bò' }) });
  await expect(phoBoRow.locator('td').nth(5)).toHaveText(/120\.000₫/);

  //    Bánh mì: balanced → "—"
  const banhMiRow = resultsTable.locator('tr', { has: resultsTable.locator('td', { hasText: 'Bánh mì' }) });
  await expect(banhMiRow.locator('td').nth(5)).toHaveText('—');

  // 11. Verify total loss: 16000 + 30000 + 0 + 0 + 120000 = 166,000₫
  await expect(page.locator('text=Tổng hao hụt')).toBeVisible();
  await expect(page.locator('text=166.000₫')).toBeVisible();

  // 12. Verify status badges
  await expect(page.locator('text=THIẾU')).toBeVisible();
  await expect(page.locator('text=DƯ')).toBeVisible();
  await expect(page.locator('text=ĐỒNG BỘ')).toBeVisible();
});
