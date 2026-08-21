# Spec: POS Omnichannel — Hệ thống bán hàng đa kênh chuyên nghiệp

**Ngày:** 2026-08-21 · **Slug:** 001-POS-Omnichannel-MVP
**MODE:** 3 (CRITICAL)

## PROJECT CONTEXT / UX Delivery Profile

**PROJECT CONTEXT:** greenfield
**CHANGE STRATEGY:** extend (xây mới nền tảng POS cho F&B + retail, multi-store, multi-channel)
**BEHAVIOR CONTRACT:** none (greenfield, không có hành trình cũ để giữ)

---

## Danh sách Actors (8 actors — mở rộng từ 7 actors của POS Lite)

| STT | Actor | Vai trò | Quyền hạn |
|-----|-------|---------|-----------|
| 1 | **Chủ cửa hàng (Owner)** | Admin cấp cao nhất — quản lý toàn bộ hệ thống đa cửa hàng | Toàn quyền: tạo tài khoản, xem báo cáo, sửa BOM, cài đặt, hủy đơn, refund, quản lý multi-store |
| 2 | **Quản lý (Manager)** | Admin cấp trung — quản lý 1 cửa hàng | Xem báo cáo, quản lý nhân viên, ca làm, đơn hàng, hủy đơn |
| 3 | **Thu ngân (Cashier)** | Staff bán hàng | Bán hàng POS, in hóa đơn, quét barcode, thêm giỏ hàng |
| 4 | **Khách hàng (Customer)** | Khách mua hàng | Mua hàng tại quầy, mua hàng online (Shopee/GrabFood/BeFood/TikTok) |
| 5 | **Nhà cung cấp (Supplier)** | Cung cấp nguyên liệu | Nhập hàng, phiếu nhập, giá nhập |
| 6 | **Hệ thống (System)** | Tự động | Tính giá vốn, trừ tồn kho, cảnh báo, sync offline, generate báo cáo, AI prediction |
| 7 | **Mobile App User** | Khách hàng/Staff dùng mobile | Xem báo cáo, approve refund, bán hàng từ điện thoại |
| 8 | **Livestream Researcher** | Nghiên cứu Live Shopping API | Research API TikTok Shop, Youtube Shopping, AI-driven live selling trends |

---

## Success Criteria

- **SC-001:** Với ví dụ cháo ếch trong spec, hệ thống tính ra giá vốn khớp số tay của người dùng (sai lệch 0 đồng).
- **SC-002:** 100% Acceptance Scenario sinh ra được unit test, toàn bộ test pass khi chạy `npm run test`.
- **SC-003:** Luồng bán hàng → kiểm kho cuối ngày → import đơn nền tảng chạy offline hoàn toàn, không cần mạng.
- **SC-004:** Không có lỗi circular reference, BOM nesting <= 3 cấp.
- **SC-005:** Không dùng float cho tiền tệ — toàn bộ tính toán dùng số nguyên VNĐ hoặc BigInt.
- **SC-006:** Mobile app hoạt động offline hoàn toàn, sync khi có mạng.
- **SC-007:** Multi-store: Owner quản lý ≥5 cửa hàng, mỗi cửa hàng có kho riêng, dashboard tổng hợp.
- **SC-008:** AI Prediction: mô hình dự báo doanh thu ±5% sai số, dự báo nguyên liệu cần nhập.

---

## Assumptions

- Đây là dự án greenfield — không có code sẵn để verify; SA sẽ chốt kỹ thuật trong Plan.
- MVP ưu tiên nền tảng + nghiệp vụ cốt lõi. Google Drive sync, marketing nâng cao là giai đoạn sau.
- Template Excel import: cột mặc định "OrderID, Product, Quantity, SalePrice, PlatformFee%". SA sẽ chốt chi tiết.
- Mobile app kết nối backend qua REST API, cache local cho offline.
- Desktop (Electron) truy cập database trực tiếp qua better-sqlite3.
- Multi-store: mỗi store có warehouse riêng, Owner xem dashboard tổng hợp.
- Live Shopping API: research/nghiên cứu trước, chưa tích hợp version 1.

---

## User Stories

### US1 — Auth & RBAC (P1)
**Actors:** Owner, Manager, Cashier
- Đăng nhập bằng username + password, JWT token
- Owner tạo/xóa tài khoản, phân quyền
- Khóa tài khoản sau 5 lần đăng nhập sai (30 phút)
- Middleware RBAC kiểm tra quyền trước mỗi hành động

### US2 — Bán hàng POS (P1)
**Actors:** Cashier, Customer
- Quét barcode hoặc chọn sản phẩm từ grid
- Cart hiển thị danh sách, quantity, subtotal, total
- Thanh toán cash/card, tính tiền thừa
- Tự trừ tồn kho sau giao dịch
- Cảnh báo tồn thấp

### US3 — Quản lý sản phẩm (P1)
**Actors:** Owner, Manager
- CRUD sản phẩm với đầy đủ field: name, barcode, category, unit, cost_price, sale_price, min_stock
- Tạo barcode tự động hoặc nhập thủ công
- Đơn vị tính hỗ trợ: kg, g, lít, ml, cái, hộp, thùng với tỷ lệ quy đổi
- BOM product — sản phẩm có BOM, khi bán trừ tồn nguyên liệu BOM

### US4 — BOM + Giá vốn (P1)
**Actors:** Owner, Manager
- Owner tạo BOM với danh sách nguyên liệu và chi phí biến đổi
- Hệ thống tính giá vốn recursive, max 3 cấp
- Circular reference detection
- Weighted average cost update khi nhập hàng

### US5 — Nhập hàng + Nhà cung cấp (P2)
**Actors:** Owner, Manager, Supplier
- CRUD Supplier với name, phone, address
- Tạo Purchase Order chọn Supplier và danh sách sản phẩm + quantity
- Nhận hàng từ PO → tự động cộng tồn kho
- Weighted average cost update

### US6 — Kiểm kho (P2)
**Actors:** Owner, Manager, System
- Kiểm kho cuối ngày: so sánh theoretical vs actual stock
- Tính variance và hao hụt (cost)
- System tự động cảnh báo tồn thấp hàng đêm
- Manager xem báo cáo kiểm kho theo ngày/tuần/tháng

### US7 — Báo cáo + AI Prediction (P2)
**Actors:** Owner, Manager, System
- Dashboard hiển thị tổng quan: doanh thu hôm nay, số đơn, top 5 sản phẩm bán chạy
- Báo cáo doanh thu theo ngày/tuần/tháng với filter date range
- Báo cáo lợi nhuận = doanh thu - giá vốn - platform fee
- **AI Prediction:** mô hình dự báo doanh thu ±5% sai số, dự báo nguyên liệu cần nhập
- Export báo cáo ra Excel (.xlsx)

### US8 — In hóa đơn (P1)
**Actors:** Cashier, System
- In hóa đơn thermal tự động sau khi thanh toán
- Template hóa đơn: tên cửa hàng, địa chỉ, MST, danh sách sản phẩm, total, tiền thừa
- Hỗ trợ 2 khổ giấy: 58mm và 80mm
- Reprint hóa đơn theo OrderID

### US9 — Import đơn hàng nền tảng (P2)
**Actors:** Cashier, Manager
- Import đơn hàng từ 3 nền tảng: Shopee, GrabFood, BeFood qua file Excel
- Mỗi nền tảng có format Excel khác nhau → adapter pattern
- Tính platform_fee = price × fee% sau khi import
- Preview trước khi import

### US10 — Danh mục (P2)
**Actors:** Owner, Manager
- CRUD Category với name, parent_id (hierarchical, 1 cấp)
- Sản phẩm thuộc tối đa 1 category
- Danh sách sản phẩm filter theo category
- Category hiển thị trong POS grid (nhóm theo category)

### US11 — Quản lý nhân viên (P2)
**Actors:** Owner, Manager
- Owner tạo nhân viên mới (gắn với tài khoản)
- Owner xem danh sách nhân viên với role badge
- Owner phân vai trò cho nhân viên
- Manager xem danh sách nhân viên (readonly)
- Owner vô hiệu hóa/tái kích hoạt tài khoản nhân viên (soft delete)

### US12 — Quản lý ca làm (P2)
**Actors:** Owner, Manager, Cashier, System
- Cashier bắt đầu/kết thúc ca làm
- Owner/Manager xem lịch sử ca làm: date, cashier, start, end, duration, total_sales
- System cảnh báo khi ca > 8 giờ
- Manager force-close ca nếu Cashier quên đóng

### US13 — Đơn hàng online (P3)
**Actors:** Cashier, Manager, Customer, System
- Hiển thị danh sách đơn online pending/processing/ready/delivered
- Cashier xác nhận (accept) hoặc từ chối (reject) đơn hàng
- System cảnh báo đơn chờ > 15 phút → RED status
- Customer yêu cầu refund → Owner/Manager review

### US14 — Multi-store Management (P2)
**Actors:** Owner
- Owner tạo/xóa/sửa cửa hàng
- Mỗi cửa hàng có kho riêng, nhân viên riêng
- Dashboard tổng hợp doanh thu theo store
- Chuyển kho giữa các store (transfer)
- Báo cáo tổng hợp multi-store

### US15 — Mobile App (P2)
**Actors:** Mobile App User (Owner, Manager, Cashier)
- Mobile app kết nối backend qua REST API
- Cache local cho offline mode
- Xem báo cáo, approve refund từ xa
- Bán hàng từ điện thoại (POS mobile)
- Sync khi có mạng

### US16 — Live Shopping Research (P1-Research)
**Actors:** Livestream Researcher
- Nghiên cứu TikTok Shop API, Youtube Shopping API
- Phân tích AI-driven live selling trends
- Đề xuất tích hợp live shopping cho version tiếp theo
- Không tích hợp trong MVP version 1

---

## Functional Requirements

- **FR-001:** Hệ thống xác thực người dùng bằng username + password, trả về JWT token
- **FR-002:** Owner có thể tạo tài khoản mới với vai trò đã chọn
- **FR-003:** Owner có thể xóa tài khoản (soft delete + audit log)
- **FR-004:** Hệ thống khóa tài khoản sau 5 lần đăng nhập sai liên tiếp (30 phút)
- **FR-005:** Middleware RBAC kiểm tra quyền trước mỗi hành động protected route
- **FR-006:** Cashier có thể quét barcode hoặc chọn sản phẩm từ grid để thêm vào giỏ hàng
- **FR-007:** Cart hiển thị danh sách sản phẩm, quantity, subtotal, total
- **FR-008:** Thanh toán hỗ trợ cash và card, tính tiền thừa cho cash
- **FR-009:** Sau thanh toán thành công, tồn kho được trừ và hóa đơn được in
- **FR-010:** Nếu tồn kho = 0, hệ thống chặn thêm sản phẩm vào cart
- **FR-011:** CRUD sản phẩm với đầy đủ field: name, barcode, category, unit, cost_price, sale_price, min_stock
- **FR-012:** Tạo barcode tự động (UUID) hoặc nhập thủ công
- **FR-013:** Đơn vị tính hỗ trợ: kg, g, lít, ml, cái, hộp, thùng với tỷ lệ quy đổi
- **FR-014:** Cost price dùng số nguyên VNĐ, sale_price dùng số nguyên VNĐ
- **FR-015:** Min_stock để cảnh báo tồn kho thấp
- **FR-016:** Multi-unit conversion — sản phẩm có nhiều đơn vị (vd 1 nồi = 20 hộp), tỷ lệ quy đổi
- **FR-017:** BOM product — sản phẩm có BOM (is_bom=true), khi bán trừ tồn nguyên liệu BOM thay vì chính nó
- **FR-018:** BOM product có nhiều đơn vị — BOM apply unit conversion (vd 1 hộp cháo = 1/20 nồi)
- **FR-019:** Owner tạo BOM với danh sách nguyên liệu (product_id, quantity) và chi phí biến đổi
- **FR-020:** Hệ thống tính giá vốn recursive theo chain BOM, max 3 cấp
- **FR-021:** Circular reference detection — không lưu BOM nếu A→B→C→A
- **FR-022:** Weighted average cost — update giá vốn nguyên liệu khi nhập hàng mới
- **FR-023:** CRUD Supplier với name, phone, address
- **FR-024:** Tạo Purchase Order (PO) chọn Supplier và danh sách sản phẩm + quantity
- **FR-025:** Nhận hàng từ PO → tự động cộng tồn kho
- **FR-026:** Weighted average cost update khi nhập hàng với giá khác
- **FR-027:** PO có các status: PENDING, PARTIAL, COMPLETED, CANCELLED
- **FR-028:** Owner thực hiện inventory check: nhập actual qty cho từng sản phẩm
- **FR-029:** Hệ thống tính variance = theoretical - actual cho từng sản phẩm
- **FR-030:** Tính hao hụt cost = |variance| × unit_cost cho sản phẩm thiếu
- **FR-031:** System tự động tính theoretical stock hàng đêm, gửi cảnh báo cho Owner
- **FR-032:** Manager xem báo cáo kiểm kho theo ngày/tuần/tháng
- **FR-033:** Dashboard hiển thị tổng quan: doanh thu hôm nay, số đơn, top 5 sản phẩm bán chạy
- **FR-034:** Báo cáo doanh thu theo ngày/tuần/tháng với filter date range
- **FR-035:** Báo cáo lợi nhuận = doanh thu - giá vốn (từ BOM) - platform fee
- **FR-036:** **AI Prediction:** mô hình dự báo doanh thu ±5% sai số, dự báo nguyên liệu cần nhập
- **FR-037:** Export báo cáo ra Excel (.xlsx)
- **FR-038:** In hóa đơn thermal tự động sau khi thanh toán thành công
- **FR-039:** Template hóa đơn: tên cửa hàng, địa chỉ, MST, danh sách sản phẩm, total, tiền thừa
- **FR-040:** Hỗ trợ 2 khổ giấy: 58mm và 80mm (config trong settings)
- **FR-041:** Reprint hóa đơn theo OrderID (Owner/Manager)
- **FR-042:** Hóa đơn ghi nhận nguồn: POS, SHOEPEE, GRABFOOD, BEOFORD
- **FR-043:** Upload file Excel (.xlsx) cho từng platform
- **FR-044:** Shopee adapter: flat file, group by Order ID
- **FR-045:** GrabFood adapter: 2 sheets (Orders + Items), join by Order Number
- **FR-046:** BeFood adapter: flat file, group by Order ID
- **FR-047:** Tính platform_fee = price × fee% sau khi import
- **FR-048:** Preview trước khi import
- **FR-049:** CRUD Category với name, parent_id (hierarchical, 1 cấp)
- **FR-050:** Sản phẩm thuộc tối đa 1 category
- **FR-051:** Danh sách sản phẩm filter theo category
- **FR-052:** Không xóa category đang có sản phẩm
- **FR-053:** Category hiển thị trong POS grid (nhóm theo category)
- **FR-054:** Owner tạo nhân viên mới (gắn với tài khoản trong US1)
- **FR-055:** Owner xem danh sách nhân viên với role badge
- **FR-056:** Owner phân vai trò cho nhân viên
- **FR-057:** Manager xem danh sách nhân viên (readonly)
- **FR-058:** Owner vô hiệu hóa/tái kích hoạt tài khoản nhân viên (soft delete)
- **FR-059:** Cashier nhấn "Bắt đầu ca" → tạo shift record (status=ACTIVE)
- **FR-060:** Cashier nhấn "Kết thúc ca" → đóng shift, tính duration
- **FR-061:** Owner/Manager xem lịch sử ca làm: date, cashier, start, end, duration, total_sales
- **FR-062:** System cảnh báo khi ca > 8 giờ
- **FR-063:** Manager force-close ca nếu Cashier quên đóng
- **FR-064:** Hiển thị danh sách đơn online pending/processing/ready/delivered
- **FR-065:** Cashier xác nhận (accept) hoặc từ chối (reject) đơn hàng
- **FR-066:** System cảnh báo đơn chờ > 15 phút → RED status
- **FR-067:** Customer yêu cầu refund → Owner/Manager review
- **FR-068:** Owner tạo/xóa/sửa cửa hàng (multi-store)
- **FR-069:** Mỗi cửa hàng có kho riêng, nhân viên riêng
- **FR-070:** Dashboard tổng hợp doanh thu theo store
- **FR-071:** Chuyển kho giữa các store (transfer)
- **FR-072:** Báo cáo tổng hợp multi-store
- **FR-073:** Mobile app kết nối backend qua REST API
- **FR-074:** Cache local cho offline mode
- **FR-075:** Xem báo cáo, approve refund từ xa
- **FR-076:** Bán hàng từ điện thoại (POS mobile)
- **FR-077:** Sync khi có mạng
- **FR-078:** Nghiên cứu TikTok Shop API, Youtube Shopping API
- **FR-079:** Phân tích AI-driven live selling trends
- **FR-080:** Đề xuất tích hợp live shopping cho version tiếp theo

---

## Success Criteria

- **SC-001:** Với ví dụ cháo ếch trong spec, hệ thống tính ra giá vốn khớp số tay của người dùng (sai lệch 0 đồng).
- **SC-002:** 100% Acceptance Scenario sinh ra được unit test, toàn bộ test pass khi chạy `npm run test`.
- **SC-003:** Luồng bán hàng → kiểm kho cuối ngày → import đơn nền tảng chạy offline hoàn toàn, không cần mạng.
- **SC-004:** Không có lỗi circular reference, BOM nesting <= 3 cấp.
- **SC-005:** Không dùng float cho tiền tệ — toàn bộ tính toán dùng số nguyên VNĐ hoặc BigInt.
- **SC-006:** Mobile app hoạt động offline hoàn toàn, sync khi có mạng.
- **SC-007:** Multi-store: Owner quản lý ≥5 cửa hàng, mỗi cửa hàng có kho riêng, dashboard tổng hợp.
- **SC-008:** AI Prediction: mô hình dự báo doanh thu ±5% sai số, dự báo nguyên liệu cần nhập.

---

## Assumptions

- Đây là dự án greenfield — không có code sẵn để verify; SA sẽ chốt kỹ thuật trong Plan.
- MVP ưu tiên nền tảng + nghiệp vụ cốt lõi. Google Drive sync, marketing nâng cao là giai đoạn sau.
- Template Excel import: cột mặc định "OrderID, Product, Quantity, SalePrice, PlatformFee%". SA sẽ chốt chi tiết.
- Mobile app kết nối backend qua REST API, cache local cho offline.
- Desktop (Electron) truy cập database trực tiếp qua better-sqlite3.
- Multi-store: mỗi store có warehouse riêng, Owner xem dashboard tổng hợp.
- Live Shopping API: research/nghiên cứu trước, chưa tích hợp version 1.
