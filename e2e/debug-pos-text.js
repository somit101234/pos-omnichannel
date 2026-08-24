
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/pos');
  await page.waitForTimeout(3000);
  
  // Dump text content of all visible elements
  const textContent = await page.evaluate(() => {
    const allText = [];
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && text.length < 200) {
        allText.push(el.tagName + ': "' + text + '"');
      }
    });
    return allText.join('\n');
  });
  console.log(textContent);
  await browser.close();
})();
