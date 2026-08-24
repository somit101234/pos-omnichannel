import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/pos');
  await page.waitForTimeout(2000);
  
  // Fill search to find Cháo ếch
  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cháo ếch');
  await page.waitForTimeout(500);

  // Dump accessibility tree
  const tree = await page.accessibility.snapshot();
  console.log(JSON.stringify(tree, null, 2));

  // Dump full DOM structure around product cards
  const domInfo = await page.evaluate(() => {
    // Find all elements with "Cháo" text
    const all = document.querySelectorAll('*');
    const results = [];
    for (const el of all) {
      if (el.textContent?.includes('Cháo') && el.children.length <= 2) {
        results.push({
          tag: el.tagName.toLowerCase(),
          className: el.className,
          text: el.textContent?.trim().substring(0, 80),
          style: el.getAttribute('style')?.substring(0, 80),
          innerHTML: el.innerHTML.substring(0, 200),
        });
      }
    }
    return results;
  });
  console.log('\n--- Elements with "Cháo" text ---');
  console.log(JSON.stringify(domInfo, null, 2));

  // Check cart panel after adding a product
  // Find the first product name element and click it
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
          parentText: el.parentElement?.textContent?.trim().substring(0, 100),
          grandparentTag: el.parentElement?.parentElement?.tagName.toLowerCase(),
        });
      }
    }
    return results;
  });
  console.log('\n--- Exact "Cháo ếch" text elements ---');
  console.log(JSON.stringify(productElements, null, 2));

  // Check cart structure
  const cartInfo = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const results = [];
    for (const el of all) {
      if (el.textContent?.includes('Giỏ hàng')) {
        results.push({
          tag: el.tagName.toLowerCase(),
          className: el.className,
          text: el.textContent?.trim().substring(0, 80),
        });
      }
    }
    return results;
  });
  console.log('\n--- Cart elements ---');
  console.log(JSON.stringify(cartInfo, null, 2));

  await browser.close();
})();
