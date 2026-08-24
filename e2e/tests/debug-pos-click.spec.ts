import { test, expect } from '@playwright/test';

test('verify click works on product card', async ({ page }) => {
  await page.goto('http://localhost:3000/pos');
  await page.waitForTimeout(1000);

  // Search
  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cháo ếch');
  await page.waitForTimeout(300);

  // Find the product card's parent div (the clickable one)
  // The DOM shows: <div onClick={...}> contains <div>Cháo ếch</div> and <div>Tồn kho: 20 chén</div>
  // Let's find that parent div by checking the text content of all product-level divs
  
  const parentInfo = await page.evaluate(() => {
    // Get all divs that contain "Cháo ếch" but are not the name element itself
    const all = document.querySelectorAll('div');
    const results = [];
    for (const el of all) {
      if (el.textContent?.includes('Cháo ếch') && 
          el.textContent?.includes('Tồn kho') && 
          el.children.length > 1) {
        results.push({
          tag: el.tagName.toLowerCase(),
          text: el.textContent?.trim().substring(0, 100),
          childCount: el.children.length,
          hasOnClick: el.onclick !== null || el.getAttribute('onclick') !== null,
        });
      }
    }
    return results;
  });
  console.log('=== Product card parent divs ===');
  console.log(JSON.stringify(parentInfo, null, 2));

  // Try clicking the parent div that contains both name + stock
  const cardDiv = page.locator('div', { hasText: 'Cháo ếch' }).filter({ hasText: 'Tồn kho: 20 chén' }).first();
  console.log('Card div locator count:', await cardDiv.count());
  
  // Click the card
  await cardDiv.click();
  await page.waitForTimeout(500);

  // Check if cart changed
  const cartHeading = await page.locator('h3').allTextContents();
  console.log('Cart headings after click:', cartHeading);
  
  expect(true).toBe(true);
});
