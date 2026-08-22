# Page Contract: Electron Desktop App

ACTOR
**User**: Owner/Manager/Cashier sử dụng desktop app tại cửa hàng

PRECONDITION
Desktop app đã được cài đặt và khởi động. Local SQLite database đã được tạo hoặc đang trong quá trình sync. Thermal printer đã được kết nối (nếu có).

SUCCESS STATE
- Electron app chạy và hiển thị giao diện POS
- Người dùng có thể xem danh sách sản phẩm
- Người dùng có thể thêm sản phẩm vào giỏ hàng
- Người dùng có thể thanh toán và in hóa đơn
- Dữ liệu được lưu vào SQLite local

EMPTY STATE
Không có sản phẩm trong database → hiển thị placeholder "Đang tải sản phẩm...".

ERROR STATE
- Lỗi kết nối database → console log lỗi, app vẫn chạy với UI placeholder
- Lỗi in hóa đơn → thông báo lỗi nhưng giao dịch vẫn được lưu

PRIMARY INTERACTION
1. Load sản phẩm từ SQLite
2. Click sản phẩm → thêm vào giỏ
3. Giỏ hàng hiển thị danh sách + tổng tiền
4. Chọn phương thức thanh toán (Tiền mặt/Thẻ)
5. In hóa đơn

NEGATIVE ORACLE
- Không thể thêm sản phẩm khi không có internet (không yêu cầu)
- Không thể thanh toán khi giỏ hàng trống → alert "Giỏ hàng trống"
