# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: inventory-e2e.spec.ts >> Inventory variance — deficit case (actual < theoretical)
- Location: tests/inventory-e2e.spec.ts:17:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=16.000₫')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=16.000₫')

```

```yaml
- banner:
  - heading "Kiểm kho cuối ngày" [level=1]
  - paragraph: So sánh tồn lý thuyết vs tồn thực tế
- heading "Danh sách tồn kho" [level=2]
- table:
  - rowgroup:
    - row "STT Sản phẩm Đơn vị Tồn lý thuyết Min stock Trạng thái":
      - columnheader "STT"
      - columnheader "Sản phẩm"
      - columnheader "Đơn vị"
      - columnheader "Tồn lý thuyết"
      - columnheader "Min stock"
      - columnheader "Trạng thái"
  - rowgroup:
    - row "1 Cháo ếch chén 20 5 BÌNH THƯỜNG":
      - cell "1"
      - cell "Cháo ếch"
      - cell "chén"
      - cell "20"
      - cell "5"
      - cell "BÌNH THƯỜNG"
    - row "2 Cơm sườn suất 15 3 BÌNH THƯỜNG":
      - cell "2"
      - cell "Cơm sườn"
      - cell "suất"
      - cell "15"
      - cell "3"
      - cell "BÌNH THƯỜNG"
    - row "3 Bánh mì cái 30 10 BÌNH THƯỜNG":
      - cell "3"
      - cell "Bánh mì"
      - cell "cái"
      - cell "30"
      - cell "10"
      - cell "BÌNH THƯỜNG"
    - row "4 Nước ép ly 25 8 BÌNH THƯỜNG":
      - cell "4"
      - cell "Nước ép"
      - cell "ly"
      - cell "25"
      - cell "8"
      - cell "BÌNH THƯỜNG"
    - row "5 Phở bò bát 10 4 BÌNH THƯỜNG":
      - cell "5"
      - cell "Phở bò"
      - cell "bát"
      - cell "10"
      - cell "4"
      - cell "BÌNH THƯỜNG"
- heading "Nhập tồn thực tế (actual qty)" [level=2]
- table:
  - rowgroup:
    - row "STT Sản phẩm Đơn vị Tồn lý thuyết Tồn thực tế (actual) Giá vốn / đơn vị":
      - columnheader "STT"
      - columnheader "Sản phẩm"
      - columnheader "Đơn vị"
      - columnheader "Tồn lý thuyết"
      - columnheader "Tồn thực tế (actual)"
      - columnheader "Giá vốn / đơn vị"
  - rowgroup:
    - row "1 Cháo ếch chén 20 18 8.000 ₫":
      - cell "1"
      - cell "Cháo ếch"
      - cell "chén"
      - cell "20"
      - cell "18":
        - spinbutton: "18"
      - cell "8.000 ₫"
    - row "2 Cơm sườn suất 15 12 10.000 ₫":
      - cell "2"
      - cell "Cơm sườn"
      - cell "suất"
      - cell "15"
      - cell "12":
        - spinbutton: "12"
      - cell "10.000 ₫"
    - row "3 Bánh mì cái 30 30 3.000 ₫":
      - cell "3"
      - cell "Bánh mì"
      - cell "cái"
      - cell "30"
      - cell "30":
        - spinbutton: "30"
      - cell "3.000 ₫"
    - row "4 Nước ép ly 25 28 5.000 ₫":
      - cell "4"
      - cell "Nước ép"
      - cell "ly"
      - cell "25"
      - cell "28":
        - spinbutton: "28"
      - cell "5.000 ₫"
    - row "5 Phở bò bát 10 0 12.000 ₫":
      - cell "5"
      - cell "Phở bò"
      - cell "bát"
      - cell "10"
      - cell "0":
        - spinbutton: "0"
      - cell "12.000 ₫"
- button "Tính biến động (check)"
- heading "Kết quả kiểm kho" [level=2]
- table:
  - rowgroup:
    - row "STT Sản phẩm Tồn lý thuyết Tồn thực tế Biến động (variance) Hao hụt (loss cost) Trạng thái":
      - columnheader "STT"
      - columnheader "Sản phẩm"
      - columnheader "Tồn lý thuyết"
      - columnheader "Tồn thực tế"
      - columnheader "Biến động (variance)"
      - columnheader "Hao hụt (loss cost)"
      - columnheader "Trạng thái"
  - rowgroup:
    - row "1 Cháo ếch 20 18 +2 16.000 ₫ THIẾU":
      - cell "1"
      - cell "Cháo ếch"
      - cell "20"
      - cell "18"
      - cell "+2"
      - cell "16.000 ₫"
      - cell "THIẾU"
    - row "2 Cơm sườn 15 12 +3 30.000 ₫ THIẾU":
      - cell "2"
      - cell "Cơm sườn"
      - cell "15"
      - cell "12"
      - cell "+3"
      - cell "30.000 ₫"
      - cell "THIẾU"
    - row "3 Bánh mì 30 30 0 — ĐỒNG BỘ":
      - cell "3"
      - cell "Bánh mì"
      - cell "30"
      - cell "30"
      - cell "0"
      - cell "—"
      - cell "ĐỒNG BỘ"
    - row "4 Nước ép 25 28 -3 — DƯ":
      - cell "4"
      - cell "Nước ép"
      - cell "25"
      - cell "28"
      - cell "-3"
      - cell "—"
      - cell "DƯ"
    - row "5 Phở bò 10 0 +10 120.000 ₫ THIẾU":
      - cell "5"
      - cell "Phở bò"
      - cell "10"
      - cell "0"
      - cell "+10"
      - cell "120.000 ₫"
      - cell "THIẾU"
- text: Tổng hao hụt 166.000 ₫
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * E2E: Inventory check — variance + cost calculation
  5  |  *
  6  |  * Spec: .specify/specs/001-POS-Omnichannel-MVP/spec.md (US6 — Inventory)
  7  |  * Task: T040
  8  |  *
  9  |  * AC: Playwright test: set actual qty different from theoretical → verify variance display
  10 |  * AC: npx playwright test e2e/inventory-e2e.spec.ts → 1/1 PASS
  11 |  *
  12 |  * FR-028: Owner thực hiện inventory check — nhập actual qty cho từng sản phẩm
  13 |  * FR-029: Hệ thống tính variance = theoretical - actual cho từng sản phẩm
  14 |  * FR-030: Tính hao hụt cost = |variance| × unit_cost cho sản phẩm thiếu (deficit)
  15 |  */
  16 | 
  17 | test('Inventory variance — deficit case (actual < theoretical)', async ({ page }) => {
  18 |   // 1. Navigate to inventory check page
  19 |   await page.goto('/inventory');
  20 |   await expect(page.locator('h1', { hasText: /Kiểm kho/i })).toBeVisible();
  21 | 
  22 |   // 2. Verify page has 2 tables initially (stock list + input)
  23 |   const tables = page.locator('table');
  24 |   await expect(tables).toHaveCount(2);
  25 | 
  26 |   // 3. Verify mock products in stock list table
  27 |   const stockTable = tables.nth(0);
  28 |   await expect(stockTable.locator('text=Cháo ếch')).toBeVisible();
  29 |   await expect(stockTable.locator('text=Cơm sườn')).toBeVisible();
  30 |   await expect(stockTable.locator('text=Bánh mì')).toBeVisible();
  31 |   await expect(stockTable.locator('text=Nước ép')).toBeVisible();
  32 |   await expect(stockTable.locator('text=Phở bò')).toBeVisible();
  33 | 
  34 |   // 4. Fill actual qty values BEFORE clicking check button
  35 |   const inputTable = tables.nth(1);
  36 |   const inputs = inputTable.locator('input[type="number"]');
  37 |   await expect(inputs).toHaveCount(5);
  38 |   await inputs.nth(0).fill('18');   // Cháo ếch: 20 → 18 (deficit 2)
  39 |   await inputs.nth(1).fill('12');   // Cơm sườn: 15 → 12 (deficit 3)
  40 |   await inputs.nth(2).fill('30');   // Bánh mì: 30 → 30 (balanced)
  41 |   await inputs.nth(3).fill('28');   // Nước ép: 25 → 28 (surplus 3)
  42 |   // Phở bò: 10 → 0 (default, deficit 10)
  43 | 
  44 |   // 5. Click check button
  45 |   await page.getByRole('button', { name: /tính biến động/i }).click();
  46 |   await page.waitForTimeout(300);
  47 | 
  48 |   // 6. Verify results table appeared
  49 |   await expect(tables).toHaveCount(3);
  50 | 
  51 |   // 7. Verify results section
  52 |   await expect(page.locator('h2', { hasText: /Kết quả/i })).toBeVisible();
  53 | 
  54 |   // 8. Verify variance values — use results table scoped text locators
  55 |   await expect(page.locator('text=+2')).toBeVisible();
  56 |   await expect(page.locator('text=+3')).toBeVisible();
  57 |   await expect(page.locator('text=-3')).toBeVisible();
  58 |   await expect(page.locator('text=+10')).toBeVisible();
  59 | 
  60 |   // 9. Verify loss cost values
  61 |   //    Cháo ếch: 2 × 8000 = 16,000₫
> 62 |   await expect(page.locator('text=16.000₫')).toBeVisible();
     |                                              ^ Error: expect(locator).toBeVisible() failed
  63 |   //    Cơm sườn: 3 × 10000 = 30,000₫
  64 |   await expect(page.locator('text=30.000₫')).toBeVisible();
  65 |   //    Phở bò: 10 × 12000 = 120,000₫
  66 |   await expect(page.locator('text=120.000₫')).toBeVisible();
  67 |   //    Bánh mì balanced → "—"
  68 |   await expect(page.locator('text=—')).toBeVisible();
  69 | 
  70 |   // 10. Verify total loss
  71 |   await expect(page.locator('text=Tổng hao hụt')).toBeVisible();
  72 |   await expect(page.locator('text=166.000₫')).toBeVisible();
  73 | 
  74 |   // 11. Verify status badges
  75 |   await expect(page.locator('text=THIẾU')).toBeVisible();
  76 |   await expect(page.locator('text=DƯ')).toBeVisible();
  77 |   await expect(page.locator('text=ĐỒNG BỘ')).toBeVisible();
  78 | });
  79 | 
```