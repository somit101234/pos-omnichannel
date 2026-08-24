import { test, expect } from '@playwright/test';

test('try different click strategies', async ({ page }) => {
  await page.goto('http://localhost:3000/pos');
  await page.waitForTimeout(1000);
  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cháo ếch');
  await page.waitForTimeout(300);

  // Strategy 1: Playwright click on the product name text element
  const productNameEl = page.getByText('Cháo ếch', { exact: true }).first();
  await expect(productNameEl).toBeVisible();
  
  // Use dispatchEvent to fire a synthetic click
  await productNameEl.evaluate((el) => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await page.waitForTimeout(500);
  
  let cartText1 = await page.locator('h3').allTextContents();
  console.log('After dispatchEvent on name element:', cartText1);

  // Strategy 2: Force click on the product card by text matching
  // Get the specific div at a certain depth
  const cartText2Before = await page.locator('h3').allTextContents();
  console.log('Cart before strategy 2:', cartText2Before);

  // Find the exact product card div by text content match
  const productCardFound = await page.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const text = div.textContent || '';
      // Must contain all three fields but NOT the header text
      if (text.includes('Cháo ếch') && 
          text.includes('Tồn kho') && 
          text.includes('15.000') && 
          !text.includes('POS — Bán hàng') &&
          !text.includes('Giỏ hàng')) {
        // Try calling the React onClick
        const handler = div.onclick;
        if (handler) {
          handler.call(div, new MouseEvent('click', { bubbles: true }));
          return { called: true, text: text.substring(0, 60) };
        }
      }
    }
    return { called: false };
  });
  console.log('Product card onClick result:', JSON.stringify(productCardFound));

  await page.waitForTimeout(500);
  const cartText2 = await page.locator('h3').allTextContents();
  console.log('Cart after strategy 2:', cartText2);

  expect(true).toBe(true);
});
