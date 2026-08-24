import { test, expect } from '@playwright/test';

test('find correct clickable element', async ({ page }) => {
  await page.goto('http://localhost:3000/pos');
  await page.waitForTimeout(1000);
  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cháo ếch');
  await page.waitForTimeout(300);

  // Get the 7th matching div (the actual product card with onClick)
  // Index 0-5 are ancestors, index 6 is the product card, index 7 is the text-only element
  const allDivs = await page.locator('div').all();
  console.log(`Total divs: ${allDivs.length}`);

  for (let i = 0; i < allDivs.length; i++) {
    const text = await allDivs[i].textContent();
    if (text?.includes('Cháo ếch')) {
      const hasOnClick = await allDivs[i].evaluate(el => (el as HTMLElement).onclick !== null || (el as HTMLElement).getAttribute('onclick') !== null);
      console.log(`[${i}] tag=${allDivs[i].evaluate(el => el.tagName.toLowerCase())} text="${(text||'').substring(0,60)}" onClick=${hasOnClick}`);
    }
  }

  // The product card is at index 6 (0-based). Let's try to click it and see what happens
  // But first let's try a different approach: use dispatchEvent to fire a real click
  // on the element identified by its text content containing all product fields

  // Actually, let's try clicking via JS by finding the element and calling click()
  const result = await page.evaluate(() => {
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const text = div.textContent || '';
      if (text.includes('Cháo ếch') && text.includes('Tồn kho') && text.includes('15.000') && div.onclick) {
        // This is the product card
        const cartBefore = document.querySelector('[class*="Giỏ hàng"]')?.textContent || '';
        console.log('Cart before:', cartBefore);
        
        // Trigger the onClick handler
        try {
          div.onclick(new MouseEvent('click', { bubbles: true, cancelable: true }));
          console.log('onClick called successfully');
        } catch (e) {
          console.log('onClick error:', e);
        }
        return { tag: div.tagName, text: text.substring(0, 60) };
      }
    }
    return { tag: null };
  });
  console.log('Clicked element:', JSON.stringify(result));

  await page.waitForTimeout(500);

  // Check cart after JS-triggered click
  const cartTexts = await page.locator('h3').allTextContents();
  console.log('Cart h3 texts:', cartTexts);

  expect(true).toBe(true);
});
