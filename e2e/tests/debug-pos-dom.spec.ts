import { test, expect } from '@playwright/test';

test('inspect DOM', async ({ page }) => {
  await page.goto('http://localhost:3000/pos');
  await page.waitForTimeout(2000);
  
  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cháo ếch');
  await page.waitForTimeout(500);

  // Find all exact-match text elements
  const productElements = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const results = [];
    for (const el of all) {
      if (el.textContent?.trim() === 'Cháo ếch' && el.children.length === 0) {
        results.push({
          tag: el.tagName.toLowerCase(),
          className: el.className,
          text: el.textContent?.trim(),
          parentTag: el.parentElement?.tagName.toLowerCase(),
          parentClass: el.parentElement?.className,
          grandparentTag: el.parentElement?.parentElement?.tagName.toLowerCase(),
        });
      }
    }
    return results;
  });
  console.log('=== Exact "Cháo ếch" elements ===');
  console.log(JSON.stringify(productElements, null, 2));

  // Find all "Tồn kho" elements
  const stockElements = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const results = [];
    for (const el of all) {
      if (el.textContent?.includes('Tồn kho')) {
        results.push({
          tag: el.tagName.toLowerCase(),
          className: el.className,
          text: el.textContent?.trim().substring(0, 50),
          parentTag: el.parentElement?.tagName.toLowerCase(),
        });
      }
    }
    return results;
  });
  console.log('=== "Tồn kho" elements ===');
  console.log(JSON.stringify(stockElements, null, 2));

  // Find cart elements
  const cartElements = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const results = [];
    for (const el of all) {
      if (el.textContent?.includes('Giỏ hàng')) {
        results.push({
          tag: el.tagName.toLowerCase(),
          className: el.className,
          text: el.textContent?.trim().substring(0, 80),
          parentTag: el.parentElement?.tagName.toLowerCase(),
        });
      }
    }
    return results;
  });
  console.log('=== "Giỏ hàng" elements ===');
  console.log(JSON.stringify(cartElements, null, 2));

  // Try to understand the full page structure
  const pageStructure = await page.evaluate(() => {
    const body = document.body;
    function walk(el: Element, depth: number): string {
      if (depth > 5) return '';
      const tag = el.tagName.toLowerCase();
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ').join('.')}` : '';
      const txt = el.textContent?.trim().substring(0, 40).replace(/\n/g, ' ') || '';
      const indent = '  '.repeat(depth);
      let result = `${indent}<${tag}${cls}>${txt ? ' ' + txt : ''}\n`;
      for (let i = 0; i < el.children.length; i++) {
        result += walk(el.children[i], depth + 1);
      }
      return result;
    }
    return walk(body, 0);
  });
  console.log('=== Page structure ===');
  console.log(pageStructure);

  expect(true).toBe(true);
});
