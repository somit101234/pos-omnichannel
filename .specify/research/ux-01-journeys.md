# UX Journey — POS Omnichannel MVP

**Spec:** .specify/specs/001-POS-Omnichannel-MVP/spec.md

## Journey 1: Cashier Daily Workflow (POS + Shift)

**Actor:** Cashier
**Outcome:** Bán hàng hiệu quả trong ca làm, không lỗi hệ thống

### Activities & Steps

1. **Đăng nhập** → nhập username/password → nhận token → vào dashboard
2. **Bắt đầu ca làm** → click "Bắt đầu ca" → tạo shift record → vào POS page
3. **Bán hàng:**
   - Quét barcode sản phẩm → sản phẩm thêm vào cart
   - Hoặc chọn từ grid theo category
   - Cập nhật quantity, xóa sản phẩm
   - Tổng tiền tự động tính
4. **Thanh toán:**
   - Chọn cash hoặc card
   - Cash: nhập tiền khách đưa → hệ thống tính tiền thừa
   - Hoàn tất → tự trừ tồn kho → in hóa đơn thermal
5. **Quản lý đơn online:**
   - Xem danh sách đơn pending
   - Accept/reject đơn
   - Theo dõi đơn >15 phút (cảnh báo đỏ)
6. **Kết thúc ca làm:**
   - Click "Kết thúc ca" → tính duration, total sales
   - Hệ thống cảnh báo nếu ca > 8h

### Empty States
- **Cart rỗng:** "Chưa có sản phẩm — quét barcode hoặc chọn từ grid"
- **Không có đơn online:** "Không có đơn hàng chờ xử lý"

### Error States
- **Tài khoản bị khóa:** "Tài khoản đã bị khóa do đăng nhập sai nhiều lần. Vui lòng liên hệ quản lý."
- **Hết hàng:** "Sản phẩm [name] đã hết hàng" (không thêm được vào cart)
- **Lỗi in hóa đơn:** "Không kết nối được máy in — vui lòng kiểm tra kết nối"

---

## Journey 2: Owner Multi-store Management

**Actor:** Owner
**Outcome:** Quản lý nhiều cửa hàng, xem báo cáo tổng hợp

### Activities & Steps

1. **Đăng nhập** → dashboard tổng hợp
2. **Quản lý cửa hàng:**
   - Thêm cửa hàng mới → điền name, address, phone, tax code
   - Chỉnh sửa thông tin cửa hàng
   - Xóa cửa hàng (nếu không có dữ liệu)
3. **Xem báo cáo:**
   - Dashboard: doanh thu theo store, số đơn theo store
   - Report: doanh thu theo ngày/tuần/tháng với date range filter
   - Export báo cáo ra Excel
4. **Chuyển kho giữa store:**
   - Chọn store nguồn và store đích
   - Chọn sản phẩm + số lượng
   - Xác nhận chuyển → tạo transfer record
5. **Quản lý nhân viên:**
   - Tạo nhân viên mới → điền thông tin → gán role
   - Xem danh sách nhân viên theo store
   - Vô hiệu hóa/tái kích hoạt nhân viên

---

## Journey 3: Product + BOM Setup

**Actor:** Owner/Manager
**Outcome:** Thiết lập sản phẩm với BOM, giá vốn chính xác

### Activities & Steps

1. **Tạo danh mục** (Category):
   - Thêm category cha (vd: "Cháo")
   - Thêm category con (vd: "Cháo ếch", "Cháo gà")
2. **Tạo sản phẩm thường:**
   - Điền name, barcode (tự động hoặc nhập), category, unit
   - Nhập cost price, sale price, min stock
3. **Tạo sản phẩm BOM:**
   - Tạo sản phẩm (vd: "Cháo ếch hộp") với isBom=true
   - Mở BOM Editor → thêm nguyên liệu (nồi cháo, thịt ếch, gia vị)
   - Nhập số lượng mỗi nguyên liệu
   - Hệ thống tự động tính giá vốn recursive
   - Cảnh báo nếu phát hiện circular reference
4. **Kiểm tra giá vốn:**
   - Xem effective cost trên product card
   - So sánh với sale price → margin %

---

## Journey 4: Inventory Check & Purchase

**Actor:** Owner/Manager
**Outcome:** Kiểm kho cuối ngày, nhập hàng từ nhà cung cấp

### Activities & Steps

1. **Kiểm kho cuối ngày:**
   - Vào Inventory → Inventory Check
   - Nhập actual qty cho từng sản phẩm
   - Xem variance (theoretical - actual)
   - Xem hao hụt cost (|variance| × unit_cost)
2. **Nhập hàng từ supplier:**
   - Tạo Purchase Order → chọn supplier
   - Thêm sản phẩm + số lượng + giá nhập
   - Gửi PO → trạng thái PENDING
3. **Nhận hàng từ PO:**
   - Chọn PO → Nhận hàng
   - Hệ thống tự động cộng tồn kho
   - Tự động cập nhật weighted average cost
4. **Cảnh báo tồn thấp:**
   - Dashboard hiển thị các sản phẩm dưới min_stock
   - Click vào → gợi ý đặt hàng từ supplier

---

## Journey 5: Mobile App (Owner/Manager Remote)

**Actor:** Mobile App User
**Outcome:** Xem báo cáo, approve refund, POS từ xa

### Activities & Steps

1. **Đăng nhập mobile** → JWT token → lưu local
2. **Xem báo cáo:**
   - Dashboard: doanh thu hôm nay, số đơn
   - Chart: doanh thu theo ngày
   - Top 5 sản phẩm bán chạy
3. **Approve/Reject refund:**
   - Nhận notification có đơn refund
   - Xem chi tiết đơn → approve hoặc reject
4. **Mobile POS:**
   - Chọn sản phẩm từ grid
   - Thêm vào cart
   - Thanh toán (cash/card)
   - In hóa đơn qua Bluetooth/WiFi printer

### Offline Mode
- **Không có mạng:** vẫn xem được sản phẩm đã cache, thêm vào cart, thanh toán
- **Có mạng:** tự động sync dữ liệu mới lên server
