import { test, expect } from '@playwright/test';

test('verify Playwright native click works', async ({ page }) => {
  await page.goto('http://localhost:3000/pos');
  await page.waitForTimeout(1000);
  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cháo ếch');
  await page.waitForTimeout(300);

  // Strategy: Use Playwright native click on the exact text element
  const productNameEl = page.getByText('Cháo ếch', { exact: true }).first();
  await expect(productNameEl).toBeVisible();

  // This should work because click() dispatches events through React's system
  await productNameEl.click();
  await page.waitForTimeout(500);

  const cartText = await page.locator('h3').allTextContents();
  console.log('Cart after native click:', cartText);

  expect(cartText).toContain('Giỏ hàng (1)');
});
