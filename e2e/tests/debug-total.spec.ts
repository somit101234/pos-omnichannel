import { test, expect } from '@playwright/test';

test('check total formatting', async ({ page }) => {
  await page.goto('http://localhost:3000/pos');
  await page.waitForTimeout(1000);
  
  // Add 2 products
  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cháo ếch');
  await page.waitForTimeout(300);
  await page.getByText('Cháo ếch', { exact: true }).first().click();
  await page.waitForTimeout(500);

  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cơm sườn');
  await page.waitForTimeout(300);
  await page.getByText('Cơm sườn', { exact: true }).first().click();
  await page.waitForTimeout(500);

  // Check the h3 cart title
  const h3Texts = await page.locator('h3').allTextContents();
  console.log('h3 texts:', h3Texts);

  // Check ALL text in the cart section
  const cartSection = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const results = [];
    for (const el of all) {
      if (el.textContent?.includes('35') || el.textContent?.includes('35') || 
          el.textContent?.includes('35')) {
        results.push({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 80),
          innerText: el.innerText?.trim().substring(0, 80),
        });
      }
    }
    return results;
  });
  console.log('Elements containing 35:', JSON.stringify(cartSection, null, 2));

  // Check what getByText('35.000₫') would match
  const totalElements = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const results = [];
    for (const el of all) {
      const text = el.textContent || '';
      // Try different representations of 35000
      if (text.includes('35000') || text.includes('35.000') || text.includes('35') && text.includes('₫')) {
        results.push({
          tag: el.tagName.toLowerCase(),
          text: (text || '').substring(0, 80),
          innerText: (el.innerText || '').substring(0, 80),
          childCount: el.children.length,
        });
      }
    }
    return results;
  });
  console.log('Elements with 35+dong:', JSON.stringify(totalElements, null, 2));

  // Check ALL span elements
  const spans = await page.evaluate(() => {
    const all = document.querySelectorAll('span');
    return Array.from(all).map(s => ({
      tag: s.tagName.toLowerCase(),
      className: s.className,
      text: s.textContent || '',
      innerText: s.innerText || '',
    }));
  });
  console.log('All spans:', JSON.stringify(spans, null, 2));

  expect(true).toBe(true);
});
