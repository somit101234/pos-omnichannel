# UX Prototype — POS Omnichannel

**Spec:** .specify/specs/001-POS-Omnichannel-MVP/spec.md

## Design System Principles

### Color Palette (Material Design)
- **Primary:** #1976D2 (Blue) — buttons, active states, links
- **Secondary:** #424242 (Grey) — text, borders
- **Success:** #2E7D32 (Green) — payments success, stock normal
- **Warning:** #F57C00 (Orange) — low stock, pending orders
- **Error:** #C62828 (Red) — errors, overdue orders
- **Background:** #FAFAFA (Light grey) — page background
- **POS Theme:** #212121 (Dark) — POS page dark mode for reduced eye strain

### Typography
- **Font:** Inter (Google Fonts) — clean, readable at small sizes
- **Body:** 14px (desktop), 16px (mobile)
- **Headings:** 18px/24px/32px
- **Price:** 16px monospace font (Roboto Mono) — prevent reading errors

### Component Library
- **Material-UI v5:** base components (Button, Dialog, Table, TextField)
- **Ant Design v5:** complex tables, charts, forms
- **Tailwind CSS:** utility classes for layout/spacing

## Page Wireframes

### 1. Login Page

```
┌──────────────────────────────────────────┐
│                                          │
│           [Logo] POS Omnichannel        │
│                                          │
│         ┌────────────────────┐           │
│         │                    │           │
│         │  Username          │           │
│         │  ┌──────────────┐  │           │
│         │  │              │  │           │
│         │  └──────────────┘  │           │
│         │                    │           │
│         │  Password          │           │
│         │  ┌──────────────┐  │           │
│         │  │ ••••••••     │  │           │
│         │  └──────────────┘  │           │
│         │                    │           │
│         │                    │           │
│         │  [  ĐĂNG NHẬP  ]   │           │
│         │                    │           │
│         │                    │           │
│         └────────────────────┘           │
│                                          │
└──────────────────────────────────────────┘
```

### 2. POS Page (Dark Theme)

```
┌──────────────────────────────────────────────────────────┐
│  [Dashboard] [POS ●] [Sản phẩm] [Tồn kho] [Đơn online]   │
├────────────────────────┬─────────────────────────────────┤
│                        │  💰  GIỎ HÀNG                    │
│  [Tìm kiếm barcode...] │─────────────────────────────────│
│  [Danh mục ▼]          │  Bún bò Huế     x2     60.000đ  │
│                        │  Cháo ếch        x1     45.000đ  │
│  ┌──────┬──────┬──────┐│─────────────────────────────────│
│  │ Pho   │ Cháo │ Cơm  ││                                  │
│  │ biến │  ếch │  gà  ││  Tổng:                    105.000đ│
│  └──────┴──────┴──────┘│                                  │
│  ┌──────┬──────┬──────┐│  [ Tiền khách ]  [ Thanh toán ] │
│  │ Phở   │ Bún   │ Xôi  ││                                  │
│  │ bò   │  bò   │ gấc  ││                                  │
│  └──────┴──────┴──────┘│                                  │
│  ┌──────┬──────┬──────┐│  [ In hóa đơn ] [ Hủy đơn ]     │
│  │ Chè   │ Mì   │ Hủ   ││                                  │
│  │ chuối │ đỏ  │ tiếu ││                                  │
│  └──────┴──────┴──────┘│                                  │
│                        │                                  │
└────────────────────────┴─────────────────────────────────┘
```

### 3. Product List Page

```
┌──────────────────────────────────────────────────────────┐
│  ← Back   [Tìm kiếm...]   [Lọc: Tất cả ▼]   [+ Sản phẩm] │
│──────────────────────────────────────────────────────────│
│  Tên         │ Barcode │ Danh mục │ Giá bán │ Kho  │     │
│──────────────────────────────────────────────────────────│
│  Cháo ếch    │ ABC123  │ Cháo     │ 45.000đ │ 25   │     │
│  Phở bò      │ DEF456  │ Pho biến │ 60.000đ │ 50   │     │
│  Bún bò      │ GHI789  │ Pho biến │ 55.000đ │ 30   │     │
│  Cơm gà      │ JKL012  │ Cơm      │ 40.000đ │ 0    │     │
│──────────────────────────────────────────────────────────│
│  [ 1 ]  2  3  ...  10     ← Hiển thị 20 mỗi trang        │
└──────────────────────────────────────────────────────────┘
```

### 4. BOM Editor

```
┌──────────────────────────────────────────────────────────┐
│  ← Back     BOM Editor: Cháo ếch hộp                    │
│──────────────────────────────────────────────────────────│
│  Nguyên liệu:                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Nguyên liệu        │ SL  │ Đơn vị │ Giá vốn │ Xóa │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ Nồi cháo           │  1  │ nồi    │ 10.000đ │ [X] │   │
│  │ Thịt ếch           │ 200 │ gram   │ 25.000đ │ [X] │   │
│  │ Gia vị             │  1  │ gói    │  3.000đ │ [X] │   │
│  │ Chén + muỗng       │  1  │ bộ     │  2.000đ │ [X] │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [+ Thêm nguyên liệu]                                    │
│                                                          │
│  Giá vốn hiệu dụng:                   40.000đ           │
│  Marging:                                       12.5%     │
│  Level nesting:                           1 (max 3)      │
│                                                          │
│  [  HỦY  ]     [  LƯU BOM  ]                            │
└──────────────────────────────────────────────────────────┘
```

### 5. Inventory Check

```
┌──────────────────────────────────────────────────────────┐
│  ← Back     Kiểm kho cuối ngày — 21/08/2026             │
│──────────────────────────────────────────────────────────│
│  Sản phẩm        │ Lý thuyết │ Actual │ Variance │ Hao hụt│
│──────────────────────────────────────────────────────────│
│  Nồi cháo        │     50    │   48   │    -2    │ 20.000 │
│  Thịt ếch (g)    │    5000   │  4800  │   -200   │ 50.000 │
│  Gia vị          │    200    │  200   │     0    │      0 │
│  Chén + muỗng    │    100    │   97   │    -3    │  6.000 │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Tổng hao hụt:                                76.000đ    │
│                                                          │
│  [  LƯU KẾT QUẢ  ]                                       │
└──────────────────────────────────────────────────────────┘
```

### 6. Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  Dashboard — 21/08/2026                                  │
│──────────────────────────────────────────────────────────│
│  ┌──────────────┬──────────────┬──────────────┐         │
│  │ Doanh thu    │ Số đơn hôm   │ Top SP bán   │         │
│  │ 2.450.000đ  │ nay: 45      │ chạy: 1      │         │
│  │ (+12% so với │              │ Cháo ếch: 12 │         │
│  │  hôm qua)    │              │ Phở bò: 8    │         │
│  └──────────────┴──────────────┴──────────────┘         │
│                                                          │
│  Doanh thu 7 ngày qua:                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ██  ██  ▓▓  ▒▒  ██  ██  ▓▓                      │   │
│  │  T2  T3  T4  T5  T6  T7  T8                      │   │
│  │  1.2M 1.5M 1.1M 1.8M 2.1M 2.4M 2.2M             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Cảnh báo:                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ⚠ Cơm gà: còn 0 (min: 5)                        │   │
│  │ ⚠ Đơn #ORD-089 chờ 18 phút → RED                │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Mobile App Wireframes

### Mobile POS Screen

```
┌─────────────────────────────┐
│  ← POS     💳 105.000đ     │
│─────────────────────────────│
│  [🔍 Tìm sản phẩm...]        │
│─────────────────────────────│
│  [Tất cả] [Cháo] [Phở]      │
│─────────────────────────────│
│  ┌──────────┐ ┌──────────┐  │
│  │ Cháo ếch │ │ Phở bò   │  │
│  │ 45.000đ  │ │ 60.000đ  │  │
│  │    [+👆] │ │    [+👆] │  │
│  └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │ Bún bò   │ │ Cơm gà   │  │
│  │ 55.000đ  │ │ 40.000đ  │  │
│  │    [+👆] │ │    [+👆] │  │
│  └──────────┘ └──────────┘  │
│                             │
│─────────────────────────────│
│  🛒 Cháo ếch x2  90.000đ    │
│  🛒 Phở bò x1   60.000đ    │
│  ──────────────────────     │
│  Tổng:              150.000 │
│  [💵 Thanh toán]            │
└─────────────────────────────┘
```

## Visual Design Tokens

```css
/* Design Tokens — Material-UI + Tailwind */
:root {
  --color-primary: #1976D2;
  --color-primary-dark: #115293;
  --color-secondary: #424242;
  --color-success: #2E7D32;
  --color-warning: #F57C00;
  --color-error: #C62828;
  --color-bg: #FAFAFA;
  --color-bg-pos: #212121;
  --color-text: #212121;
  --color-text-light: #757575;
  --color-text-pos: #EEEEEE;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-card: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-dialog: 0 8px 24px rgba(0,0,0,0.15);
}
```

## Responsive Breakpoints

- **Desktop:** > 1024px — full sidebar, 2-column POS layout
- **Tablet:** 768px–1024px — collapsible sidebar, adjusted grid
- **Mobile:** < 768px — hamburger menu, single column, larger touch targets (48px min)

## Interaction Patterns

1. **Add to cart:** Click/tap product card → animated slide-in to cart panel → cart count badge updates
2. **Barcode scan:** Input field auto-focuses → on scan event, product auto-added to cart with haptic feedback (mobile)
3. **Payment confirmation:** Modal overlay → enter amount → auto-calculate change → confirm → success animation
4. **Inventory check:** Long press on stock row → inline input for actual qty → swipe to confirm variance
5. **Pull-to-refresh:** Mobile only — pull down to sync data when online
