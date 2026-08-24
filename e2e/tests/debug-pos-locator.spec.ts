import { test, expect } from '@playwright/test';

test('debug click target', async ({ page }) => {
  await page.goto('http://localhost:3000/pos');
  await page.waitForTimeout(1000);

  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cháo ếch');
  await page.waitForTimeout(300);

  // Get the exact element that our locator resolves to
  const elementInfo = await page.evaluate(() => {
    // The problematic selector: div.filter({ hasText: 'Cháo ếch' }).first()
    // In Playwright, filter() operates on the already selected elements
    // page.locator('div').filter({ hasText: 'Cháo ếch' }).first()
    // This selects ALL divs, then filters those containing "Cháo ếch"
    // Then .first() takes the FIRST matching div
    
    const allDivs = document.querySelectorAll('div');
    const matching = [];
    for (const div of allDivs) {
      if (div.textContent?.includes('Cháo ếch')) {
        matching.push({
          tag: div.tagName.toLowerCase(),
          text: (div.textContent || '').substring(0, 80),
          childCount: div.children.length,
          hasOnClick: div.onclick !== null || div.getAttribute('onclick') !== null,
        });
        if (matching.length > 1 && matching.length <= 5) {
          // Show children of first few matches
          const children = [];
          for (let i = 0; i < Math.min(div.children.length, 5); i++) {
            children.push({
              tag: div.children[i].tagName.toLowerCase(),
              text: (div.children[i].textContent || '').substring(0, 50),
            });
          }
          (matching[matching.length - 1] as any).children = children;
        }
      }
    }
    return matching;
  });
  console.log('=== All divs containing "Cháo ếch" (in document order) ===');
  console.log(JSON.stringify(elementInfo, null, 2));

  // The key question: which element does Playwright's .first() pick?
  // It picks the FIRST div in DOM order that contains the text
  // That's likely the root container div, NOT the product card!
  
  // Let's verify by counting
  const allDivsWithChao = await page.locator('div').filter({ hasText: 'Cháo ếch' }).count();
  console.log('Total divs containing "Cháo ếch":', allDivsWithChao);

  // Get the FIRST one's info
  const firstDiv = await page.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      if (div.textContent?.includes('Cháo ếch')) {
        return {
          tag: div.tagName.toLowerCase(),
          text: (div.textContent || '').substring(0, 80),
          childCount: div.children.length,
          hasOnClick: div.onclick !== null || div.getAttribute('onclick') !== null,
          parentTag: div.parentElement?.tagName.toLowerCase(),
          grandparentTag: div.parentElement?.parentElement?.tagName.toLowerCase(),
        };
      }
    }
    return null;
  });
  console.log('=== FIRST div containing "Cháo ếch" (what .first() picks) ===');
  console.log(JSON.stringify(firstDiv, null, 2));

  expect(true).toBe(true);
});
