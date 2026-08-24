import { test, expect } from '@playwright/test';

test('check 15.000 formatting', async ({ page }) => {
  await page.goto('http://localhost:3000/pos');
  await page.waitForTimeout(1000);
  
  await page.getByPlaceholder(/tìm kiếm|search/i).first().fill('Cháo ếch');
  await page.waitForTimeout(300);
  await page.getByText('Cháo ếch', { exact: true }).first().click();
  await page.waitForTimeout(500);

  // Check what the span text actually contains
  const spans = await page.evaluate(() => {
    const all = document.querySelectorAll('span');
    return Array.from(all).map(s => ({
      text: s.textContent || '',
      textCodePoints: Array.from(s.textContent || '').map(c => c.codePointAt(0)?.toString(16)),
    }));
  });
  console.log('Spans with 15 or 35:', JSON.stringify(spans.filter(s => (s.text.includes('15') || s.text.includes('35'))), null, 2));

  // Check getByText match count for different patterns
  const exact15 = page.getByText('15.000₫').count();
  const space15 = page.getByText('15.000 ₫').count();
  const regex15 = page.getByText(/15\.000/).count();
  console.log('getByText("15.000₫") count:', await exact15);
  console.log('getByText("15.000 ₫") count:', await space15);
  console.log('getByText(/15\\.000/) count:', await regex15);

  expect(true).toBe(true);
});
