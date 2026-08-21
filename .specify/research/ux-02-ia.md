# Information Architecture — POS Omnichannel

**Spec:** .specify/specs/001-POS-Omnichannel-MVP/spec.md

## Navigation Structure (Web Frontend)

### Sidebar Menu (role-based)

```
┌─── Sidebar ──────────────────────────────────────┐
│                                                    │
│  [Logo] POS Omnichannel                           │
│                                                    │
│  ├── Dashboard (all roles)                        │
│  │                                                    │
│  ├── POS (Cashier, Manager, Owner)                 │
│  │                                                    │
│  ├── Sản phẩm (Owner, Manager)                     │
│  │   ├── Danh sách sản phẩm                        │
│  │   ├── Tạo sản phẩm mới                          │
│  │   └── BOM Editor                                 │
│                                                    │
│  ├── Danh mục (Owner, Manager)                     │
│  │                                                    │
│  ├── Tồn kho (Owner, Manager)                      │
│  │   ├── Danh sách tồn kho                         │
│  │   └── Kiểm kho                                   │
│                                                    │
│  ├── Nhập hàng (Owner, Manager)                    │
│  │   ├── Nhà cung cấp                              │
│  │   └── Purchase Orders                           │
│                                                    │
│  ├── Đơn hàng online (Cashier, Manager, Owner)    │
│  │                                                    │
│  ├── Báo cáo (Owner, Manager, Cashier)            │
│  │   ├── Doanh thu                                  │
│  │   ├── Lợi nhuận                                  │
│  │   └── Xuất Excel                                │
│                                                    │
│  ├── Nhập nền tảng (Cashier, Manager)             │
│  │   ├── Shopee Import                             │
│  │   ├── GrabFood Import                           │
│  │   └── BeFood Import                             │
│                                                    │
│  ├── Nhân viên (Owner)                            │
│  │                                                    │
│  ├── Ca làm (All roles)                           │
│  │                                                    │
│  ├── Đa cửa hàng (Owner)                          │
│  │   ├── Danh sách cửa hàng                        │
│  │   ├── Chuyển kho                                │
│  │   └── Dashboard tổng hợp                        │
│                                                    │
│  ├── Cài đặt (Owner)                              │
│  │   ├── Thông tin cửa hàng                        │
│  │   ├── Cấu hình in hóa đơn                       │
│  │   └── Đơn vị đo lường                           │
│                                                    │
│  ├── [User] Logout                                │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Page Hierarchy

### Level 1: Top-level pages
1. **Dashboard** — overview, charts, KPIs
2. **POS** — điểm bán hàng chính
3. **Sản phẩm** — CRUD sản phẩm + BOM
4. **Danh mục** — category management
5. **Tồn kho** — stock levels + inventory check
6. **Nhập hàng** — supplier + PO
7. **Đơn hàng online** — platform orders
8. **Báo cáo** — revenue/profit reports
9. **Nhập nền tảng** — platform import adapters
10. **Nhân viên** — staff management
11. **Ca làm** — shift management
12. **Đa cửa hàng** — multi-store management
13. **Cài đặt** — system settings

### Level 2: Sub-pages
- **Sản phẩm** → Product List, Product Form, BOM Editor
- **Tồn kho** → Stock List, Inventory Check Modal
- **Nhập hàng** → Supplier List, PO List, PO Form, Receive Modal
- **Báo cáo** → Revenue Chart, Profit Table, Export Button

## State Management (Zustand Store Structure)

```
stores/
├── authStore.ts       # user, storeId, roles, token, isLoading
├── cartStore.ts       # items[], total, subtotal
├── productStore.ts    # products[], categories[], loading
├── reportStore.ts     # dateRange, revenueData, profitData
├── posStore.ts        # currentTransaction, paymentMethod
├── inventoryStore.ts  # stockLevels, variances
├── onlineOrderStore.ts # orders[], filters
└── uiStore.ts         # sidebarCollapsed, theme, notifications
```

## API Route Structure (Backend)

```
/api/
├── auth/
│   ├── POST /login
│   ├── POST /refresh
│   └── POST /logout
├── products/
│   ├── GET /
│   ├── POST /
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   ├── POST /barcode/generate
│   └── POST /:id/unit-conversions
├── categories/
│   ├── GET /
│   ├── POST /
│   ├── PUT /:id
│   └── DELETE /:id
├── bom/
│   ├── POST / (create BOM)
│   ├── GET /:id/cost (calculate cost)
│   └── POST /:id/validate (circular check)
├── pos/
│   ├── POST /checkout
│   └── GET /transactions
├── inventory/
│   ├── GET /stock
│   ├── POST /check
│   └── GET /alerts
├── purchase/
│   ├── GET /suppliers
│   ├── POST /suppliers
│   ├── GET /orders
│   ├── POST /orders
│   └── POST /orders/:id/receive
├── reports/
│   ├── GET /revenue
│   ├── GET /profit
│   ├── GET /dashboard
│   └── GET /export
├── invoice/
│   ├── GET /receipt/:orderId
│   └── POST /receipt/preview
├── import/
│   ├── POST /preview
│   └── POST /commit
├── staff/
│   ├── GET /
│   ├── POST /
│   └── PUT /:id
├── shift/
│   ├── POST /start
│   ├── POST /end
│   └── GET /history
├── online-orders/
│   ├── GET /
│   ├── POST /:id/accept
│   ├── POST /:id/reject
│   └── POST /:id/refund
├── multi-store/
│   ├── GET /stores
│   ├── POST /stores
│   ├── PUT /stores/:id
│   ├── DELETE /stores/:id
│   ├── POST /stores/:id/warehouses
│   └── POST /transfer
├── mobile-sync/
│   ├── PUT /sync/:entityType/:id
│   └── GET /dashboard
└── ws/ (Socket.io)
    └── /stores/{storeId}
```

## Database Entity Relationships (simplified)

```
User ──→ Store (storeId FK)
Store ──→ Warehouse (storeId FK)
Store ──→ Product (storeId FK)
Store ──→ Category (storeId FK)
Store ──→ Transaction (storeId FK)
Store ──→ OnlineOrder (storeId FK)
Store ──→ Shift (storeId FK)
Store ──→ Supplier (storeId FK)
Store ──→ AuditLog (storeId FK)

Product ──→ Category (categoryId FK)
Product ──→ BomItem (bomProductId FK) ← recursive
BomItem ──→ Product (ingredientProductId FK)
Product ──→ Stock (productId FK)
Stock ──→ Warehouse (warehouseId FK)
Transaction ──→ TransactionItem
TransactionItem ──→ Product
Transaction ──→ User (cashierId FK)
```
