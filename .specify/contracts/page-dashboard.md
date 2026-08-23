# ACTOR
Người dùng muốn xem tổng quan doanh thu sau khi đăng nhập

# PRECONDITION
- Người dùng đã đăng nhập thành công
- Tài khoản có vai trò OWNER/MANAGER/CASHIER

# SUCCESS STATE
Dashboard hiển thị:
- Doanh thu hôm nay (định dạng VND)
- Số đơn hàng hôm nay
- Bảng top 5 sản phẩm bán chạy với STT, tên, số lượng

# EMPTY STATE
Khi chưa có đơn hàng (mock data): bảng top 5 rỗng hoặc hiển thị thông báo "Chưa có dữ liệu"

# ERROR STATE
Nếu API lỗi: hiển thị thông báo lỗi thay vì dữ liệu

# PRIMARY INTERACTION
Người dùng đăng nhập thành công, hệ thống tự động load dữ liệu dashboard

# NEGATIVE ORACLE
- Không cho phép truy cập /dashboard nếu chưa đăng nhập (sẽ redirect về /login)
- Không cho phép thay đổi dữ liệu trực tiếp từ UI
